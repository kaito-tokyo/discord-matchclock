import { useEffect, useState } from "react";

import { DiscordSDK } from "@discord/embedded-app-sdk";

import {
  type TimerEvent,
  fetchTimerEvents,
  dispatchTimerLaunched,
  dispatchTimerStarted,
  dispatchTimerStopped,
} from "./TimerEvents.js";

const callTexts = [
  { millis: 10 * 60000, text: "残り10分" },
  { millis: 5 * 60000, text: "残り5分" },
  { millis: 1 * 60000, text: "残り1分" },
  { millis: 0, text: "試合終了、速やかに試合を終了してください" },
];

const eventCallTexts = {
  TimerStartedEvent: {
    text: "試合開始",
  },
};

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
    tickTimerStateId: undefined as ReturnType<typeof setInterval> | undefined,
  });

  function tick(timestamp: number = Date.now()) {
    setTimerState(
      ({ duration, calledMillis, isRunning, matchStart, tickTimerStateId }) => {
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
            tickTimerStateId,
          };
        }

        const nextPayload = {
          duration,
          remainingMillis: newRemainingMillis,
          calledMillis,
          isRunning,
          matchStart,
          tickTimerStateId,
        };

        return nextPayload;
      },
    );
  }

  const [timerEvents, setTimerEvents] = useState<TimerEvent[]>([]);

  function handleTimerEvent(event: TimerEvent) {
    switch (event.type) {
      case "TimerStartedEvent":
        say(eventCallTexts.TimerStartedEvent.text);
        if (timerState.tickTimerStateId !== undefined) {
          clearInterval(timerState.tickTimerStateId);
        }
        const tickTimerStateId = setInterval(tick, 1000);
        setTimerState((oldTimerState) => ({
          ...oldTimerState,
          matchStart: event.dispatchedAt,
          tickTimerStateId: tickTimerStateId,
        }));
        tick();
        break;
      case "TimerStoppedEvent":
        setTimerState((oldTimerState) => ({
          ...oldTimerState,
          tickTimerStateId: undefined,
        }));
        if (timerState.tickTimerStateId !== undefined) {
          clearInterval(timerState.tickTimerStateId);
        }
    }
  }

  async function tickTimerEvent() {
    const newTimerEvents = await fetchTimerEvents(discordSdk.instanceId);
    setTimerEvents((oldTimerEvents) => {
      if (newTimerEvents.length === oldTimerEvents.length) {
        return oldTimerEvents;
      } else {
        for (let i = oldTimerEvents.length; i < newTimerEvents.length; i++) {
          handleTimerEvent(newTimerEvents[i]);
        }
        return newTimerEvents;
      }
    });
  }

  useEffect(() => {
    setInterval(tickTimerEvent, 1000);
    tickTimerEvent();
    dispatchTimerLaunched(discordSdk.instanceId, Date.now());
  }, []);

  function handleStart() {
    dispatchTimerStarted(discordSdk.instanceId, Date.now());
    tickTimerEvent();
  }

  function handleStop() {
    dispatchTimerStopped(discordSdk.instanceId, Date.now());
    tickTimerEvent();
  }

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
        <button onClick={handleStart} disabled={timerState.tickTimerStateId !== undefined}>
          スタート
        </button>
        <button onClick={handleStop} disabled={timerState.tickTimerStateId === undefined}>
          ストップ
        </button>
      </section>

      <section>{JSON.stringify(timerEvents)}</section>
    </main>
  );
}

export default App;
