import { useEffect, useState } from "react";

import { DiscordSDK } from "@discord/embedded-app-sdk";

const startingCallText = "試合開始";
const callTexts = [
  { millis: 10 * 60000, text: "残り10分" },
  { millis: 5 * 60000, text: "残り5分" },
  { millis: 1 * 60000, text: "残り1分" },
  { millis: 0, text: "試合終了、速やかに試合を終了してください" },
];

interface TimerStartEvent {
  readonly type: "TimerStartEvent";
}

type TimerEvent = TimerStartEvent;

function say(text: string) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  speechSynthesis.speak(utterance);
}

interface AppProps {
  discordSdk: DiscordSDK;
}

function App({ discordSdk }: AppProps) {
  const [timerState, setTimerState] = useState({
    duration: 30 * 60000,
    remainingMillis: 30 * 60000,
    calledMillis: Infinity,
    isRunning: false,
    matchStart: 0,
  });

  function startTimer(timestamp: number) {
    setTimerState(({ duration, remainingMillis, calledMillis }) => ({
      duration,
      remainingMillis,
      calledMillis,
      isRunning: true,
      matchStart: timestamp,
    }));
    say(startingCallText);
    setTimeout(tick, 1000, Date.now());
  }

  function tick(timestamp: number) {
    setTimerState(({ duration, calledMillis, isRunning, matchStart }) => {
      const newRemainingMillis = duration - timestamp + matchStart;

      for (const { millis, text } of callTexts) {
        if (millis < calledMillis && newRemainingMillis <= millis) {
          say(text);
          calledMillis = millis;
          break;
        }
      }

      if (newRemainingMillis < 0) {
        return {
          duration,
          remainingMillis: 0,
          calledMillis,
          isRunning: false,
          matchStart,
        };
      }

      if (isRunning) {
        setTimeout(tick, 1000, Date.now());
      }

      const nextPayload = {
        duration,
        remainingMillis: newRemainingMillis,
        calledMillis,
        isRunning,
        matchStart,
      };

      return nextPayload;
    });
  }

  function handlePlus() {
    setTimerState((state) => {
      return {
        ...state,
        duration: state.duration + 60000,
        remainingMillis: state.remainingMillis + 60000,
      };
    });
  }

  function handleMinus() {
    setTimerState((state) => {
      return {
        ...state,
        duration: state.duration - 60000,
        remainingMillis: state.remainingMillis - 60000,
      };
    });
  }

  async function dispatchTimerEvent(
    instanceId: string,
    timerEvent: TimerEvent,
  ): Promise<void> {
    const response = await fetch(
      `/.proxy/api/timerEvents/${instanceId}?dispatchedAt=${Date.now()}`,
      {
        method: "POST",
        body: JSON.stringify(timerEvent),
      },
    );

    if (!response.ok) {
      console.error("Failed to push event", response);
      throw new Error("Failed to push event");
    }
  }

  async function fetchTimerEvents(instanceId: string): Promise<TimerEvent[]> {
    const response = await fetch(`/.proxy/api/timerEvents/${instanceId}`);

    if (!response.ok) {
      console.error("Failed to fetch events", response);
      throw new Error("Failed to fetch events");
    }

    const timerEvents: TimerEvent[] = await response.json();

    return timerEvents;
  }

  const [timerEvents, setTimerEvents] = useState<TimerEvent[]>([]);

  useEffect(() => {
    setInterval(async () => {
      const newTimerEvents = await fetchTimerEvents(discordSdk.instanceId);
      setTimerEvents((oldTimerEvents) =>
        oldTimerEvents.length === newTimerEvents.length
          ? oldTimerEvents
          : newTimerEvents,
      );
    }, 1000);
  }, []);

  function handleStart() {
    dispatchTimerEvent(discordSdk.instanceId, {
      type: "TimerStartEvent",
    });
  }

  useEffect(() => {
    if (timerEvents.length === 0) {
      return;
    }
    startTimer(Date.now());
  }, [timerEvents]);

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <section>
        <h1
          style={{
            fontSize: "100px",
          }}
        >
          {Math.floor(timerState.remainingMillis / 60000)
            .toString()
            .padStart(2, "0")}
          :
          {Math.floor((timerState.remainingMillis % 60000) / 1000)
            .toString()
            .padStart(2, "0")}
        </h1>
      </section>

      <h1>試合タイマー</h1>

      <section>
        <h1>二人で同時にスタートを押してください</h1>
        <button onClick={handleStart}>スタート</button>
      </section>

      <section>
        <h1>デバッグ用（使う時は二人同時に押す）</h1>
        <button onClick={handleMinus}>-1分</button>
        <button onClick={handlePlus}>+1分</button>
      </section>

      <section>
        <h1>{discordSdk.instanceId}</h1>
      </section>

      <section>{JSON.stringify(timerEvents)}</section>
    </main>
  );
}

export default App;
