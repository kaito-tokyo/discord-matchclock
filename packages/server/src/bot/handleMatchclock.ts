import { APIInteractionResponse, ComponentType, InteractionResponseType } from "discord-api-types/v10";

export async function handleMatchclock(interaction: any): Promise<APIInteractionResponse> {
  return {
    type: InteractionResponseType.Modal,
    data: {
      custom_id: "configure_matchclock",
      title: "Configure Matchclock",
      components: [
        {
          type: ComponentType.ActionRow,
          components: []
        }
      ]
    }
  };
}
