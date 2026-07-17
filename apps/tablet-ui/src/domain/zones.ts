export const ZONE_KINDS = [
  "CONTROL_ROOM",
  "LIVE_ROOM",
  "VOCAL_BOOTH",
  "MACHINE_ROOM",
  "COMMON_AREA",
  "OTHER",
] as const;

export type ZoneKind = (typeof ZONE_KINDS)[number];

export const ZONE_STATUSES = [
  "AVAILABLE",
  "ACTIVE",
  "ATTENTION",
  "OFFLINE",
  "UNKNOWN",
] as const;

export type ZoneStatus = (typeof ZONE_STATUSES)[number];

export const OCCUPANCY_STATUSES = [
  "CLEAR",
  "OCCUPIED",
  "UNKNOWN",
] as const;

export type OccupancyStatus = (typeof OCCUPANCY_STATUSES)[number];

export const ZONE_CAPABILITIES = [
  "OCCUPANCY",
  "LIGHTING",
  "AUDIO",
  "RECORDING",
  "MONITORING",
  "CLIMATE",
] as const;

export type ZoneCapability = (typeof ZONE_CAPABILITIES)[number];

export const ZONE_METRIC_STATUSES = [
  "NORMAL",
  "ACTIVE",
  "WARNING",
  "CRITICAL",
  "UNKNOWN",
] as const;

export type ZoneMetricStatus = (typeof ZONE_METRIC_STATUSES)[number];
export type ZoneMetricValue = string | number | boolean | null;

export interface ZoneOccupancy {
  readonly status: OccupancyStatus;
  readonly count: number | null;
  readonly updatedAt: string;
}

export interface ZoneMetric {
  readonly id: string;
  readonly label: string;
  readonly value: ZoneMetricValue;
  readonly unit: string | null;
  readonly status: ZoneMetricStatus;
  readonly updatedAt: string;
}

export interface ZoneState {
  readonly id: string;
  readonly name: string;
  readonly shortName: string;
  readonly kind: ZoneKind;
  readonly status: ZoneStatus;
  readonly summary: string;
  readonly occupancy: ZoneOccupancy;
  readonly capabilities: readonly ZoneCapability[];
  readonly metrics: readonly ZoneMetric[];
  readonly activeActivityIds: readonly string[];
  readonly updatedAt: string;
}
