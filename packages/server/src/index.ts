import { Hono } from "hono";

import { InteractionResponseType, InteractionType, verifyKey } from "discord-interactions";

import { Bindings } from "./Bindings.js";
import { EventRecorder } from "./EventRecorder.js";
import { HTTPException } from "hono/http-exception";

const app = new Hono<{ Bindings: Bindings }>();

interface DiscordInteraction {
  readonly type: InteractionType;
}

app.post("/", async (c) => {
  const rawBody = await c.req.arrayBuffer();
  const signature = c.req.header("X-Signature-Ed25519");
  if (!signature) {
    throw new HTTPException(401, { message: "Missing signature!" });
  }

  const timestamp = c.req.header("X-Signature-Timestamp");
  if (!timestamp) {
    throw new HTTPException(401, { message: "Missing timestamp!" });
  }

  const { DISCORD_PUBLIC_KEY } = c.env;
  if (!DISCORD_PUBLIC_KEY) {
    throw new Error("DISCORD_PUBLIC_KEY is not set");
  }

  const isValidRequest = verifyKey(rawBody, signature, timestamp, c.env.DISCORD_PUBLIC_KEY);
  if (!isValidRequest) {
    throw new HTTPException(401, { message: "Bad request signature!" });
  }

  const interaction = await c.req.json();

  if (interaction.type === InteractionType.PING) {
    return c.json({ type: InteractionResponseType.PONG });
  } else {
    throw new HTTPException(400, { message: "Unknown interaction type!" });
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
