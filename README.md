# STRATIS Healthcare Ops

AI Command Centre for Regulated Healthcare Operations.

STRATIS Healthcare Ops is a static, browser-based MVP that demonstrates how regulated healthcare operations can move beyond passive dashboards into a structured operating decision loop.

> Signal → Blocker classification → Risk/SLA prioritisation → Recommendation → Human decision → Escalation/action → Outcome → Governance log → Operating brief

The product uses synthetic discharge workflow data only. It does not use real patient data, does not process PHI, does not make clinical diagnoses or treatment recommendations, and does not require an API key or backend for the MVP.

<p align="center">
  <img src="docs/assets/readme/stratis-healthcare-ops-hero.png" alt="STRATIS Healthcare Ops overview" width="860">
</p>

---

## Product Thesis

Regulated healthcare operations need more than dashboards. They need decision systems that make operational blockers visible, rank escalation urgency, preserve human judgement, and generate leadership-ready operating briefs with a clear audit trail.

STRATIS Healthcare Ops demonstrates how a deterministic rules engine can support human-in-the-loop operational decisions while keeping the governance boundary explicit.

The product is intentionally scoped as an operations decision-support artifact:

- It supports discharge workflow visibility and escalation prioritisation.
- It uses synthetic operational data only.
- It keeps recommendations deterministic and inspectable.
- It requires human review for material workflow decisions.
- It preserves governance events for auditability.
- It generates operating briefs from accepted operational state.

---

## What This Demonstrates

STRATIS Healthcare Ops is a portfolio-grade product build that demonstrates:

- Healthcare operations workflow design.
- Regulated decision-support thinking.
- Human-in-the-loop operating governance.
- Rule-based blocker classification and prioritisation.
- SLA and escalation queue design.
- KPI tree and operational root-cause mapping.
- Governance log design and audit-trail preservation.
- Executive operating brief generation.
- Static-site deployment through GitHub Pages.

The project is not intended to show clinical AI. It is designed to show how operational decision systems can be made more structured, reviewable, and accountable.

---

## Core Operating Loop

```text
Signal
  ↓
Blocker classification
  ↓
Risk/SLA prioritisation
  ↓
Recommendation
  ↓
Human decision
  ↓
Escalation/action
  ↓
Outcome
  ↓
Governance log
  ↓
Operating brief
```

This loop is the main product differentiator. The application is not just showing operational metrics; it connects those metrics to decisions, escalation ownership, governance events, and leadership-ready reporting.

---

## Core Use Cases

| Use Case | What the Product Supports |
|---|---|
| Discharge workflow monitoring | Track readiness, blockers, SLA breaches, blocker ageing, and bed-release risk. |
| Escalation prioritisation | Rank operational cases using transparent deterministic scoring rules. |
| Human-in-the-loop review | Accept, override, escalate, resolve, or reject operational recommendations. |
| Governance logging | Preserve recommendation, decision, rationale, reset, and brief-generation events. |
| KPI tree analysis | Link discharge cycle time pressure to blocker categories and accountable owners. |
| Operating briefs | Generate Daily, Weekly, or Monthly briefs in Executive or Detailed mode. |

---

## Key Features

### 1. Synthetic Discharge Workflow Dataset

The application ships with built-in synthetic discharge workflow data. It is designed to demonstrate operational scenarios without exposing real patient data, PHI, or confidential healthcare information.

### 2. Operations Dashboard

Dashboard KPI cards summarise:

- Planned discharges
- Ready cases
- Blocked cases
- SLA breaches
- Average blocker age
- Bed-release risk
- Escalation closure
- Operating risk distribution

### 3. Deterministic Blocker Classification

The app classifies blockers across operational categories:

- Medication
- Documentation
- Transport
- Caregiver
- Billing
- Allied Health
- Equipment
- Bed Management
- Unknown

Classification is rule-based in the MVP, making the logic inspectable and testable.

### 4. Prioritised Escalation Queue

The escalation queue ranks cases using transparent scoring logic based on operational urgency, SLA risk, blocker age, capacity impact, and confidence.

### 5. Recommendation Cards

Each case can include a recommendation with:

- Recommended action
- Rationale
- Accountable owner
- Confidence
- Expected next step
- Risk and SLA context

### 6. Human Review Actions

Users can act on recommendations by selecting:

- Accept
- Override
- Escalate
- Resolve
- Reject

Overrides and escalations require a rationale. This keeps the human decision visible rather than silently replacing the system recommendation.

### 7. Governance Log

The browser-local governance log records:

- Recommendations generated
- Human decisions
- Overrides
- Escalations
- Resolutions
- Rejections
- Reset events
- Brief-generation events

Governance events are displayed as layperson-readable cards with filtering and removable active filter chips.

### 8. KPI Tree

The KPI tree links discharge cycle time pressure to blocker categories, owners, reporting periods, and operating implications.

Supported views include:

- Daily
- Weekly
- Monthly

The KPI tree is designed to show operational root causes, not just aggregate dashboard numbers.

### 9. Operating Briefs

The app can generate Daily, Weekly, and Monthly operating briefs.

Brief modes:

- Executive
- Detailed

View modes:

- Formatted Text
- Markdown

Briefs can be exported in Markdown for reuse in operating reviews, documentation, or portfolio write-ups.

### 10. Configurable Governance Taxonomy

The frontend governance log taxonomy can be configured for event types and event categories. Duplicate checks help prevent equivalent labels from being added with different spacing or casing.

### 11. Command Centre Filters and Operating Table

The Command Centre includes filters and a sortable operating table with adaptive risk indicators.

### 12. CSV Export

Synthetic cases can be exported as CSV for further analysis or demonstration.

### 13. Light and Dark Mode

The visual system includes light and dark mode settings aligned to the broader STRATIS workbench family.

### 14. Static Deployment

The application is built for GitHub Pages deployment through GitHub Actions.

---

## Application Screenshots

Add screenshots after deployment.

Recommended screenshot set:

<table>
  <tr>
    <td width="33%" align="center" valign="top">
      <img src="docs/assets/readme/overview-dashboard.png" alt="STRATIS Healthcare Ops overview dashboard" width="100%">
    </td>
    <td width="33%" align="center" valign="top">
      <img src="docs/assets/readme/escalation-queue.png" alt="STRATIS Healthcare Ops escalation queue" width="100%">
    </td>
    <td width="33%" align="center" valign="top">
      <img src="docs/assets/readme/human-review.png" alt="STRATIS Healthcare Ops human review workflow" width="100%">
    </td>
  </tr>
  <tr>
    <td width="33%" valign="top">
      <sub>
        <strong>Overview Dashboard</strong><br>
        Shows discharge readiness, blocker status, SLA pressure, bed-release risk, and operational performance at a glance.
      </sub>
    </td>
    <td width="33%" valign="top">
      <sub>
        <strong>Escalation Queue</strong><br>
        Prioritises operational cases using transparent scoring rules and identifies the next accountable action.
      </sub>
    </td>
    <td width="33%" valign="top">
      <sub>
        <strong>Human Review</strong><br>
        Captures accept, override, escalate, resolve, or reject decisions with rationale and governance traceability.
      </sub>
    </td>
  </tr>
</table>

<table>
  <tr>
    <td width="50%" align="center" valign="top">
      <img src="docs/assets/readme/governance-log.png" alt="STRATIS Healthcare Ops governance log" width="100%">
    </td>
    <td width="50%" align="center" valign="top">
      <img src="docs/assets/readme/operating-brief.png" alt="STRATIS Healthcare Ops operating brief" width="100%">
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <sub>
        <strong>Governance Log</strong><br>
        Preserves recommendation, decision, escalation, reset, and brief-generation events in readable audit cards.
      </sub>
    </td>
    <td width="50%" valign="top">
      <sub>
        <strong>Operating Brief</strong><br>
        Converts operating state into Daily, Weekly, or Monthly leadership-ready briefs in Executive or Detailed mode.
      </sub>
    </td>
  </tr>
</table>

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Language | TypeScript strict mode |
| Build tool | Vite |
| Styling | Tailwind CSS |
| Charts | Recharts |
| CSV handling | Papa Parse |
| Persistence | LocalStorage |
| Testing | Vitest |
| Deployment | GitHub Actions and GitHub Pages |

---

## Performance Notes

Recharts is split into a dedicated Vite manual chunk named `charts`, with React in `react-vendor`. This keeps the main application bundle smaller while preserving chart availability across multiple dashboard views.

---

## Getting Started

STRATIS Healthcare Ops is a static browser-based application built with React, Vite, TypeScript, and Tailwind CSS.

Before running the project locally, ensure you have Node.js 18 or later, npm, and Git installed.

```bash
node --version
npm --version
git --version
```

Clone the repository and move into the project directory:

```bash
git clone https://github.com/hanqe8/stratis-healthcare-op-dashboard.git
cd stratis-healthcare-op-dashboard
```

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

After the development server starts, open the local URL shown in your terminal. Vite commonly serves the app at:

```bash
http://localhost:5173
```

Run the test suite:

```bash
npm test
```

Build the static site:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

If any command differs in your local setup, refer to the scripts defined in `package.json`.

---

## Recommended First Walkthrough

A recommended reviewer walkthrough is:

1. Open the Overview dashboard.
2. Review planned discharges, blocked cases, SLA breaches, and bed-release risk.
3. Open the Command Centre table and inspect blocker classifications.
4. Review the Escalation Queue and priority ordering.
5. Select a case in Human Review.
6. Accept, override, escalate, resolve, or reject the recommendation.
7. Confirm that the action appears in the Governance Log.
8. Open the KPI Tree and review Daily, Weekly, and Monthly views.
9. Generate an Executive operating brief.
10. Switch to Detailed mode and inspect the reasoning trail.
11. Export the brief as Markdown.
12. Export synthetic cases as CSV.

This walkthrough demonstrates the core operating loop:

> Signal → Blocker classification → Risk/SLA prioritisation → Recommendation → Human decision → Escalation/action → Outcome → Governance log → Operating brief

---

## Governance Boundary

This MVP is an operations decision-support artifact.

It does not:

- process PHI;
- include real patient data;
- make clinical diagnoses;
- recommend treatment;
- replace clinical or operational judgement;
- provide medical advice;
- require an API key;
- require a backend.

All recommendations are deterministic operational suggestions based on synthetic workflow data and require human review for material workflow decisions.

---

## Data and Privacy

This repository and public demo should only use synthetic, public, or non-confidential data.

Do not upload, paste, or commit:

- real patient data;
- PHI;
- confidential healthcare operations data;
- employer-owned documents;
- proprietary datasets;
- API keys;
- credentials;
- private operational logs.

The MVP is designed for portfolio demonstration and product evaluation. It should not be treated as an enterprise-secure healthcare operations system.

---

## Documentation

| Document | Purpose |
|---|---|
| [PRD](docs/prd.md) | Product requirements, user stories, scope, and acceptance criteria |
| [Product Brief](docs/product-brief.md) | Product thesis, positioning, and portfolio rationale |
| [Architecture](docs/architecture.md) | Static app architecture and module boundaries |
| [KPI Tree](docs/kpi-tree.md) | Metric hierarchy and operational root-cause mapping |
| [Model Card](docs/model-card.md) | Rule-based model scope, assumptions, and limitations |
| [Human-in-the-Loop Design](docs/human-in-the-loop-design.md) | Human review, override, escalation, and rationale design |
| [Governance Log Design](docs/governance-log-design.md) | Event model, audit logic, and governance trail |
| [Data Dictionary](docs/data-dictionary.md) | Synthetic dataset fields and definitions |
| [Roadmap](docs/roadmap.md) | Planned feature evolution |

---

## Testing

The test suite should focus on externally visible behaviour and product-critical logic.

Recommended test coverage:

- Blocker classification.
- Priority scoring.
- Recommendation generation.
- Governance event creation.
- Brief generation.
- Taxonomy duplicate checks.
- CSV export behaviour.
- Filtering and sorting logic.

Run tests with:

```bash
npm test
```

---

## Roadmap

Near-term roadmap themes:

| Theme | Description |
|---|---|
| CSV import UI and schema validation | Allow users to import their own synthetic or non-confidential operational datasets. |
| Governance log export bundle | Export governance events for review, documentation, or operating packs. |
| Scenario filters | Add richer filters by ward, owner, service line, blocker type, and reporting period. |
| Optional AI-generated narrative | Add AI-generated operating narrative with deterministic fallback and human review. |
| IndexedDB persistence | Move from LocalStorage to IndexedDB/Dexie for more robust local project storage. |
| Accessibility hardening | Improve keyboard workflows, focus states, table navigation, and screen-reader support. |
| Screenshot and demo polish | Add README screenshots, demo GIF, and a more complete Product Labs case study page. |

---

## Current Limitations

- Synthetic data only.
- No PHI or real patient data support.
- No backend storage.
- No authentication.
- No real EHR integration.
- No live operational feeds.
- No autonomous AI actions.
- No clinical diagnosis or treatment recommendation.
- LocalStorage is suitable for MVP use but not enterprise-grade persistence.
- Operating recommendations are deterministic and simplified for portfolio demonstration.

---

## Repository Status

This is an MVP-stage product build.

The current priority is to improve:

- UI polish;
- screenshot coverage;
- README presentation;
- test coverage;
- accessibility;
- persistence robustness;
- sample data realism;
- Product Labs integration.

---

## License

Add a license before broader public use. MIT is a reasonable default for an open portfolio project unless you want stronger restrictions.
