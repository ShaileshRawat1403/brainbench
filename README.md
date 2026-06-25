# BrainBench: AI SDLC Control Plane

A GitHub-native operating memory and validation control plane for AI-assisted software delivery across the Sans Serif Systems ecosystem.

## Operating Model: Brain + Bench

- **Brain** (`brain/`): Long-term memory, concepts, decisions, product and project context.
- **Bench** (`bench/`): Sprints, work-items, pull request reviews, validation evidence, evals, and agent run histories.
- **Control** (`control/`): Operating rules, daily logs, template specifications, and agent handoffs.
- **Dashboard** (`dashboard/`): Dynamic markdown views of system status, project views, and sprint metrics.
- **Memory** (`memory/`): Active working context for current sessions (prevents cold agent startups).
- **State** (`state/`): Machine-readable YAML state configurations for dashboards and automation engines.
- **Systems** (`systems/`): Per-system documentation and execution boundaries.

## Systems Tracked

- **BrainBench**: Control plane governance.
- **DAX**: Governed execution workstation.
- **Rook**: Operator workbench UI.
- **Soothsayer**: Workspace catalog and inbox.
- **Flowright**: Workflow execution kernel.
- **ToolSmith**: Developer tool aggregator.
- **Tessera**: Reusable SDK and job-pack layers.
- **Picobot**: Slack/Discord chat ingress.
- **PruningMyPothos**: Ecosystem documentation.
