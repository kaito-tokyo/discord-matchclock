import { DurableObject } from "cloudflare:workers";

export class TimerDispatcher extends DurableObject {
  connections: Set<WebSocket> = new Set();

  constructor(ctx: DurableObjectState, env: unknown) {
    super(ctx, env);
  }

  async fetch(request: Request): Promise<Response> {
    const { 0: listener, 1: dispatcher } = new WebSocketPair();
    this.ctx.acceptWebSocket(dispatcher);
    this.connections.add(listener);
    return new Response(null, {
      status: 101,
      webSocket: listener,
    });
  }

  async dispatch(event: string): Promise<Response> {
    for (const connection of this.connections) {
      connection.send(event);
    }
    return new Response(null, {
      status: 200,
    });
  }
}