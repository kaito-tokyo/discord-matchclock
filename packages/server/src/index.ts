import { Hono } from "hono";

import { Bindings } from "./Bindings.js";
import { EventRecorder } from "./EventRecorder.js";

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
  return c.text("Hello Hono!");
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
