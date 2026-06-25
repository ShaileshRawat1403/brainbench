# Agent Instructions

This repository is the operating memory and validation control plane (Brain + Bench) for the AI SDLC ecosystem.

## Prime Directive

Agents must act within supervised boundaries to maintain project context, compile validation evidence, log decisions, and update status dashboards.

## Allowed Work

Agents may:
- Update long-term memory, concepts, decisions, and product/project records in `brain/`.
- Log sprint progress, tasks, evals, and validation evidence in `bench/`.
- Log daily reports, templates, rules, and handoffs in `control/`.
- Update markdown views in `dashboard/` summarizing operating state.
- Keep session context up-to-date in `memory/active-context.md` to prevent cold restarts.
- Write machine-readable state YAMLs in `state/` to coordinate automation.
- Update system documentation status under `systems/`.

## Restricted Work (Strict Boundaries)

Agents MUST NOT change or perform the following without explicit human approval:
- Secrets, credentials, or auth configs.
- CI/CD workflows, build pipelines, or deployments.
- Release scripts or package promotion rules.
- Audit logic or policy engine settings.
- Expanding tracked systems in `ecosystem.yml` or adding new folders to `systems/`.
- Self-approving run reviews, claims verification, or merging code silently.

## Required Handoff Structure

Every implementation handoff under `control/handoffs/` must include:
- Objective
- Repository
- Branch
- Status
- Expected files changed
- Validation commands
- Non-goals
- Stop conditions
- Instructions for the next agent

## Validation Discipline

Do not claim a branch or work item is ready unless validation evidence is recorded under `bench/validation/`. If local validation cannot be run, log it clearly as `needs_local_validation`.
