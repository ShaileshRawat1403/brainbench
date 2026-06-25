# Decision Log: BrainBench V2 Identity Shift

## Metadata
- **Decision ID**: 2026-06-25-brainbench-v2-identity
- **Date**: 2026-06-25
- **Author**: Gemini (Antigravity Agent)
- **Status**: Approved
- **System**: BrainBench

## Context & Problem Statement
The repository previously identified as a simple passive execution ledger of the AI SDLC. The agent instructions strictly restricted adding dashboards, app structures, and broad automation. However, to support a scaling ecosystem, the platform requires persistent memory and validation capabilities that survive agent runs.

## Decision
Shift the identity from a passive execution ledger to a **GitHub-native AI SDLC operating memory and validation control plane (Brain + Bench)**. Relax the rules in `AGENTS.md` to allow supervised dashboard and rule-sync updates.

## Rationale
- **Brain** (concept/decisions/memory) solves the cold-restart problem for agents.
- **Bench** (evals/validation/agent-runs) provides execution proof.
- **State** (YAML configs) enables future tool and dashboard automation.

## Implications
- Refactored folder locations (e.g. `daily/` -> `control/daily/`).
- Added temporary stubs to keep path breakages from occurring.
- Requires updating ecosystem status registry to include all 9 projects.

## Evidence / Validation
- Directory structures and migration verified in [bench/validation/2026-06-25-brainbench-v2-refactor.md](file:///Users/ananyalayek/.gemini/antigravity/scratch/ai-sdlc-control-plane/bench/validation/2026-06-25-brainbench-v2-refactor.md).
