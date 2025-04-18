import { Hono } from "hono";
import { TimerDispatcher } from "./TimerDispatcher.js";

type Bindings = {
  CLIENT_ID: string;
  CLIENT_SECRET: string;
  TIMER_DISPATCHER: DurableObjectNamespace<TimerDispatcher>;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("/listen/:instanceId", async (c) => {
  const upgradeHeader = c.req.header("Upgrade");

  if (!upgradeHeader || upgradeHeader !== "websocket") {
    return c.text("Expected websocket connection", 426);
  }

  const { instanceId } = c.req.param();
  const timerDispatcherId = c.env.TIMER_DISPATCHER.idFromName(instanceId);
  const timerDispatcher = c.env.TIMER_DISPATCHER.get(timerDispatcherId);

  return await timerDispatcher.listen();
});

app.post("/dispatch/:instanceId", async (c) => {
  const { instanceId } = c.req.param();
  const timerDispatcherId = c.env.TIMER_DISPATCHER.idFromName(instanceId);
  const timerDispatcher = c.env.TIMER_DISPATCHER.get(timerDispatcherId);
  return await timerDispatcher.dispatch(await c.req.text());
});

export default app;
export { TimerDispatcher };
