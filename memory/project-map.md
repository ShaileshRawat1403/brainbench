# Project Map

Conceptual relationship of projects:

```mermaid
graph TD
    SS[Soothsayer: Suite Shell & Entry Point] -->|API| F[Flowright: Workflow Kernel]
    F -->|Step commands & validation rules| AM[Adapter Membrane: Capability Adapters]
    AM -->|Controlled execution| D[DAX: Governance & Readiness]
    D -->|Executes safely| Workspace[Sandbox / Local Filesystem]
    Workspace -->|Telemetry & evidence| D
    D -->|Readiness evaluation & local ledger| F
    F -->|Signed Evidence Passport| SS
    F -->|PR / Release| Github[GitHub Repo]
    SS -.->|Renders review UI| R[Rook: Operator Workbench UX]
    T[Tessera: SDK/Job-Pack Layer] -.->|Job Packs| F
    TS[ToolSmith: Tool aggregator] -.->|Developer toolsync| Workspace
    BB[BrainBench: Control Plane] -.->|Rules & State| Workspace
```

## System Registries

- **DAX**: [systems/dax/status.md](file:///Users/ananyalayek/.gemini/antigravity/scratch/ai-sdlc-control-plane/systems/dax/status.md)
- **Rook**: [systems/rook/status.md](file:///Users/ananyalayek/.gemini/antigravity/scratch/ai-sdlc-control-plane/systems/rook/status.md)
- **Soothsayer**: [systems/soothsayer/status.md](file:///Users/ananyalayek/.gemini/antigravity/scratch/ai-sdlc-control-plane/systems/soothsayer/status.md)
- **Flowright**: [systems/flowright/status.md](file:///Users/ananyalayek/.gemini/antigravity/scratch/ai-sdlc-control-plane/systems/flowright/status.md)
- **ToolSmith**: [systems/toolsmith/status.md](file:///Users/ananyalayek/.gemini/antigravity/scratch/ai-sdlc-control-plane/systems/toolsmith/status.md)
- **Tessera**: [systems/tessera/status.md](file:///Users/ananyalayek/.gemini/antigravity/scratch/ai-sdlc-control-plane/systems/tessera/status.md)
- **BrainBench**: [systems/brainbench/status.md](file:///Users/ananyalayek/.gemini/antigravity/scratch/ai-sdlc-control-plane/systems/brainbench/status.md)
