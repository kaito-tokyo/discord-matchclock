import {
  APIInteractionResponse,
  ComponentType,
  InteractionResponseType,
  TextInputStyle,
} from "discord-api-types/v10";

export async function handleMatchclock(
  interaction: any,
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
