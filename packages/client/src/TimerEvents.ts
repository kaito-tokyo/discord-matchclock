export interface TimerLaunchedEvent {
  readonly dispatchedAt: number;
  readonly type: "TimerLaunchedEvent";
}

export interface TimerStartedEvent {
  readonly dispatchedAt: number;
  readonly type: "TimerStartedEvent";
}

export interface TimerStoppedEvent {
  readonly dispatchedAt: number;
  readonly type: "TimerStoppedEvent";
}

export interface TimerSetRemainingEvent {
  readonly dispatchedAt: number;
  readonly remainingMillis: number;
  readonly type: "TimerSetRemainingEvent";
}

export type TimerEvent =
  | TimerLaunchedEvent
  | TimerStartedEvent
  | TimerStoppedEvent
  | TimerSetRemainingEvent;

export interface TimerEventRecord {
  readonly dispatchedAt: number;
  readonly type: "TimerLaunchedEvent" | "TimerStartEvent";
  readonly payload: string;
}

export type TimerEventSocketGetEventsMessage = {
  readonly type: "getEvents";
};

export type TimerEventSocketGetEventsResponseMessage = {
  readonly type: "getEventsResponse";
  readonly timerEventRecords: TimerEventRecord[];
};

export type TimerEventSocketMessage =
  | TimerEventSocketGetEventsMessage
  | TimerEventSocketGetEventsResponseMessage;

async function dispatchTimerEvent(
  instanceId: string,
  timerEvent: TimerEvent,
  dispatchedAt: number,
): Promise<void> {
  const response = await fetch(
    `/.proxy/api/timerEvents/${instanceId}?dispatchedAt=${dispatchedAt}`,
    {
      method: "POST",
      body: JSON.stringify(timerEvent),
    },
  );

  if (!response.ok) {
    console.error("Failed to dispatch event", response);
    throw new Error("Failed to dispatch event");
  }
}

export async function dispatchTimerLaunched(
  instanceId: string,
  dispatchedAt: number,
): Promise<void> {
  dispatchTimerEvent(
    instanceId,
    {
      dispatchedAt,
      type: "TimerLaunchedEvent",
    },
    dispatchedAt,
  );
}

export async function dispatchTimerStarted(
  instanceId: string,
  dispatchedAt: number,
): Promise<void> {
  dispatchTimerEvent(
    instanceId,
    {
      dispatchedAt,
      type: "TimerStartedEvent",
    },
    dispatchedAt,
  );
}

export async function dispatchTimerStopped(
  instanceId: string,
  dispatchedAt: number,
): Promise<void> {
  dispatchTimerEvent(
    instanceId,
    {
      dispatchedAt,
      type: "TimerStoppedEvent",
    },
    dispatchedAt,
  );
}

export async function dispatchTimerSetRemaining(
  instanceId: string,
  dispatchedAt: number,
  remainingMillis: number,
): Promise<void> {
  dispatchTimerEvent(
    instanceId,
    {
      dispatchedAt,
      remainingMillis,
      type: "TimerSetRemainingEvent",
    },
    dispatchedAt,
  );
}
