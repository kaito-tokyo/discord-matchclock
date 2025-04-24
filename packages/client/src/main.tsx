import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { DiscordSDK } from "@discord/embedded-app-sdk";

import {
  defaultMatchclockConfig,
  MatchclockConfig,
} from "discord-matchclock-common/MatchclockConfig.js";

import App from "./App.tsx";
import "./index.css";

const discordSdk = new DiscordSDK(import.meta.env.VITE_CLIENT_ID);

async function setup() {
  const response = await fetch(`/.proxy/config/${discordSdk.guildId}.json`);

  let matchclockConfig: MatchclockConfig;
  if (response.ok) {
    matchclockConfig = {
      ...defaultMatchclockConfig,
      ...(await response.json()),
    };
  } else {
    matchclockConfig = defaultMatchclockConfig;
  }

  console.log(matchclockConfig);

  const timerEventsWebSocket = new WebSocket(`wss://${location.host}/.proxy/api/timerEvents/${discordSdk.instanceId}`);

  return {
    matchclockConfig,
    timerEventsWebSocket,
  };
}

setup().then(({ matchclockConfig }) => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App discordSdk={discordSdk} matchclockConfig={matchclockConfig} />
    </StrictMode>,
  );
});
