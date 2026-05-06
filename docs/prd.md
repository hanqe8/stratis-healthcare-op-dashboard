# STRATIS Healthcare Ops Command Centre PRD

## Problem Statement

Healthcare discharge operations are governed by fragmented non-clinical signals: medication readiness, documentation status, transport availability, caregiver coordination, billing clearance, allied health dependencies, equipment readiness, and bed-management constraints. A conventional dashboard can show that blockers exist, but it does not create a complete decision loop that classifies blockers, prioritises risk, recommends the next operational action, captures human judgement, and preserves an auditable record.

STRATIS Healthcare Ops needs to demonstrate a regulated-operations command centre that uses synthetic discharge workflow data only, avoids PHI and clinical advice, and shows how deterministic decision support can help operational leaders identify discharge blockers, review recommendations, resolve or escalate cases, and generate leadership-ready operating briefs.

## Solution

Build a static, browser-based STRATIS Healthcare Ops Command Centre that turns synthetic discharge workflow records into a governed operating decision loop:

Signal -> Blocker classification -> Risk and SLA prioritisation -> Recommendation -> Human decision -> Escalation or resolution -> Outcome -> Governance log -> Operating brief.

The product will provide an operations workbench with KPI cards, command centre views, escalation queues, human review controls, KPI tree drill-downs, governance log filtering, configurable frontend taxonomy, and daily, weekly, and monthly operating briefs. The MVP will remain backend-free and API-key-free, with browser-local persistence and deterministic rules.

The export workflow will support Markdown, DOCX, and client-side PDF export for operating briefs. PDF generation will remain bundled into the static app through client-side dependencies and lazy loading so export tooling is loaded only when required.

## User Stories

1. As an operations leader, I want to see planned discharges today, so that I can understand the expected discharge workload.
2. As an operations leader, I want to see ready-for-discharge cases, so that I can identify near-term bed release opportunities.
3. As an operations leader, I want to see blocked discharges, so that I can focus on cases requiring intervention.
4. As an operations leader, I want to see SLA breaches, so that I can identify discharge workflows outside agreed operating thresholds.
5. As an operations leader, I want to see average blocker age, so that I can detect whether blockers are accumulating.
6. As an operations leader, I want to see bed-release risk, so that I can understand the operational impact of unresolved blockers.
7. As an operations leader, I want to see escalation closure rate, so that I can assess whether interventions are being resolved.
8. As a discharge coordinator, I want blockers classified into operational categories, so that cases can be routed to the correct department.
9. As a discharge coordinator, I want frontend labels to use layperson-readable terms, so that operational users do not need to interpret backend-safe enum names.
10. As a discharge coordinator, I want Allied Health and Bed Management shown with spaces in the UI, so that category labels match normal operations language.
11. As a discharge coordinator, I want every case to show its recommendation, rationale, department, confidence, and expected next step, so that I can understand why the system is recommending action.
12. As a discharge coordinator, I want an escalation queue sorted by deterministic priority score, so that I can work on the most urgent cases first.
13. As a discharge coordinator, I want to filter the escalation queue, so that I can focus on relevant risk levels, departments, categories, or statuses.
14. As a discharge coordinator, I want to sort Command Centre table columns, so that I can inspect cases by risk, SLA, category, ward, readiness, or department.
15. As a discharge coordinator, I want risk and score presented compactly, so that the table remains usable on narrower screens.
16. As a human reviewer, I want to accept a recommendation, so that I can record agreement with the deterministic operating suggestion.
17. As a human reviewer, I want to override a recommendation with a required rationale, so that human judgement is preserved when the rules engine is insufficient.
18. As a human reviewer, I want to escalate a case with a required rationale, so that high-risk blockers receive accountable follow-up.
19. As a human reviewer, I want to resolve a case, so that the case status and governance trail reflect operational closure.
20. As a human reviewer, I want to reject a recommendation, so that unsuitable recommendations can be explicitly recorded.
21. As a human reviewer, I want reviewer and decision action labels to use consistent case capitalisation, so that the interface feels professional and clear.
22. As a human reviewer, I want to select the responsible department during review, so that ownership reflects the actual operational workflow.
23. As a governance reviewer, I want every recommendation event logged, so that the system preserves the basis for automated decision support.
24. As a governance reviewer, I want every human decision logged, so that the system records who acted, what they decided, and why.
25. As a governance reviewer, I want governance details displayed as readable cards rather than raw JSON, so that non-technical stakeholders can review the audit trail.
26. As a governance reviewer, I want to filter governance events by date, category, risk level, event type, and search text, so that audits can focus on specific questions.
27. As a governance reviewer, I want active governance filters displayed as removable chips, so that I can see and adjust the current filter state.
28. As a governance reviewer, I want confidence explanations available through an information icon, so that I can understand that confidence is deterministic and not a machine-learning probability.
29. As a governance reviewer, I want taxonomy changes recorded, so that additions and removals of categories and event types are auditable.
30. As an administrator, I want to add and remove governance event types, so that frontend filters can match local operating vocabulary.
31. As an administrator, I want to add and remove blocker categories, so that frontend configuration can adapt to portfolio needs.
32. As an administrator, I want duplicate taxonomy checks that ignore case and spacing, so that equivalent values cannot be added twice.
33. As an administrator, I want delete confirmation prompts for taxonomy items, so that accidental configuration changes are avoided.
34. As an administrator, I want taxonomy items arranged alphabetically, so that configuration remains easy to scan.
35. As an operations analyst, I want an interactive KPI tree, so that I can understand how blocker categories contribute to discharge cycle time.
36. As an operations analyst, I want Daily, Weekly, and Monthly cycle-time views, so that I can compare immediate issues with recurring operating patterns.
37. As an operations analyst, I want to click a blocker category in the cycle-time contribution chart, so that I can inspect contributing cases.
38. As an operations analyst, I want an explanation of contribution points, so that I can understand the synthetic operating-pressure formula.
39. As an operations analyst, I want department load to be interactive, so that I can inspect pending items owned by each department.
40. As an operations analyst, I want charts to remain legible in dark mode, so that operational dashboards are usable in either appearance setting.
41. As an operations analyst, I want chart spacing to be compact and responsive, so that chart containers do not waste space.
42. As an executive stakeholder, I want a daily operating brief, so that I can understand current-shift unblock actions and immediate SLA risk.
43. As an executive stakeholder, I want a weekly operating brief, so that I can understand recurring blockers, leadership escalations, and near-term mitigation actions.
44. As an executive stakeholder, I want a monthly operating brief, so that I can understand department-load patterns and process-improvement themes.
45. As an executive stakeholder, I want Executive and Detailed brief modes, so that the amount of evidence matches the audience.
46. As an executive stakeholder, I want formatted text and Markdown viewing modes, so that I can either read the brief in the app or inspect the source format.
47. As an executive stakeholder, I want Current Operating Status and Top Blockers presented visually, so that short sections do not waste report space.
48. As an executive stakeholder, I want leadership escalations, SLA breaches, risks, and mitigations formatted as readable blocks, so that critical actions are easy to scan.
49. As an executive stakeholder, I want to regenerate the operating brief, so that the brief reflects current local dataset, decisions, and governance events.
50. As an executive stakeholder, I want to export the operating brief as Markdown, so that it can be archived or edited in text-native workflows.
51. As an executive stakeholder, I want to export the operating brief as DOCX, so that it can be circulated in Word-based executive workflows.
52. As an executive stakeholder, I want to export the operating brief as PDF, so that it can be shared as a fixed-format report.
53. As an executive stakeholder, I want export filename editing before saving, so that report files can follow local naming conventions.
54. As an executive stakeholder, I want exported reports to include relevant graphs, so that the exported artifact preserves the visual evidence from the brief.
55. As a portfolio reviewer, I want the app header, palette, typography, and workbench layout to align with the STRATIS product family, so that the project reads as part of the same portfolio.
56. As a portfolio reviewer, I want a dark mode aligned with STRATIS conventions, so that the visual system feels complete and professional.
57. As a portfolio reviewer, I want the portfolio logo in the application header and favicon, so that the app has clear brand identity.
58. As a portfolio reviewer, I want navigation labels and icons to be polished, so that the application feels like a product rather than a prototype.
59. As a portfolio reviewer, I want the app to remain static-deployable, so that it can be hosted on GitHub Pages without backend infrastructure.
60. As a portfolio reviewer, I want clear guardrails stating synthetic data only, no PHI, no clinical advice, and no API key, so that the regulated-operations boundary is explicit.
61. As a developer, I want deterministic blocker classification isolated from UI code, so that category logic can be tested and changed safely.
62. As a developer, I want priority scoring isolated from UI code, so that risk calculations can be audited and unit tested.
63. As a developer, I want recommendation generation isolated from UI code, so that recommendations remain deterministic and explainable.
64. As a developer, I want brief generation isolated from UI code, so that daily, weekly, monthly, executive, and detailed outputs can be tested.
65. As a developer, I want export logic isolated from UI code, so that Markdown, DOCX, and PDF output can evolve without destabilising the workbench.
66. As a developer, I want browser-local storage isolated behind a storage module, so that persistence can later move to IndexedDB or a backend without rewriting the UI.
67. As a developer, I want CSV parsing and export isolated behind a CSV module, so that sample data workflows are testable.
68. As a developer, I want Recharts bundled separately from the main application chunk, so that charting libraries can be cached and main app load remains smaller.
69. As a developer, I want PDF libraries loaded only on demand, so that export-only dependencies do not inflate the initial application bundle.
70. As a developer, I want strict TypeScript models for cases, recommendations, decisions, governance events, and KPI metrics, so that domain contracts are explicit.

## Implementation Decisions

- Preserve the MVP as a static browser application with no backend, no API key, and no real patient data.
- Use synthetic discharge workflow records as the only data source.
- Use deterministic rules for blocker classification, risk scoring, recommendation generation, brief generation, and confidence explanation.
- Keep the frontend language user-friendly while preserving backend-safe model values internally.
- Treat departments as the user-facing ownership concept for blockers, recommendations, escalation queues, KPI tree linkage, and human review assignment.
- Maintain browser-local persistence for cases, recommendations, decisions, governance events, theme preference, taxonomy settings, and taxonomy change logs.
- Use structured domain models for case records, recommendations, human decisions, governance events, and KPI metrics.
- Keep blocker classification as a deep module with a simple interface from case text to blocker category.
- Keep priority scoring as a deep module with a simple interface from case record to score components, risk level, and SLA breach status.
- Keep recommendation generation as a deep module that combines classification, scoring, rationale, confidence, department ownership, and expected next step.
- Keep governance event creation as a deep module that converts recommendation and human-review actions into audit records.
- Keep operating brief generation as a deep module that accepts current dataset scope and brief options, then returns Markdown content.
- Keep export generation as a deep module that converts generated brief content and chart snapshots into Markdown, DOCX, and PDF artifacts.
- Keep CSV parsing and export as a dedicated module for future import workflows and current synthetic case export.
- Keep visual report charts in the operating brief so exported reports include relevant operating evidence.
- Use client-side DOCX generation to preserve static deployability.
- Use client-side PDF generation with lazy-loaded PDF dependencies to preserve static deployability and avoid loading PDF tooling until export is requested.
- Use browser save-file capabilities when available, with download fallback for browsers that do not support the picker API.
- Keep GitHub Pages deployment as the intended MVP deployment path.
- Keep STRATIS family branding as the visual convention: white/slate workbench surfaces, restrained blue/teal accents, structured dashboard layout, and auditability-first language.
- Keep settings organised by category, including appearance, taxonomy, governance, guardrails, and data controls.
- Keep taxonomy configuration frontend-local for MVP and do not rewrite historical governance records when taxonomy labels are removed.
- Keep PDF export trade-off explicit: client-side canvas-based PDF export is acceptable for MVP, but server-rendered report generation is a future enterprise capability if stronger pagination and archive control are required.

## Testing Decisions

- Tests should validate external behaviour and deterministic outputs rather than implementation details.
- Blocker classification tests should cover known keyword mappings, multi-word category display, and fallback to Unknown for ambiguous text.
- Priority scoring tests should cover SLA pressure, blocker age, bed-release risk, escalation state, minimum and maximum score behaviour, and risk-level thresholds.
- Recommendation generation tests should verify category, department, rationale, confidence, expected next step, recommendation status, and score propagation.
- Governance tests should verify recommendation event creation, human decision event creation, decision rationale capture, and relevant event details.
- Brief generation tests should verify required sections, duration scoping, executive versus detailed mode differences, governance summary, and synthetic-data guardrail language.
- Export tests should focus on generated artifact contracts: Markdown contains brief content and chart references, DOCX produces a valid document blob, and PDF export produces an application/pdf blob through the browser path.
- UI-level verification should cover navigation, dark mode, operating brief modal controls, governance filters, taxonomy deletion confirmation, command centre sorting/filtering, KPI tree drill-down, and department-load modal behaviour.
- Chart verification should include dark-mode tooltip contrast, axis-label legibility, responsive sizing, and chart data differentiation across Daily, Weekly, and Monthly views.
- Accessibility verification should include labelled buttons, modal semantics, keyboard-reachable controls, hover/click information icons, and readable contrast in light and dark mode.
- Regression checks should include build, unit tests, and targeted browser smoke tests for export workflows because client-side PDF and DOCX generation rely on browser APIs.

## Out of Scope

- Real patient data or PHI.
- Clinical diagnosis, treatment recommendations, medication advice, or patient-specific medical advice.
- Backend services, API keys, server-side persistence, authentication, role-based access control, or multi-user collaboration.
- Real EHR, bed-management, transport, pharmacy, billing, or hospital-system integrations.
- Machine-learning inference or AI-generated recommendations in the MVP.
- Server-rendered PDF generation or scheduled report delivery in the MVP.
- Immutable enterprise audit archive in the MVP.
- Email delivery or workflow-task assignment outside the browser-local app.
- Production compliance certification, security attestation, or deployment into a live healthcare environment.

## Further Notes

- The product intentionally demonstrates regulated operations judgement without crossing into clinical decision support.
- The deterministic confidence value is not a statistical probability. It is a rules-engine estimate based on whether a known blocker category was matched or the blocker remains Unknown or ambiguous.
- Contribution points in the KPI tree are synthetic operating-pressure units derived from blocker age, SLA breach penalty, bed-release risk, and selected reporting timeframe.
- Browser-local persistence is suitable for portfolio MVP demonstration but should be replaced by authenticated persistence before any real operational use.
- Client-side PDF export is acceptable for static MVP delivery but has formatting limits because it depends on browser rendering and canvas capture. A future enterprise roadmap item should consider a server-rendered export service with authenticated archive storage if report fidelity becomes a product requirement.
- The issue-tracker publishing target was not available in the current workspace because the folder is not a git repository and no matching installed GitHub repository was found through the connector.
