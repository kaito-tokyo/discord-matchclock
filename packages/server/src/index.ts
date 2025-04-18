import { Hono } from "hono";
import { EventRecorder } from "./EventRecorder.js";

type Bindings = {
  CLIENT_ID: string;
  CLIENT_SECRET: string;
  EVENT_RECORDER: DurableObjectNamespace<EventRecorder>;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.post("/events/:instanceId", async (c) => {
  const { instanceId } = c.req.param();
  const timerDispatcherId = c.env.EVENT_RECORDER.idFromName(instanceId);
  const timerDispatcher = c.env.EVENT_RECORDER.get(timerDispatcherId);

  const dispatchedAt = Number(c.req.query("dispatchedAt"));
  const payload = await c.req.text();
  timerDispatcher.putEvent(dispatchedAt, payload);

  return c.text("OK");
});

app.get("/events/:instanceId", async (c) => {
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
