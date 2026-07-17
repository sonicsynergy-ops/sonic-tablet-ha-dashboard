# Entity contract

## Purpose

The Sonic tablet dashboard consumes one provider-neutral `StudioState` document. Screens must render studio concepts from that document rather than bind directly to an automation platform, transport, or external entity identifier.

The TypeScript source of truth lives in `apps/tablet-ui/src/domain/`. The current contract version is `1.0.0`. It is framework-neutral and does not define components, routes, storage, or network behavior.

## Aggregate state

`StudioState` contains everything required by the first future screens:

- Studio identity and timezone
- State generation time, origin, and freshness
- Current studio mode
- Broadcast state and destinations
- Internal activity
- Zone summaries and metrics
- Active, acknowledged, and resolved alerts
- Available quick actions
- Provider, tablet, application, and component health

Consumers must use `freshness.stale` and `systemHealth` rather than assuming every value is current. A degraded fixture demonstrates how stale and unavailable values are represented.

## Studio mode

Studio mode expresses the operating posture of the whole studio:

- `READY`: systems are prepared for normal studio work.
- `RECORDING`: capture is in progress or the recording workflow is active.
- `MIXING`: monitoring and playback are focused on mix work.
- `BREAK`: the active session is intentionally paused.

`StudioModeState` also carries a display label, change timestamp, change source, and pending flag. Mode is operational context; it does not imply a broadcast state. For example, recording may be internal or broadcast live.

## Broadcast state

Broadcast state is modeled separately from studio mode:

- `OFF_AIR`: no program feed is being published.
- `STANDBY`: the broadcast chain is preparing or waiting.
- `LIVE`: at least the intended program workflow is live.
- `INTERRUPTED`: a previously live workflow has a known interruption.
- `UNKNOWN`: the provider cannot establish current broadcast state.

`BroadcastState` includes normalized health, optional timing, a human-readable detail, and destination summaries. Destination IDs are application-owned identifiers, not provider identifiers.

## Internal activity

`InternalActivity` describes what is happening now or what has recently changed. Activity is intentionally event-like and display-ready; it is not a raw external state object.

Each activity has:

- A stable application ID
- An optional zone association
- A kind such as occupancy, audio, recording, broadcast, equipment, environment, or workflow
- A normalized status
- A title, optional detail, and timestamps

Zone records reference relevant activity IDs so an overview and a zone detail screen can present the same activity without duplicating provider logic.

## Zones

`ZoneState` represents an application-defined studio area. Its ID remains stable even if the underlying provider mapping changes.

A zone contains:

- Name, short name, and kind
- Operational status and summary
- Normalized occupancy
- Declared capabilities
- Display metrics with value, unit, status, and update time
- Active activity references

Floorplan placement is static product configuration in `config/studio.example.yaml`; it is not runtime provider state. Provider mappings may supply values for zone state, but they do not define the studio layout.

## Alerts

`StudioAlert` is a user-visible condition with:

- Severity: `INFO`, `WARNING`, or `CRITICAL`
- Lifecycle status: `ACTIVE`, `ACKNOWLEDGED`, or `RESOLVED`
- Studio, zone, broadcast, or system scope
- Message, timestamps, and acknowledgement metadata

Alerts are not inferred by UI components. Mock or provider gateways create normalized alerts so the alert strip and Admin/System view share one interpretation. Acknowledgement is an allowlisted application command and does not silently resolve the underlying condition.

## Quick actions and commands

`QuickAction` describes an action the current state permits the operator to attempt. It supplies presentation metadata, a typed target, availability, and confirmation requirements.

Every command uses an `ApplicationActionId` from the closed allowlist in `quick-actions.ts`. Initial actions cover studio-mode changes, approved studio scenes, broadcast start/stop, bounded zone controls, and alert acknowledgement.

The UI may submit only:

- An allowlisted application action ID
- A typed studio, broadcast, zone, or alert target
- Scalar parameters defined by that application action
- Request identity and time

The UI cannot submit provider service names or arbitrary execution strings. Provider adapters must reject unknown actions, invalid targets, and parameters outside an action's definition.

## System health

`SystemHealth` supports the hidden Admin/System screen and degraded-state handling. It contains:

- Overall normalized health
- Provider connection, last synchronization, latency, and message
- Tablet battery, charging, network, and kiosk-mode state
- Application version, build, and contract version
- Individually named component checks

Unknown values use explicit `null`, `UNKNOWN`, or unavailable states. They must not be displayed as healthy defaults.

## Provider mapping boundary

The application contract and studio configuration use only Sonic-owned IDs. External identifiers are isolated in `config/entity-map.example.yaml`, which is provider configuration and must not be imported by view code.

The boundary is:

```text
external provider state
  -> provider mapping and normalization
    -> StudioState
      -> future tablet UI

future UI command
  -> allowlisted ApplicationActionId and typed target
    -> provider adapter validation
      -> mapped provider operation
```

Provider mappings may translate external values into contract enums and may map approved application actions to fixed adapter operations. They must not expose credentials, arbitrary scripts, provider objects, or configuration mutation capabilities to the UI.

## Configuration files

- `config/studio.example.yaml` defines studio identity, zones, floorplan placement, visible quick actions, and hidden-admin behavior.
- `config/studio-config.schema.json` constrains the provider-neutral studio configuration and action allowlist.
- `config/entity-map.example.yaml` demonstrates the isolated provider mapping boundary.

Configuration and runtime state are separate: configuration describes stable product structure, while `StudioState` describes current operating state.

## Mock fixtures

Fixtures in `tests/fixtures/` cover:

- Ready and available operation
- Active recording with a live broadcast
- Mixing with an actionable warning
- Break mode
- Stale provider data, unavailable commands, critical alerts, and partial zone failure

These fixtures are the default development inputs until a later phase explicitly introduces a provider adapter. No external connection is required to consume them.

## Contract rules

- Home Assistant and other provider identifiers do not belong in UI-facing types or mock fixtures.
- Provider identifiers are isolated to the provider mapping example.
- Commands are allowlisted application actions, never arbitrary provider service strings.
- Configuration writes are outside the product boundary.
- Credentials do not belong in mappings, fixtures, or application configuration.
- Consumers must tolerate stale, unknown, unavailable, and partial state.
- Contract changes require a version decision and corresponding fixture updates.
