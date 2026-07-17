export const ACTIVITY_KINDS = [
  "OCCUPANCY",
  "AUDIO",
  "RECORDING",
  "BROADCAST",
  "EQUIPMENT",
  "ENVIRONMENT",
  "WORKFLOW",
] as const;

export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

export const ACTIVITY_STATUSES = [
  "IDLE",
  "ACTIVE",
  "PAUSED",
  "WARNING",
  "ERROR",
  "UNKNOWN",
] as const;

export type ActivityStatus = (typeof ACTIVITY_STATUSES)[number];

export interface InternalActivity {
  readonly id: string;
  readonly zoneId: string | null;
  readonly kind: ActivityKind;
  readonly status: ActivityStatus;
  readonly title: string;
  readonly detail: string | null;
  readonly startedAt: string | null;
  readonly updatedAt: string;
}
