import { DurableObject } from "cloudflare:workers";

export class TimerDispatcher extends DurableObject {
  connections: Set<WebSocket> = new Set();

  constructor(ctx: DurableObjectState, env: unknown) {
    super(ctx, env);
  }

  async fetch(request: Request): Promise<Response> {
    const { 0: client, 1: server } = new WebSocketPair();
    this.ctx.acceptWebSocket(server);
    this.connections.add(client);
    return new Response(null, {
      status: 101,
      webSocket: client,
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