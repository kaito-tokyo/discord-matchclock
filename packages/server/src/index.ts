import { Hono } from "hono";

import { InteractionResponseType, InteractionType, verifyKey } from "discord-interactions";

import { Bindings } from "./Bindings.js";
import { EventRecorder } from "./EventRecorder.js";
import { MATCHCLOCK_COMMAND } from "./bot/commands.js";

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

  if (interaction.type === InteractionType.PING) {
    return c.json({ type: InteractionResponseType.PONG });
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

  const response = await fetch(
    `https://discord.com/api/v10/applications/${DISCORD_APPLICATION_ID}/commands`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bot ${DISCORD_TOKEN}`,
      },
      method: "PUT",
      body: JSON.stringify([MATCHCLOCK_COMMAND]),
    },
  );

  if (response.ok) {
    console.log("Successfully registered global command");
  } else {
    console.error("Failed to register global command", await response.text());
    throw new Error("Failed to register global command");
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
