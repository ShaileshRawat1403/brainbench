---
type: decision-log
id: brainbench-v0.4.9-reliability-pass
title: "Approve hosted reliability improvements for the read-only Telegram delivery layer"
date: 2026-06-27
status: approved
owner: Shailesh Rawat
resolves: gap-2026-06-27-78eeef3-toolsmith-script-architecture
---

# Decision Record: Approve hosted reliability improvements for the read-only Telegram delivery layer

## Context & Background
To transition to V0.4.9, we introduced operational hardening to the Telegram bot delivery layer to prevent sensitive credentials leakages, handle transient network dropouts, and validate runtime path dependencies before container deployment.

## Governance & Safety Boundaries
1. **Approved Scope**: V0.4.9 approves hosted reliability improvements for the read-only Telegram delivery layer, including log sanitization, Telegram API retry backoff, startup validation, and adapter path validation. It does not approve mutation commands, state transitions, webhook servers, PR actions, merge actions, or decision approvals.
2. **Log Sanitization**: Implemented `sanitizeText` to redact the `TELEGRAM_BOT_TOKEN` in all fetch payloads, warning logs, shell commands, and exception messages.
3. **API Retry & Backoff**: Configured `safeFetch` to attempt transient API fetches (e.g. 5xx statuses or network exceptions) up to 3 times with exponential backoff delays. Rejection actions (such as blocked mutation commands) are resolved instantly without retrying.
4. **Adapter Path Verification**: Validates the presence of `ADAPTER_HERMES_PATH` prior to spawning task commands, printing clean governance failures instead of raw runtime exceptions.

## Gaps Resolved
- Resolves: `gap-2026-06-27-78eeef3-toolsmith-script-architecture`
