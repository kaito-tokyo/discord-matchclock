import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.tsx";
import "./index.css";

import { DiscordSDK } from '@discord/embedded-app-sdk';
import type { CommandResponse } from '@discord/embedded-app-sdk';
type Auth = CommandResponse<'authenticate'>;
let auth: Auth;

const discordSdk = new DiscordSDK(import.meta.env.VITE_CLIENT_ID);

async function setupDiscordSdk() {
	await discordSdk.ready();

	// Authorize with Discord Client
	// const { code } = await discordSdk.commands.authorize({
	// 	client_id: import.meta.env.VITE_CLIENT_ID,
	// 	response_type: 'code',
	// 	state: '',
	// 	prompt: 'none',
	// 	// More info on scopes here: https://discord.com/developers/docs/topics/oauth2#shared-resources-oauth2-scopes
	// 	scope: [
	// 		// Activities will launch through app commands and interactions of user-installable apps.
	// 		// https://discord.com/developers/docs/tutorials/developing-a-user-installable-app#configuring-default-install-settings-adding-default-install-settings
	// 		'applications.commands',

	// 		// "applications.builds.upload",
	// 		// "applications.builds.read",
	// 		// "applications.store.update",
	// 		// "applications.entitlements",
	// 		// "bot",
	// 		'identify',
	// 		// "connections",
	// 		// "email",
	// 		// "gdm.join",
	// 		'guilds',
	// 		// "guilds.join",
	// 		'guilds.members.read',
	// 		// "messages.read",
	// 		// "relationships.read",
	// 		// 'rpc.activities.write',
	// 		// "rpc.notifications.read",
	// 		// "rpc.voice.write",
	// 		'rpc.voice.read',
	// 		// "webhook.incoming",
	// 	],
	// });

	// Retrieve an access_token from your activity's server
	// /.proxy/ is prepended here in compliance with CSP
	// see https://discord.com/developers/docs/activities/development-guides#construct-a-full-url
	// const response = await fetch('/.proxy/api/token', {
	// 	method: 'POST',
	// 	headers: {
	// 		'Content-Type': 'application/json',
	// 	},
	// 	body: JSON.stringify({
	// 		code,
	// 	}),
	// });
	// const { access_token } = await response.json();

	// // Authenticate with Discord client (using the access_token)
	// auth = await discordSdk.commands.authenticate({
	// 	access_token,
	// });

	// if (auth == null) {
	// 	throw new Error('Authenticate command failed');
	// }
}

// Once setupDiscordSdk is complete, we can assert that "auth" is initialized
setupDiscordSdk().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App discordSdk={discordSdk} />
    </StrictMode>
  );
});

