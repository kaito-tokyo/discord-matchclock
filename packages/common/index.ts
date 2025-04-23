export interface MatchclockConfig {
  readonly durationInMinutes: number;
}

export const defaultMatchclockConfig: MatchclockConfig = {
  durationInMinutes: 25,
};
