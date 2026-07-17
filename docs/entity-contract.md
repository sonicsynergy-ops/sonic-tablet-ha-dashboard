# Entity contract

## Purpose

The dashboard must consume studio concepts rather than bind screens directly to Home Assistant entity IDs. This is the initial vocabulary for mock data and future provider adapters; exact schemas will be defined in a later phase.

## Core concepts

### Studio mode

One of:

- `READY`
- `RECORDING`
- `MIXING`
- `BREAK`

A mode has a current value, last-change timestamp, and source. Mode-changing commands will be explicitly allowlisted.

### Broadcast state

Represents whether the studio is off air, preparing, broadcasting, or in an unknown/degraded state. The final normalized state names remain an implementation decision.

### Internal activity

Describes current operational activity within a zone or across the studio. Activity records should identify their zone, kind, status, label, and most recent update.

### Zone

A stable studio area with:

- Application-owned ID and display name
- Optional floorplan position or artwork
- Availability and activity summary
- Status badges
- Capabilities and allowed quick actions

### Alert

A user-visible condition with a stable ID, severity, message, source, timestamp, and acknowledgement behavior. Provider unavailability must be expressible as an alert.

### System health

Read-only operational information for the hidden Admin/System view, such as provider connection, data freshness, tablet/app version, and unavailable mappings.

## Provider mapping boundary

External identifiers belong in provider configuration, not view components. A future mapping may associate an application concept such as `zone.control_room.activity` with a Home Assistant entity, but the UI should receive normalized values through a studio gateway.

## Commands

Commands must use application-owned action IDs and declared targets. Provider adapters may translate those commands to external services only when the action is on an explicit allowlist.

The contract does not permit:

- Home Assistant configuration writes
- Arbitrary service invocation from UI-provided strings
- Credentials in fixture or mapping files
- Silent fallback from a failed command to a different target

## Mock-first requirement

Every contract concept needed by the first UI must be representable in local fixtures. Mock state is the default until a later phase explicitly authorizes and configures an external connection.
