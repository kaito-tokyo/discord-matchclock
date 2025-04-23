import { MATCHCLOCK_COMMAND } from "./commands";

const { DISCORD_APPLICATION_ID, DISCORD_TOKEN } = process.env;

if (DISCORD_APPLICATION_ID === undefined) {
  throw new Error("DISCORD_APPLICATION_ID is not set");
}

if (DISCORD_TOKEN === undefined) {
  throw new Error("DISCORD_TOKEN is not set");
}

const response = await fetch(
  `https://discord.com/api/v10/applications/${DISCORD_APPLICATION_ID}/commands`,
  {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bot ${DISCORD_TOKEN}`,
    },
    method: "PUT",
    body: JSON.stringify([MATCHCLOCK_COMMAND]),
  },
);

if (response.ok) {
  console.log("Successfully registered global command");
} else {
  console.error("Failed to register global command", response);
  throw new Error("Failed to register global command");
}
