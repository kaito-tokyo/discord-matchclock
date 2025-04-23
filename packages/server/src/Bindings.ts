import { EventRecorder } from "./EventRecorder.js";

export interface Bindings {
  DISCORD_APPLICATION_ID: string;
  DISCORD_LAUNCH_COMMAND_STRING: string;
  DISCORD_PUBLIC_KEY: string;
  DISCORD_TOKEN: string;
  EVENT_RECORDER: DurableObjectNamespace<EventRecorder>;
}
