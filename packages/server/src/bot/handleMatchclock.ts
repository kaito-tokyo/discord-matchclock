import {
  APIApplicationCommandInteraction,
  APIInteractionResponse,
  APIModalSubmitInteraction,
  ComponentType,
  InteractionResponseType,
  MessageFlags,
  TextInputStyle,
} from "discord-api-types/v10";

export async function handleMatchclockCommand(
  interaction: APIApplicationCommandInteraction,
): Promise<APIInteractionResponse> {
  return {
    type: InteractionResponseType.Modal,
    data: {
      custom_id: "configure_matchclock",
      title: "Configure Matchclock",
      components: [
        {
          type: ComponentType.ActionRow,
          components: [
            {
              type: ComponentType.TextInput,
              custom_id: "default_duration",
              style: TextInputStyle.Short,
              label: "Default duration in minutes",
              value: "25",
            },
          ],
        },
      ],
    },
  };
}

export async function handleConfigureMatchclockSubmit(
  interaction: APIModalSubmitInteraction,
  configBucket: R2Bucket
): Promise<APIInteractionResponse> {
  const { guild_id } = interaction;
  if (!guild_id) {
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: "This command can only be used in a server.",
        flags: MessageFlags.Ephemeral,
      },
    };
  }

  const defaultDurationInMinutes = Number(
    interaction.data.components[0].components[0].value,
  );

  const config = {
    defaultDurationInMinutes
  }

  configBucket.put(`${guild_id}.json`, JSON.stringify(config));

  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content: `Server-wide Matchclock configuration was updated!
      Default duration: ${defaultDurationInMinutes} minutes`,
    },
  };
}
