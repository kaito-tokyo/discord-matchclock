export interface TimerLaunchedEvent {
  readonly dispatchedAt: number;
  readonly type: "TimerLaunchedEvent";
}

export interface TimerStartedEvent {
  readonly dispatchedAt: number;
  readonly type: "TimerStartedEvent";
}

export type TimerEvent = TimerLaunchedEvent | TimerStartedEvent;

export async function fetchTimerEvents(
  instanceId: string,
): Promise<TimerEvent[]> {
  const response = await fetch(`/.proxy/api/timerEvents/${instanceId}`);

  if (!response.ok) {
    console.error("Failed to fetch timer events", response);
    throw new Error("Failed to fetch timer events");
  }

  const timerEventRecords: TimerEventRecord[] = await response.json();

  return timerEventRecords.map((record) => JSON.parse(record.payload));
}

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
      type: "TimerLaunchedEvent",
    },
    dispatchedAt,
  );
}

interface TimerEventRecord {
  readonly dispatchedAt: number;
  readonly type: "TimerLaunchedEvent" | "TimerStartEvent";
  readonly payload: string;
}
