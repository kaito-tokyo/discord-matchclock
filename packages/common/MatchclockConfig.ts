export interface MatchclockConfig {
  readonly defaultDurationInMinutes: number;
  readonly version: string;
}

export const matchclockConfigVersionFields = {
  version: "2025042401",
};

export const defaultMatchclockConfig: MatchclockConfig = {
  defaultDurationInMinutes: 25,
  ...matchclockConfigVersionFields,
};
