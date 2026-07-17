export const APPLICATION_ACTION_IDS = [
  "studio.mode.ready",
  "studio.mode.recording",
  "studio.mode.mixing",
  "studio.mode.break",
  "studio.scene.open",
  "studio.scene.close",
  "broadcast.start",
  "broadcast.stop",
  "zone.lights.toggle",
  "zone.audio.mute-toggle",
  "alert.acknowledge",
] as const;

export type ApplicationActionId = (typeof APPLICATION_ACTION_IDS)[number];

export const ACTION_AVAILABILITY_VALUES = [
  "AVAILABLE",
  "DISABLED",
  "RUNNING",
  "UNAVAILABLE",
] as const;

export type ActionAvailability =
  (typeof ACTION_AVAILABILITY_VALUES)[number];

export const ACTION_PRESENTATIONS = [
  "PRIMARY",
  "SECONDARY",
  "DANGER",
] as const;

export type ActionPresentation = (typeof ACTION_PRESENTATIONS)[number];

export type ActionTarget =
  | { readonly kind: "STUDIO" }
  | { readonly kind: "BROADCAST" }
  | { readonly kind: "ZONE"; readonly zoneId: string }
  | { readonly kind: "ALERT"; readonly alertId: string };

export interface ActionConfirmation {
  readonly required: boolean;
  readonly prompt: string | null;
}

export interface QuickAction {
  readonly id: string;
  readonly actionId: ApplicationActionId;
  readonly label: string;
  readonly description: string;
  readonly target: ActionTarget;
  readonly availability: ActionAvailability;
  readonly presentation: ActionPresentation;
  readonly confirmation: ActionConfirmation;
}

export type CommandParameterValue = string | number | boolean;

export interface StudioCommand {
  readonly requestId: string;
  readonly actionId: ApplicationActionId;
  readonly target: ActionTarget;
  readonly parameters: Readonly<Record<string, CommandParameterValue>>;
  readonly requestedAt: string;
}
