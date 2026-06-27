---
agent: hermes
adapter: adapter-hermes
mode: summarize
allowed: true
risk: low
requires_approval: false
target_system: weekly_report
handoff_scope: observation_only
---

## Intent

/weekly

## Governance Result

Allowed as read-only summarize request.

## Boundaries

- No state mutation performed.
- No PR created.
- No decision approval performed.
- No repo source edited.
