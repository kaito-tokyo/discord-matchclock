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
            },
          ],
        },
      ],
    },
  };
}

export async function handleConfigureMatchclockSubmit(
  interaction: APIModalSubmitInteraction,
): Promise<APIInteractionResponse> {
  const durationInMinutes = Number(
    interaction.data.components[0].components[0].value,
  );
  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content: `Server-wide Matchclock configuration was updated!
      Default duration: ${durationInMinutes} minutes`,
    },
  };
}
