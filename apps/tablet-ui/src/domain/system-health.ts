export const HEALTH_STATUSES = [
  "HEALTHY",
  "DEGRADED",
  "OFFLINE",
  "UNKNOWN",
] as const;

export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export const PROVIDER_CONNECTION_STATUSES = [
  "CONNECTED",
  "CONNECTING",
  "DISCONNECTED",
  "STALE",
  "ERROR",
] as const;

export type ProviderConnectionStatus =
  (typeof PROVIDER_CONNECTION_STATUSES)[number];

export const TABLET_NETWORK_STATUSES = [
  "ONLINE",
  "LIMITED",
  "OFFLINE",
  "UNKNOWN",
] as const;

export type TabletNetworkStatus =
  (typeof TABLET_NETWORK_STATUSES)[number];

export interface ProviderHealth {
  readonly id: string;
  readonly label: string;
  readonly connection: ProviderConnectionStatus;
  readonly lastSyncAt: string | null;
  readonly latencyMs: number | null;
  readonly message: string | null;
}

export interface TabletHealth {
  readonly batteryPercent: number | null;
  readonly charging: boolean | null;
  readonly network: TabletNetworkStatus;
  readonly kioskMode: boolean;
}

export interface ApplicationHealth {
  readonly version: string;
  readonly build: string;
  readonly contractVersion: string;
}

export interface HealthComponent {
  readonly id: string;
  readonly label: string;
  readonly status: HealthStatus;
  readonly message: string | null;
  readonly checkedAt: string;
}

export interface SystemHealth {
  readonly overall: HealthStatus;
  readonly provider: ProviderHealth;
  readonly tablet: TabletHealth;
  readonly application: ApplicationHealth;
  readonly components: readonly HealthComponent[];
  readonly checkedAt: string;
}
