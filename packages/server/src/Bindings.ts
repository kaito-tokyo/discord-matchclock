import { EventRecorder } from "./EventRecorder.js";

export interface Bindings {
  CLIENT_ID: string;
  CLIENT_SECRET: string;
  DISCORD_PUBLIC_KEY: string;
  EVENT_RECORDER: DurableObjectNamespace<EventRecorder>;
}
