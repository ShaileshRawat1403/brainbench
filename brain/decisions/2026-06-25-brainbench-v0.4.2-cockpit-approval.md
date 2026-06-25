---
type: decision-log
id: brainbench-v0.4.2-cockpit-approval
title: "Approve BrainBench V0.4.2 Repo Insight Cockpit Refinements"
date: 2026-06-25
status: approved
owner: Shailesh Rawat
resolves: gap-2026-06-25-ed29dd2-toolsmith-script-architecture
---

# Decision Record: BrainBench V0.4.2 Repo Insight Cockpit

## Context & Background
To turn the BrainBench index dashboard into a repository-aware operating cockpit, we are reorganizing the control surface in `dashboard/index.md` to group project insights, action lanes, quality gates, and recommended actions by system/repository.

## Approved Changes
1. **Dynamic Registry Scanning**: Parse `ecosystem.yml` and `systems/*/status.md` (headings & frontmatter fallbacks) dynamically.
2. **Work Item System Mapping**: Parse `bench/work-items/*.md` and assign issues to their target systems or group them under `Unmapped` if unknown.
3. **Repo/System Insight Matrix**: Group and display state, risk, evidence, decision, advisory signals, and next actions by system/repository.
4. **Repo Action Lanes**: Individualized signals, statuses, and actions for each system.
5. **Quality Gates by Repo**: Group gate status and overall health dynamically per repository.
6. **Agent Advisory Signals**: Collate signals from Triage, Evidence, Decision, and Brief agents.
7. **Repo-Specific Recommended Actions**: Structured, group-based recommendations.
8. **Operator Notes Block**: Added `## Operator Notes` block to `dashboard/index.md` to preserve manual observations.

## Implementation Verification
- Refactored `dashboard-refresh.ts` and executed it cleanly.
- Verified that all visual cockpit tables, status flags, and Mermaid flowchart render correctly.
- Confirmed that running `decision-gap.ts` correctly detects the decision record.
