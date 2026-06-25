# Control Rules

This file defines the operating rules for the AI SDLC control plane.

## Scope

This repository tracks nine systems:

- BrainBench
- DAX
- Rook
- Soothsayer
- Flowright
- ToolSmith
- Tessera
- Picobot
- PruningMyPothos

Do not add unrelated projects without updating `ecosystem.yml` and this file.

## Active system limit

Maximum active systems at one time: 3.

Current active systems:

- BrainBench
- DAX
- Rook

If another system needs active work, one current active system must be moved to paused.

## Active branch limit

Maximum active implementation branches across the ecosystem: 3.

A branch is active if it requires validation, review, continued implementation, or PR follow-up.

## Handoff rule

Every implementation branch must have a handoff before agent execution continues.

A handoff must include:

- repo
- branch
- objective
- files changed or expected
- validation commands
- non-goals
- stopping condition

Handoff files are stored under `control/handoffs/`.

## Daily report rule

Every day starts by reading the latest daily report before opening new work.

Daily reports are stored under `control/daily/YYYY/MM/YYYY-MM-DD.md`.

## Scope rule

Do not bundle unrelated cleanup with implementation work.

If an unrelated issue appears, add it to `bench/work-items/parking-lot.md`.

## Agent mode rule

Use normal connector mode for branches, handoffs, small patches, issues, and PR drafts.

Use Agent Mode for local build loops, multi-file refactors, debugging compile failures, and repository-wide patch cycles.

## Stop conditions

Stop agent execution when:

- validation repeatedly fails
- files outside scope are required
- a risky area is touched
- repo mapping is unresolved
- the handoff does not define done criteria

## Risk-sensitive areas

Require explicit approval before changing:

- auth
- provider credentials
- CI/CD workflows
- release scripts
- policy engines
- audit logic
- database migrations
- secrets handling
- deployment configuration
