export const ALERT_SEVERITIES = ["INFO", "WARNING", "CRITICAL"] as const;

export type AlertSeverity = (typeof ALERT_SEVERITIES)[number];

export const ALERT_STATUSES = [
  "ACTIVE",
  "ACKNOWLEDGED",
  "RESOLVED",
] as const;

export type AlertStatus = (typeof ALERT_STATUSES)[number];

export const ALERT_SCOPE_KINDS = [
  "STUDIO",
  "ZONE",
  "BROADCAST",
  "SYSTEM",
] as const;

export type AlertScopeKind = (typeof ALERT_SCOPE_KINDS)[number];

export interface AlertScope {
  readonly kind: AlertScopeKind;
  readonly id: string | null;
}

export interface StudioAlert {
  readonly id: string;
  readonly severity: AlertSeverity;
  readonly status: AlertStatus;
  readonly title: string;
  readonly message: string;
  readonly scope: AlertScope;
  readonly acknowledgeable: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly acknowledgedAt: string | null;
}
