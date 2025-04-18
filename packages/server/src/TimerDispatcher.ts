// import { DurableObject } from "cloudflare:workers";

// export class TimerDispatcher extends DurableObject {
//   connections: Set<WebSocket> = new Set();

//   constructor(ctx: DurableObjectState, env: unknown) {
//     super(ctx, env);
//   }

//   async fetch(request: Request): Promise<Response> {
//     const { 0: client, 1: server } = new WebSocketPair();
//     console.error("client", client);
//     this.ctx.acceptWebSocket(server);
//     this.connections.add(client);
//     console.error("connections", this.connections.size);
//     return new Response(null, {
//       status: 101,
//       webSocket: client,
//     });
//   }

//   async dispatch(event: string): Promise<Response> {
//     console.error("Size", this.connections.size)
//     for (const connection of this.connections) {
//       connection.send(event);
//     }
//     return new Response(null, {
//       status: 200,
//     });
//   }
// }