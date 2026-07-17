import type { InternalActivity } from "./activity";
import type { StudioAlert } from "./alerts";
import type { BroadcastState } from "./broadcast";
import type { QuickAction } from "./quick-actions";
import type { StudioModeState } from "./studio-mode";
import type { SystemHealth } from "./system-health";
import type { ZoneState } from "./zones";

export const STUDIO_STATE_CONTRACT_VERSION = "1.0.0" as const;

export const STUDIO_STATE_ORIGINS = ["MOCK", "PROVIDER"] as const;

export type StudioStateOrigin = (typeof STUDIO_STATE_ORIGINS)[number];

export interface StudioIdentity {
  readonly id: string;
  readonly name: string;
  readonly timezone: string;
}

export interface StudioStateFreshness {
  readonly stale: boolean;
  readonly ageSeconds: number;
  readonly expiresAfterSeconds: number;
}

export interface StudioState {
  readonly contractVersion: typeof STUDIO_STATE_CONTRACT_VERSION;
  readonly fixtureId: string | null;
  readonly generatedAt: string;
  readonly origin: StudioStateOrigin;
  readonly freshness: StudioStateFreshness;
  readonly studio: StudioIdentity;
  readonly mode: StudioModeState;
  readonly broadcast: BroadcastState;
  readonly activity: readonly InternalActivity[];
  readonly zones: readonly ZoneState[];
  readonly alerts: readonly StudioAlert[];
  readonly quickActions: readonly QuickAction[];
  readonly systemHealth: SystemHealth;
}
