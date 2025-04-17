import { useReducer, useState } from "react";

import { DiscordSDK } from '@discord/embedded-app-sdk';

const startingCallText = "試合開始";
const callTexts = [
  { millis: 10 * 60000, text: "残り10分" },
  { millis: 5 * 60000, text: "残り5分" },
  { millis: 1 * 60000, text: "残り1分" },
  { millis: 0, text: "試合終了、速やかに試合を終了してください" },
]

function say(text: string) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  speechSynthesis.speak(utterance);
}

interface TimerState {
  readonly duration: number;
  readonly matchStartMillis: number;
  readonly remainingMillis: number;
  readonly calledMillis: number;
  readonly isRunning: boolean;
}

interface TimerStateUploaderProps {
  readonly discordSdk: DiscordSDK;
}

function TimerUploader({ discordSdk }: TimerStateUploaderProps) {
  const [, setTimerState] = useState({
    duration: 30 * 60000,
    matchStartMillis: 0,
    remainingMillis: 30 * 60000,
    calledMillis: Infinity,
    isRunning: false,
  });
  
  function tick() {
    const now = Date.now();
    setTimerState(({duration, matchStartMillis, calledMillis, isRunning }) =>{
      const newRemainingMillis = duration - now + matchStartMillis;

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
          matchStartMillis,
          remainingMillis: 0,
          calledMillis,
          isRunning: false,
        };
      }

      if (isRunning) {
        setTimeout(tick, 1000, Date.now());
      }

      const newTimerState = {
        duration,
        matchStartMillis,
        remainingMillis: newRemainingMillis,
        calledMillis,
        isRunning,
      };

      fetch(`/.proxy/timerState/${discordSdk.instanceId}`, {
        method: "PUT",
        body: JSON.stringify(newTimerState),
        headers: {
          "Content-Type": "application/json",
        },
      });

      return newTimerState;
    });
  }

  function handleStart() {
    const now = Date.now();

    setTimerState(({duration, remainingMillis, calledMillis}) => ({
      duration,
      matchStartMillis: now,
      remainingMillis,
      calledMillis,
      isRunning: true,
    }));
  
    say(startingCallText);
    setTimeout(tick, 1000, Date.now());
  }

  return (
    <section>
      <button onClick={handleStart}>スタート</button>
    </section>
  );
}

interface AppProps {
  discordSdk: DiscordSDK;
}

function App({discordSdk}: AppProps) {
  const [editingTimerState, setEditingTimerState] = useState({
    duration: 30 * 60000,
    remainingMillis: 30 * 60000,
    calledMillis: Infinity,
    isRunning: false,
    matchStart: 0,
  });


  const [timerState, setTimerState] = useState({
    duration: 30 * 60000,
    remainingMillis: 30 * 60000,
    calledMillis: Infinity,
    isRunning: false,
    matchStart: 0,
  });

  function startTimer(timestamp: number) {
    setTimerState(({duration, remainingMillis, calledMillis}) => ({
      duration,
      remainingMillis,
      calledMillis,
      isRunning: true,
      matchStart: timestamp,
    }));
    say(startingCallText);
    setTimeout(tick, 1000, Date.now());
  }

  function tickUpdate(timestamp: number) {
    const {duration, calledMillis, isRunning, matchStart} = timerState;

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

    fetch(`/.proxy/timerState/${discordSdk.instanceId}`, {
      method: "PUT",
      body: JSON.stringify(nextPayload),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
      >

      <TimerUploader />

      <section>
        <h1>{Math.floor(timerState.remainingMillis / 60000).toString().padStart(2, '0')}:{Math.floor(timerState.remainingMillis % 60000 / 1000).toString().padStart(2, '0')}</h1>
      </section>

      <section>
        <h1>{discordSdk.instanceId}</h1>
      </section>
    </main>
  );
}

export default App;
