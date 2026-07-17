export const STUDIO_MODES = [
  "READY",
  "RECORDING",
  "MIXING",
  "BREAK",
] as const;

export type StudioMode = (typeof STUDIO_MODES)[number];

export const MODE_CHANGE_SOURCES = [
  "OPERATOR",
  "AUTOMATION",
  "PROVIDER",
  "MOCK",
] as const;

export type ModeChangeSource = (typeof MODE_CHANGE_SOURCES)[number];

export interface StudioModeState {
  readonly value: StudioMode;
  readonly label: string;
  readonly changedAt: string;
  readonly changedBy: ModeChangeSource;
  readonly pending: boolean;
}
