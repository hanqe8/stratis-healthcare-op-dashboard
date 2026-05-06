# STRATIS Healthcare Ops

AI Command Centre for Regulated Healthcare Operations.

STRATIS Healthcare Ops is a static, browser-based MVP that demonstrates the operating decision loop for discharge workflow management:

**Signal -> Blocker classification -> Risk/SLA prioritisation -> Recommendation -> Human decision -> Escalation/action -> Outcome -> Governance log -> Weekly executive brief**

The product uses synthetic discharge workflow data only. It does not use real patient data, does not make clinical diagnosis or treatment recommendations, and does not require an API key or backend.

## Product Thesis

Regulated healthcare operations need more than dashboards. They need decision systems that make operational blockers visible, rank escalation urgency, preserve human judgement, and generate leadership-ready operating briefs with an audit trail.

This MVP shows how a deterministic rules engine can support human-in-the-loop operational decisions while keeping the governance boundary clear.

## Features

- Built-in synthetic discharge workflow dataset.
- KPI cards for planned discharges, readiness, blockers, SLA breaches, blocker age, bed-release risk, and escalation closure.
- Deterministic blocker classification across Medication, Documentation, Transport, Caregiver, Billing, AlliedHealth, Equipment, BedManagement, and Unknown.
- Prioritised escalation queue using transparent scoring rules.
- Recommendation cards with rationale, accountable owner, confidence, and expected next step.
- Human review actions: accept, override, escalate, resolve, and reject.
- Rationale gate for overrides and escalations.
- Browser-local governance log for recommendations, human decisions, resets, and brief generation.
- KPI tree linking discharge cycle time pressure to blocker categories and accountable owners.
- Interactive Daily, Weekly, and Monthly KPI Tree drill-down by blocker category.
- Light and Dark Mode settings aligned to the STRATIS workbench visual family.
- Weekly executive operating brief with Markdown export.
- Daily, Weekly, and Monthly brief variants with Executive and Detailed modes.
- Formatted Text and Markdown viewing modes for operating briefs.
- Synthetic reporting-period data so Daily, Weekly, and Monthly briefs contain different case scopes.
- Layperson-readable governance event cards with filter controls.
- Removable Governance Log filter chips for active criteria.
- Configurable frontend Governance Log taxonomy for event types and categories, with duplicate checks.
- Command Centre filters and sortable operating table with adaptive risk indicators.
- CSV export for synthetic cases.
- Static GitHub Pages deployment workflow.

## Screenshots

Add screenshots after first deployment:

- Overview dashboard
- Escalation queue
- Human review
- Governance log
- Weekly brief

## Tech Stack

- React
- TypeScript strict mode
- Vite
- Tailwind CSS
- Recharts
- Papa Parse
- LocalStorage persistence
- Vitest
- GitHub Actions and GitHub Pages

## Performance Notes

Recharts is split into a dedicated Vite manual chunk named `charts`, with React in `react-vendor`. This keeps the main application bundle smaller while preserving chart availability across multiple dashboard views.

## Getting Started

```bash
npm install
npm run dev
```

Run tests:

```bash
npm test
```

Build static site:

```bash
npm run build
```

## Governance Boundary

This MVP is an operations decision-support artifact. It does not process PHI, does not include real patient data, and does not provide medical advice. Recommendations are deterministic operational suggestions and require human review for material workflow decisions.

## Documentation

- [PRD](docs/prd.md)
- [Product Brief](docs/product-brief.md)
- [Architecture](docs/architecture.md)
- [KPI Tree](docs/kpi-tree.md)
- [Model Card](docs/model-card.md)
- [Human-in-the-Loop Design](docs/human-in-the-loop-design.md)
- [Governance Log Design](docs/governance-log-design.md)
- [Data Dictionary](docs/data-dictionary.md)
- [Roadmap](docs/roadmap.md)

## Roadmap

Near-term roadmap themes:

- CSV import UI and schema validation.
- Governance log export bundle.
- Scenario filters by ward, owner, and service line.
- Optional AI-generated narrative brief with deterministic fallback.
- More robust persistence using IndexedDB/Dexie.
- Accessibility and keyboard workflow hardening.
