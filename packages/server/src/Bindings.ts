import { EventRecorder } from "./EventRecorder.js";

export interface Bindings {
  CLIENT_ID: string;
  CLIENT_SECRET: string;
  EVENT_RECORDER: DurableObjectNamespace<EventRecorder>;
};
