export const BROADCAST_STATUSES = [
  "OFF_AIR",
  "STANDBY",
  "LIVE",
  "INTERRUPTED",
  "UNKNOWN",
] as const;

export type BroadcastStatus = (typeof BROADCAST_STATUSES)[number];

export const BROADCAST_HEALTH_VALUES = [
  "NOMINAL",
  "WARNING",
  "CRITICAL",
  "UNKNOWN",
] as const;

export type BroadcastHealth = (typeof BROADCAST_HEALTH_VALUES)[number];

export const BROADCAST_DESTINATION_STATUSES = [
  "CONNECTED",
  "CONNECTING",
  "DISCONNECTED",
  "ERROR",
  "UNKNOWN",
] as const;

export type BroadcastDestinationStatus =
  (typeof BROADCAST_DESTINATION_STATUSES)[number];

export interface BroadcastDestination {
  readonly id: string;
  readonly label: string;
  readonly status: BroadcastDestinationStatus;
  readonly audience: number | null;
}

export interface BroadcastState {
  readonly status: BroadcastStatus;
  readonly label: string;
  readonly health: BroadcastHealth;
  readonly detail: string | null;
  readonly startedAt: string | null;
  readonly elapsedSeconds: number | null;
  readonly destinations: readonly BroadcastDestination[];
  readonly updatedAt: string;
}
