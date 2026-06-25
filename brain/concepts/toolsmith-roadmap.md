# ToolSmith Concept: Utility Roadmap & Repo-Helper Scope

This concept note outlines the roadmap and scoping boundaries for ToolSmith as both an internal automation engine and a future developer utility system.

## Problem Statement
Development projects require a central host for custom scripts, code formatters, dependency managers, and Git automations. Without a clear boundary, project-specific automation scripts (like BrainBench's triage or PR reviews) become tangled with reusable developer utilities, leading to poor code modularity and high maintenance overhead.

## Scoping Boundaries

### 1. Internal ToolSmith Scope (Automation Layer)
- Serves as the script runner and execution host for BrainBench.
- Runs Git-native quality gates, PR risk assessments, and dashboard refreshes inside CI/CD workflows.
- Contains scripts governed directly by `state/intelligence-rules.yml`.

### 2. Future Product Scope (External Utilities)
- Standalone CLI or SDK that developers can import to automate their own workflows.
- Packaged rules engines, code parsers, and repo-indexing helpers.
- Run externally, not bound to the BrainBench control plane state files.

## Repo-Helper Utility Categories
1. **Linter & Format Anchors**: Auto-formatting rules and compliance checks.
2. **Context Packager**: Bundling files and project structures for LLM intake.
3. **Change Diff Analyzer**: Parsing files modified in a commit to summarize semantic impact.

## Candidate Utilities
- `toolsmith pack-context`: Combines directory trees and README files into a single context brief.
- `toolsmith analyze-diff`: Parses local diffs and categorizes changes by file type.

## Acceptance Criteria
- Clear folder isolation between `systems/toolsmith/scripts/intelligence/` (internal) and any future product packages under `systems/toolsmith/lib/`.
- No internal automation scripts import libraries from external product packages.

## Evidence Needed for Validation
- Code architecture audit ensuring script isolation.
- Verification log verifying zero import leaks between internal and product folders.

## Open Questions
- Should the future ToolSmith product CLI be written in TypeScript (Bun) or Python?
- How do we package and distribute ToolSmith utilities as standalone npm packages without exposing internal BrainBench configurations?
