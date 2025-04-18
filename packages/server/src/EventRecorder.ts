import { DurableObject } from "cloudflare:workers";

export class EventRecorder extends DurableObject {
  sql: SqlStorage;

  constructor(ctx: DurableObjectState, env: unknown) {
    super(ctx, env);
    this.sql = ctx.storage.sql;

    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS Events(
        id INTEGER     PRIMARY KEY AUTOINCREMENT,
        dispatched_at  INTEGER,
        payload        JSON
      );
    `);
  }

  async putEvent(dispatchedAt: number, payload: string) {
    this.sql.exec("INSERT INTO Events(dispatched_at, payload) VALUES(?, ?);", [
      dispatchedAt,
      payload,
    ]);
  }

  async getEvents() {
    return this.sql.exec("SELECT * FROM Events;");
  }
}
