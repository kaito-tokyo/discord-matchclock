import { useEffect, useState } from "react";

import { DiscordSDK } from "@discord/embedded-app-sdk";

import {
  type TimerEvent,
  dispatchTimerLaunched,
  dispatchTimerStarted,
  dispatchTimerStopped,
  dispatchTimerSetRemaining,
  TimerEventSocketMessage,
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
  if (!speechSynthesis.speaking) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    speechSynthesis.speak(utterance);
  }
}

interface AppProps {
  readonly discordSdk: DiscordSDK;
  readonly matchclockConfig: MatchclockConfig;
}

function App({ discordSdk, matchclockConfig }: AppProps) {
  const [timerState, setTimerState] = useState({
    tickTimerStateId: undefined as ReturnType<typeof setInterval> | undefined,
    durationInMillis: matchclockConfig.defaultDurationInMinutes * 60000,
    offsetMillis: 0,
    calledMillis: Infinity,
    remainingMillis: matchclockConfig.defaultDurationInMinutes * 60000,
  });

  async function tick(now: number = Date.now()) {
    await setTimerState((oldTimerState) => {
      const { durationInMillis, offsetMillis } = oldTimerState;

      const elappsedMillis = now - offsetMillis;
      const remainingMillis = durationInMillis - elappsedMillis;

      let calledMillis = oldTimerState.calledMillis;
      for (const { millis, text } of callTexts) {
        if (millis < oldTimerState.calledMillis && remainingMillis <= millis) {
          say(text);
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
          offsetMillis: now,
        };
      }

      return {
        ...oldTimerState,
        remainingMillis,
        calledMillis,
      };
    });
  }

  const [timerEventsConnection, setTimerEventsConnection] = useState(() => {
    const ws = new WebSocket(
      `wss://${location.host}/.proxy/api/timerEvents/${discordSdk.instanceId}`,
    );

    ws.onmessage = onTimerEventMessage;

    return {
      ws,
    };
  });

  const [timerEvents, setTimerEvents] = useState<TimerEvent[]>([]);

  async function handleTimerEvent(event: TimerEvent) {
    switch (event.type) {
      case "TimerStartedEvent":
        await setTimerState((oldTimerState) => {
          if (oldTimerState.tickTimerStateId !== undefined) {
            clearInterval(oldTimerState.tickTimerStateId);
          }
          return {
            ...oldTimerState,
            offsetMillis: event.dispatchedAt,
            tickTimerStateId: setInterval(tick, 1000),
          };
        });
        say(eventCallTexts.TimerStartedEvent.text);
        break;
      case "TimerStoppedEvent":
        await setTimerState((oldTimerState) => {
          if (oldTimerState.tickTimerStateId !== undefined) {
            clearInterval(oldTimerState.tickTimerStateId);
          }
          const elappsedMillis =
            event.dispatchedAt - oldTimerState.offsetMillis;
          return {
            ...oldTimerState,
            durationInMillis: oldTimerState.durationInMillis - elappsedMillis,
            tickTimerStateId: undefined,
          };
        });
        say(eventCallTexts.TimerStoppedEvent.text);
        break;
      case "TimerSetRemainingEvent":
        await setTimerState((oldTimerState) => {
          const elappsedMillis =
            event.dispatchedAt - oldTimerState.offsetMillis;
          return {
            ...oldTimerState,
            durationInMillis: event.remainingMillis - elappsedMillis,
            offsetMillis: event.dispatchedAt,
          };
        });
    }
  }

  async function tickTimerEvent() {
    const { ws } = timerEventsConnection;
    if (ws.readyState === WebSocket.OPEN) {
      const timerEventGetEventsMessage: TimerEventSocketMessage = {
        type: "getEvents",
      };
      ws.send(JSON.stringify(timerEventGetEventsMessage));
    }
  }

  function onTimerEventMessage(event: MessageEvent<string>) {
    const message: TimerEventSocketMessage = JSON.parse(event.data);
    if (message.type === "getEventsResponse") {
      const { timerEventRecords } = message;
      const newTimerEvents = timerEventRecords.map((record) =>
        JSON.parse(record.payload),
      );
      setTimerEvents((oldTimerEvents) => {
        if (newTimerEvents.length === oldTimerEvents.length) {
          return oldTimerEvents;
        } else {
          for (let i = oldTimerEvents.length; i < newTimerEvents.length; i++) {
            console.log("i", JSON.stringify(newTimerEvents[i]));
            handleTimerEvent(newTimerEvents[i]);
          }
          return newTimerEvents;
        }
      });
    }
  }

  useEffect(() => {
    dispatchTimerLaunched(discordSdk.instanceId, Date.now()).then(() => {
      setInterval(tickTimerEvent, 1000);
      setTimeout(tickTimerEvent, 100);
    });
  }, []);

  async function handleStart() {
    await dispatchTimerStarted(discordSdk.instanceId, Date.now());
    await tickTimerEvent();
  }

  async function handleStop() {
    await dispatchTimerStopped(discordSdk.instanceId, Date.now());
    await tickTimerEvent();
  }

  async function handlePlus() {
    const dispatchedAt = Date.now();
    const elappsedMillis = dispatchedAt - timerState.offsetMillis;
    await dispatchTimerSetRemaining(
      discordSdk.instanceId,
      dispatchedAt,
      timerState.remainingMillis - elappsedMillis + 60000,
    );
    await tickTimerEvent();
    await tick();
  }

  async function handleMinus() {
    const dispatchedAt = Date.now();
    const elappsedMillis = dispatchedAt - timerState.offsetMillis;
    await dispatchTimerSetRemaining(
      discordSdk.instanceId,
      dispatchedAt,
      timerState.remainingMillis - elappsedMillis - 60000,
    );
    await tickTimerEvent();
    await tick();
  }

  async function handleSync() {
    await tickTimerEvent();
    await tick();
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
        <h1>10秒ごとに自動同期します</h1>
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
        <button onClick={handlePlus}>+1分</button>
        <button onClick={handleMinus}>-1分</button>
        <button onClick={handleSync}>同期</button>
      </section>

      <section>{JSON.stringify(timerEvents)}</section>
    </main>
  );
}

export default App;
