import { Hono } from "hono";

import {
  APIInteraction,
  InteractionResponseType,
  InteractionType,
} from "discord-api-types/v10";
import { verifyKey } from "discord-interactions";

import { Bindings } from "./Bindings.js";
import { EventRecorder } from "./EventRecorder.js";
import { MATCHCLOCK_COMMAND } from "./bot/commands.js";
import {
  handleConfigureMatchclockSubmit,
  handleMatchclockCommand,
} from "./bot/handleMatchclock.js";

const app = new Hono<{ Bindings: Bindings }>();

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

  const isValidRequest = await verifyKey(
    rawBody,
    signature,
    timestamp,
    c.env.DISCORD_PUBLIC_KEY,
  );
  if (!isValidRequest) {
    return c.text("Bad request signature!", 401);
  }

  const interaction: APIInteraction = await c.req.json();

  if (interaction.type === InteractionType.Ping) {
    return c.json({ type: InteractionResponseType.Pong });
  } else if (interaction.type === InteractionType.ApplicationCommand) {
    if (interaction.data.name === MATCHCLOCK_COMMAND.name) {
      return c.json(
        await handleMatchclockCommand(interaction, c.env.CONFIG_BUCKET),
      );
    } else {
      throw new Error(`Unknown command: ${interaction.data.name}`);
    }
  } else if (interaction.type === InteractionType.ModalSubmit) {
    if (interaction.data.custom_id === "configure_matchclock") {
      return c.json(
        await handleConfigureMatchclockSubmit(interaction, c.env.CONFIG_BUCKET),
      );
    } else {
      throw new Error(`Unknown modal: ${interaction.data.custom_id}`);
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
});

app.post("/timerEvents/:instanceId", async (c) => {
  const { instanceId } = c.req.param();
  const timerDispatcherId = c.env.EVENT_RECORDER.idFromName(
    `timer ${instanceId}`,
  );
  const timerDispatcher = c.env.EVENT_RECORDER.get(timerDispatcherId);

  const dispatchedAt = Number(c.req.query("dispatchedAt"));
  const payload = await c.req.text();
  await timerDispatcher.putEvent(dispatchedAt, payload);

  //caches.default.delete(c.req.url);

  return c.text("OK");
});

app.get("/timerEvents/:instanceId", async (c) => {
  const { instanceId } = c.req.param();
  const timerDispatcherId = c.env.EVENT_RECORDER.idFromName(
    `timer ${instanceId}`,
  );
  const timerDispatcher = c.env.EVENT_RECORDER.get(timerDispatcherId);

  if (c.req.header("upgrade") === "websocket") {
    return timerDispatcher.fetch(c.req.raw);
  } else {
    return c.json(await timerDispatcher.getEvents());
  }
});

export default app;
export { EventRecorder };
