import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.tsx";
import "./index.css";

import { DiscordSDK } from "@discord/embedded-app-sdk";
import type { CommandResponse } from '@discord/embedded-app-sdk';
type Auth = CommandResponse<'authenticate'>;
let auth: Auth;

const discordSdk = new DiscordSDK(import.meta.env.VITE_CLIENT_ID);

async function setupDiscordSdk() {
  await discordSdk.ready();
}

setupDiscordSdk().then((access_token) => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App discordSdk={discordSdk} />
    </StrictMode>,
  );
});
