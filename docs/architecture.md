# Architecture

## Status

This document records the initial boundary, not an implemented architecture. The application folders are placeholders; no Android build, UI runtime, or Home Assistant adapter exists yet.

## Target shape

The planned product has two application layers:

```text
Android APK shell
  -> bundled tablet UI
      -> typed studio gateway
          -> mock provider initially
          -> Home Assistant adapter later
```

### `apps/tablet-ui/`

Owns the future studio-facing UI, navigation, domain presentation, local state, and typed gateway interface. It must not depend on Lovelace cards, HACS resources, Browser Mod, or Home Assistant DOM internals.

### `apps/android/`

Will own APK packaging, fullscreen/tablet lifecycle behavior, secure environment configuration, and any native bridge needed by the UI. This layer is intentionally empty during the boundary-reset phase.

### Providers

The tablet UI will consume a provider-neutral studio contract:

- A mock provider is the default development source.
- A future Home Assistant provider may translate entity state and allowlisted service calls into that contract.
- Provider-specific entity IDs must not leak throughout UI components.

### `reference/hemma/`

Contains upstream reference material only. It is isolated from the product build and must never become an application dependency or installation payload.

## Integration boundaries

- No application operation may write Home Assistant configuration.
- Runtime controls must use explicit, allowlisted commands.
- Secrets must be supplied outside committed files and stored by an appropriate Android mechanism.
- Connection loss, unavailable entities, and stale state must be representable without breaking the UI.
- The application must remain launchable with local mock data and no network connection.

## Decisions deferred

- Tablet UI framework and build tooling
- Android implementation and packaging details
- Home Assistant transport and authentication mechanism
- Final studio configuration format
- Admin access mechanism

Material choices should be recorded in `docs/adr/` before implementation commits depend on them.
