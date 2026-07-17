# sonic-tablet-ha-dashboard

An APK-oriented tablet dashboard foundation for Sonic Synergy Studio.

> This repository is **not** a Home Assistant Lovelace install package. Do not copy its files into a Home Assistant configuration directory.

The product direction is a dedicated studio operations console packaged as an Android APK. Development starts with local mock data so the application can be designed and tested without connecting to a live Home Assistant instance.

## Project boundaries

- The tablet application will not install dashboards, packages, themes, helpers, or other configuration into Home Assistant.
- The project will not write to live Home Assistant configuration.
- Future Home Assistant connectivity must sit behind an explicit application adapter and a constrained action contract.
- Credentials and environment-specific settings must not be committed to the repository.
- Hemma is retained only as design and template reference material.

## Repository layout

```text
apps/
  android/             Android APK shell (not scaffolded yet)
  tablet-ui/           Tablet UI application (not scaffolded yet)
config/                Future example configuration and schemas
docs/                  Product, architecture, and entity-contract notes
reference/hemma/       Preserved upstream Hemma reference material
tests/fixtures/        Future local/mock data fixtures
tests/screenshots/     Future visual regression artifacts
```

The empty application directories are intentional. No Android build, UI framework, or runtime implementation is part of the current boundary-reset phase.

## Current phase

The repository has been reset around the Sonic product boundary:

1. Preserve Hemma as upstream reference material.
2. Establish an APK-oriented project shell.
3. Define the product and integration boundaries before implementation.

No application build or Home Assistant connection is expected at this stage.

## Hemma attribution

This project began from [Hemma](https://github.com/willsanderson/Hemma) by willsanderson. The original material and its attribution are preserved under [`reference/hemma/`](reference/hemma/). The upstream MIT license remains in [`LICENSE`](LICENSE).
