export interface MatchclockConfig {
  readonly durationInMinutes: number;
  readonly version: string;
}

export const matchclockConfigVersionFields = {
  version: "2025042401"
}

export const defaultMatchclockConfig: MatchclockConfig = {
  durationInMinutes: 25,
  ...matchclockConfigVersionFields,
};
