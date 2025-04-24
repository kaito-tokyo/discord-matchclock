import { DurableObject } from "cloudflare:workers";

export class EventRecorder extends DurableObject {
  sql: SqlStorage;

  constructor(ctx: DurableObjectState, env: unknown) {
    super(ctx, env);
    this.sql = ctx.storage.sql;

    this.ctx.blockConcurrencyWhile(async () => {
      this.sql.exec(`
        CREATE TABLE IF NOT EXISTS Events(
          id INTEGER     PRIMARY KEY AUTOINCREMENT,
          dispatched_at  INTEGER,
          payload        JSON
        );
      `);
    });
  }

  async fetch(request: Request): Promise<Response> {
    const { 0: client, 1: server } = new WebSocketPair();
    this.ctx.acceptWebSocket(server);
    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async webSocketMessage(ws: WebSocket, message: string) {
    const request = JSON.parse(message);
    if (request.type === "getEvents") {
      ws.send(
        JSON.stringify({
          type: "getEventsResponse",
          events: this.sql.exec("SELECT * FROM Events;").toArray(),
        }),
      );
    }
  }

  async webSocketClose(
    ws: WebSocket,
    code: number,
    reason: string,
    wasClean: boolean,
  ): void | Promise<void> {
    ws.close(code, "Durable Object is closing WebSocket");
  }

  async putEvent(dispatchedAt: number, payload: string) {
    this.sql.exec(
      "INSERT INTO Events (dispatched_at, payload) VALUES (?, ?)",
      dispatchedAt,
      payload,
    );
  }

  async getEvents() {
    return this.sql.exec("SELECT * FROM Events;").toArray();
  }
}
