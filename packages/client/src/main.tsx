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

  const { code } = await discordSdk.commands.authorize({
  	client_id: import.meta.env.VITE_CLIENT_ID,
  	response_type: 'code',
  	state: '',
  	prompt: 'none',
	scope: ['identify'],
  });

//   const response = await fetch('/.proxy/api/token', {
//   	method: 'POST',
//   	headers: {
//   		'Content-Type': 'application/json',
//   	},
//   	body: JSON.stringify({
//   		code,
//   	}),
//   });
//   const { access_token } = await response.json();
//   console.log(access_token);

//   auth = await discordSdk.commands.authenticate({
//   	access_token,
//   });

//   if (auth == null) {
//   	throw new Error('Authenticate command failed');
//   }
}

setupDiscordSdk().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App discordSdk={discordSdk} />
    </StrictMode>,
  );
});
