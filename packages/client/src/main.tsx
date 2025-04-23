import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { DiscordSDK } from "@discord/embedded-app-sdk";

import App from "./App.tsx";
import "./index.css";

const discordSdk = new DiscordSDK(import.meta.env.VITE_CLIENT_ID);

async function setupDiscordSdk() {
  // No actions required
}

setupDiscordSdk().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App discordSdk={discordSdk} />
    </StrictMode>,
  );
});
