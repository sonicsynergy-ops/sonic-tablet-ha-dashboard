# Product scope

## Purpose

`sonic-tablet-ha-dashboard` is a dedicated tablet operations console for Sonic Synergy Studio. It is intended to become an Android APK, not a reusable household dashboard or a Home Assistant Lovelace package.

## First-version product shape

The first version is expected to provide:

- One Studio Overview screen
- One reusable Room/Zone detail pattern
- One hidden Admin/System screen
- Internal activity and broadcast status
- Studio modes: `READY`, `RECORDING`, `MIXING`, and `BREAK`
- A floorplan or room overview
- Quick actions/scenes
- A persistent alert/status strip

## Delivery approach

Development is mock-backed first. Product behavior and visual structure must be testable locally without credentials or a Home Assistant connection. An Android APK shell and external-system adapters will be introduced in later phases.

## Non-goals

- Installing or registering a Lovelace dashboard
- Modifying live Home Assistant YAML, helpers, themes, packages, or resources
- Recreating Hemma as a generic home dashboard
- Shipping household-oriented Plex, plant, bedroom, kitchen, or lifestyle features
- Implementing screens or Android build tooling during the repository boundary reset

## Safety boundary

Home Assistant may eventually be a state and command provider, but it is not the application host. Future commands must be explicit, allowlisted application actions. Configuration mutation is outside the product boundary.
