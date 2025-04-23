import { useEffect, useState } from "react";

import { DiscordSDK } from "@discord/embedded-app-sdk";

import {
  type TimerEvent,
  fetchTimerEvents,
  dispatchTimerLaunched,
  dispatchTimerStarted,
  dispatchTimerStopped,
} from "./TimerEvents.js";
import { MatchclockConfig } from "discord-matchclock-common/MatchclockConfig.js";

const callTexts = [
  { millis: 10 * 60000, text: "残り10分" },
  { millis: 5 * 60000, text: "残り5分" },
  { millis: 1 * 60000, text: "残り1分" },
  { millis: 0, text: "試合終了、速やかに試合を終了してください" },
];

const eventCallTexts = {
  TimerStartedEvent: {
    text: "タイマースタート",
  },
  TimerStoppedEvent: {
    text: "タイマーストップ",
  },
};

function say(text: string) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  speechSynthesis.speak(utterance);
}

interface AppProps {
  readonly discordSdk: DiscordSDK;
  readonly matchclockConfig: MatchclockConfig;
}

function App({ discordSdk, matchclockConfig }: AppProps) {
  const [timerState, setTimerState] = useState({
    remainingMillis: matchclockConfig.defaultDurationInMinutes * 60000,
    calledMillis: Infinity,
    isRunning: false,
    offsetMillis: 0,
    tickTimerStateId: undefined as ReturnType<typeof setInterval> | undefined,
  });

  function tick(now: number = Date.now()) {
    setTimerState(
      (oldTimerState) => {
        const { offsetMillis } = oldTimerState;

        const elappsedMillis = now - offsetMillis;
        const remainingMillis = oldTimerState.remainingMillis - elappsedMillis;

        let calledMillis = Infinity;
        for (const { millis, text } of callTexts) {
          if (millis < oldTimerState.calledMillis && remainingMillis <= millis) {
            //say(text);
            calledMillis = millis;
            break;
          }
        }

        if (remainingMillis < 0) {
          return {
            ...oldTimerState,
            remainingMillis: 0,
            calledMillis,
            isRunning: false,
            offsetMillis: now
          };
        }

        return {
          ...oldTimerState,
          remainingMillis,
          calledMillis,
        };
      },
    );
  }

  const [timerEvents, setTimerEvents] = useState<TimerEvent[]>([]);

  function handleTimerEvent(event: TimerEvent) {
    switch (event.type) {
      case "TimerStartedEvent":
        say(eventCallTexts.TimerStartedEvent.text);
        setTimerState((oldTimerState) => {
          if (oldTimerState.tickTimerStateId !== undefined) {
            clearInterval(oldTimerState.tickTimerStateId);
          }
          return {
            ...oldTimerState,
            offsetMillis: event.dispatchedAt,
            tickTimerStateId: setInterval(tick, 1000),
          };
        });
        break;
      case "TimerStoppedEvent":
        say(eventCallTexts.TimerStoppedEvent.text);
        setTimerState((oldTimerState) => {
          if (oldTimerState.tickTimerStateId !== undefined) {
            clearInterval(oldTimerState.tickTimerStateId);
          }
          const elappsedMillis = event.dispatchedAt - oldTimerState.offsetMillis;
          return {
            ...oldTimerState,
            remainingMillis: oldTimerState.remainingMillis - elappsedMillis,
            tickTimerStateId: undefined,
          };
        });
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
        <button
          onClick={handleStart}
          disabled={timerState.tickTimerStateId !== undefined}
        >
          スタート
        </button>
        <button
          onClick={handleStop}
          disabled={timerState.tickTimerStateId === undefined}
        >
          ストップ
        </button>
      </section>

      <section>{JSON.stringify(timerEvents)}</section>
    </main>
  );
}

export default App;
