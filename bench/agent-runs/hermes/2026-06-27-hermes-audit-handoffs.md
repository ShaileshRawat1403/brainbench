---
agent: hermes
adapter: adapter-hermes
mode: observe
allowed: true
risk: low
requires_approval: false
target_system: repo_handoffs
handoff_scope: observation_only
---

## Intent

/handoffs

## Governance Result

Allowed as read-only observe request.

## Boundaries

- No state mutation performed.
- No PR created.
- No decision approval performed.
- No repo source edited.
