import { Hono } from "hono";

import { InteractionResponseType, InteractionType, verifyKey } from "discord-interactions";

import { Bindings } from "./Bindings.js";
import { EventRecorder } from "./EventRecorder.js";
import { MATCHCLOCK_COMMAND } from "./bot/commands.js";
import { handleMatchclock } from "./bot/handleMatchclock.js";

const app = new Hono<{ Bindings: Bindings }>();

interface DiscordInteraction {
  readonly type: InteractionType;
}

app.post("/", async (c) => {
  const { DISCORD_PUBLIC_KEY } = c.env;
  if (!DISCORD_PUBLIC_KEY) {
    throw new Error("DISCORD_PUBLIC_KEY is not set");
  }

  const signature = c.req.header("X-Signature-Ed25519");
  if (!signature) {
    return c.text("Missing signature!", 401);
  }

  const timestamp = c.req.header("X-Signature-Timestamp");
  if (!timestamp) {
    return c.text("Missing timestamp!", 401);
  }

  const rawBody = await c.req.arrayBuffer();

  const isValidRequest = await verifyKey(rawBody, signature, timestamp, c.env.DISCORD_PUBLIC_KEY);
  if (!isValidRequest) {
    return c.text("Bad request signature!", 401);
  }

  const interaction = await c.req.json();
  console.error("Received interaction", JSON.stringify(interaction));

  if (interaction.type === InteractionType.PING) {
    return c.json({ type: InteractionResponseType.PONG });
  } if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    switch (interaction.data.name.toLowerCase()) {
      case "matchclock":
        console.error("Received matchclock command", JSON.stringify(await handleMatchclock(interaction)));
        return c.json(await handleMatchclock(interaction));
      default:
        throw new Error(`Unknown command: ${interaction.data.name}`);
    }
  } else {
    return c.text("Unknown interaction type!", 400);
  }
});

app.get("/register", async (c) => {
  const { DISCORD_APPLICATION_ID, DISCORD_TOKEN } = c.env;
  if (!DISCORD_APPLICATION_ID) {
    throw new Error("DISCORD_APPLICATION_ID is not set");
  } else if (!DISCORD_TOKEN) {
    throw new Error("DISCORD_TOKEN is not set");
  }

  const launchCommand = JSON.parse(c.env.DISCORD_LAUNCH_COMMAND_STRING);

  const response = await fetch(
    `https://discord.com/api/v10/applications/${DISCORD_APPLICATION_ID}/commands`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bot ${DISCORD_TOKEN}`,
      },
      method: "PUT",
      body: JSON.stringify([launchCommand, MATCHCLOCK_COMMAND]),
    },
  );

  if (response.ok) {
    return c.text("Successfully registered global command");
  } else {
    const text = await response.text();
    console.error("Failed to register global command", text);
    return c.text(text);
  }
})

app.post("/timerEvents/:instanceId", async (c) => {
  const { instanceId } = c.req.param();
  const timerDispatcherId = c.env.EVENT_RECORDER.idFromName(
    `timer ${instanceId}`,
  );
  const timerDispatcher = c.env.EVENT_RECORDER.get(timerDispatcherId);

  const dispatchedAt = Number(c.req.query("dispatchedAt"));
  const payload = await c.req.text();
  await timerDispatcher.putEvent(dispatchedAt, payload);

  return c.text("OK");
});

app.get("/timerEvents/:instanceId", async (c) => {
  const { instanceId } = c.req.param();
  const timerDispatcherId = c.env.EVENT_RECORDER.idFromName(
    `timer ${instanceId}`,
  );
  const timerDispatcher = c.env.EVENT_RECORDER.get(timerDispatcherId);
  const events = await timerDispatcher.getEvents();
  return c.json(events);
});

export default app;
export { EventRecorder };
