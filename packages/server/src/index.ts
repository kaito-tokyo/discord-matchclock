import { Hono } from "hono";

import { verifyKey } from "discord-interactions";

import { Bindings } from "./Bindings.js";
import { EventRecorder } from "./EventRecorder.js";

const { DISCORD_PUBLIC_KEY } = process.env;

if (DISCORD_PUBLIC_KEY === undefined) {
  throw new Error("DISCORD_PUBLIC_KEY is not set");
}

const app = new Hono<{ Bindings: Bindings }>();

app.post("/", async (c) => {
  const rawBody = await c.req.raw();
  const signature = c.req.header("X-Signature-Ed25519") ?? "";
  const timestamp = c.req.header("X-Signature-Timestamp") ?? "";
  const isValidRequest = verifyKey(rawBody, signature, timestamp, c.env.DISCORD_PUBLIC_KEY);
  if (!isValidRequest) {
    return c.text("Bad request signature!", 401);
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
