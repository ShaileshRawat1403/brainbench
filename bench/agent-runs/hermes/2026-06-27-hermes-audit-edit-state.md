---
agent: hermes
adapter: adapter-hermes
mode: change_state
allowed: false
risk: high
requires_approval: true
target_system: brainbench
handoff_scope: observation_only
---

## Intent

/edit_state

## Governance Result

Rejected.

## Reason

State mutation is not allowed in adapter-hermes V0.1.

## Safe Fallback

Draft a transition plan instead.
