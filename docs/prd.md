# Product Requirements Document: STRATIS Healthcare Ops Command Centre

## 1. Product summary

**STRATIS Healthcare Ops Command Centre** is a static, browser-based operations workbench for demonstrating how regulated healthcare operations can turn synthetic discharge workflow signals into a structured, reviewable, human-in-the-loop operating decision process.

The core workflow is:

> Signal → Blocker classification → Risk/SLA prioritisation → Recommendation → Human decision → Escalation/action → Outcome → Governance log → Operating brief

The MVP is designed as a portfolio-grade product artefact. It uses synthetic discharge workflow data only, deterministic rules, browser-local persistence, and static deployment. It does not process PHI, does not use real patient data, does not make clinical diagnoses or treatment recommendations, and does not require a backend or API key.

---

## 2. Problem statement

Healthcare discharge operations are governed by fragmented non-clinical signals: medication readiness, documentation status, transport availability, caregiver coordination, billing clearance, allied health dependencies, equipment readiness, and bed-management constraints.

A conventional dashboard can show that blockers exist, but it does not necessarily create a complete operating decision loop. Operational leaders need to know:

- which discharge cases are blocked;
- why they are blocked;
- which blockers create SLA or bed-release risk;
- who owns the next action;
- what recommendation was generated;
- what human decision was taken;
- whether the action was escalated, resolved, overridden, or rejected;
- how the operating state should be communicated to leadership.

Without a structured decision loop, operational metrics can remain passive, accountability can be unclear, and leadership reporting can become manually assembled after the fact.

---

## 3. Product objective

STRATIS Healthcare Ops Command Centre aims to demonstrate a regulated-operations decision-support workflow where users can:

1. Monitor synthetic discharge workflow status.
2. Classify operational blockers into readable categories.
3. Prioritise cases using deterministic risk and SLA scoring.
4. Review recommendations with rationale and expected next steps.
5. Accept, override, escalate, resolve, or reject recommendations.
6. Preserve recommendation and human decision events in a governance log.
7. Inspect KPI-tree contributors across Daily, Weekly, and Monthly views.
8. Generate leadership-ready operating briefs.
9. Export briefs and synthetic operational data.
10. Maintain explicit governance, privacy, and scope boundaries.

The governing product principle is:

> **Operational decision support, not clinical decision support.**

The app should make non-clinical operating decisions more structured and reviewable without implying clinical judgement, patient-specific advice, or production compliance readiness.

---

## 4. Target users

### 4.1 Primary users

| User | Core need |
|---|---|
| Operations leader | Understand operating pressure, blocked discharges, SLA breaches, and leadership attention items. |
| Discharge coordinator | Identify blocker category, accountable department, recommendation rationale, and next action. |
| Human reviewer | Record accountable decisions with rationale when accepting, overriding, escalating, resolving, or rejecting recommendations. |
| Governance reviewer | Inspect recommendation, decision, escalation, reset, taxonomy, and brief-generation events. |
| Executive stakeholder | Read concise Daily, Weekly, or Monthly operating briefs. |

### 4.2 Secondary users

| User | Core need |
|---|---|
| Product reviewer | Assess product thinking, domain scoping, workflow design, and implementation maturity. |
| Healthcare transformation lead | Understand how a command-centre workflow could structure non-clinical operational decisions. |
| Developer reviewer | Inspect deterministic logic separation, testing surface, static deployment design, and export approach. |

---

## 5. Scope

### 5.1 In scope for MVP

- Synthetic discharge workflow dataset.
- Overview dashboard with operating metrics.
- Readiness mix and blocker distribution charts.
- Command Centre operating table.
- Filtering by category, readiness, risk level, department, status, and/or case text where implemented.
- Deterministic blocker classification.
- Deterministic priority scoring.
- Risk-level and SLA-breach indicators.
- Recommendation generation with rationale, owner, confidence, and expected next step.
- Escalation Queue.
- Human Review workflow.
- Governance Log.
- KPI Tree with Daily, Weekly, and Monthly views.
- Configurable frontend taxonomy for event types and categories.
- Operating briefs in Executive and Detailed modes.
- Formatted text and Markdown brief views.
- Markdown, DOCX, and client-side PDF export paths where supported by the app.
- Synthetic case CSV export.
- Local browser persistence.
- Light and dark mode.
- GitHub Pages-compatible static deployment.

### 5.2 Out of scope for MVP

- Real patient data or PHI.
- Clinical diagnosis, treatment recommendations, medication advice, or patient-specific medical advice.
- Backend services, API keys, server-side persistence, authentication, role-based access control, or multi-user collaboration.
- Real EHR, bed-management, transport, pharmacy, billing, or hospital-system integrations.
- Machine-learning inference or autonomous AI-generated recommendations.
- Production compliance certification, security attestation, or deployment into a live healthcare environment.
- Server-rendered PDF generation or scheduled report delivery.
- Immutable enterprise audit archive.
- Email delivery or workflow-task assignment outside the browser-local app.

---

## 6. Product principles

### 6.1 Governance boundary first

Every major screen should make clear that the MVP uses synthetic data only and supports non-clinical operations decision support.

### 6.2 Deterministic and inspectable logic

Blocker classification, priority scoring, confidence explanation, recommendations, and operating briefs should be generated through deterministic logic that can be reviewed and tested.

### 6.3 Human judgement remains accountable

The system may propose actions, but human reviewers must decide whether to accept, override, escalate, resolve, or reject recommendations.

### 6.4 Decision events should be auditable

Recommendation generation, human decisions, escalations, resolutions, rejections, resets, taxonomy changes, and brief generation should produce readable governance records.

### 6.5 Static-first portfolio quality

The product should remain easy to run, inspect, test, and deploy as a static browser application.

---

## 7. Core workflow

1. App loads synthetic discharge workflow records.
2. User reviews operating metrics on the Overview dashboard.
3. App classifies blockers into operational categories.
4. App calculates priority scores and risk levels.
5. User filters and sorts the Command Centre table.
6. User reviews prioritised cases in the Escalation Queue.
7. User selects a recommendation in Human Review.
8. User accepts, overrides, escalates, resolves, or rejects the recommendation.
9. The app records a governance event.
10. User reviews KPI Tree contributors and department linkage.
11. User generates a Daily, Weekly, or Monthly operating brief.
12. User exports the brief or synthetic case data where needed.

---

## 8. Functional requirements

### 8.1 Overview dashboard

#### Requirements

- Show planned discharges, ready-for-discharge cases, blocked discharges, SLA breaches, average blocker age, bed-release risk, escalation closure, and operating risk distribution.
- Visualise blocker categories or operating signal patterns.
- Explain the operating decision loop.
- Use readable labels rather than backend-safe enum strings.

#### Acceptance criteria

- A reviewer can understand the operating state within 60 seconds.
- KPI cards are visible without requiring data upload.
- Charts remain legible in light and dark mode.
- Synthetic-data framing remains clear.

### 8.2 Command Centre

#### Requirements

- Display synthetic discharge cases in a filterable operating table.
- Include case, ward, readiness, category, blocker, department, SLA, risk, and score fields.
- Support filters for category, readiness, risk level, and department.
- Show adaptive risk indicators.
- Keep risk and score compact enough for narrower screens.

#### Acceptance criteria

- Users can identify blocked and SLA-breaching cases quickly.
- Risk badges are visually distinguishable.
- Filtering does not corrupt case state.
- Table content remains readable on desktop and usable with horizontal overflow on smaller screens.

### 8.3 Deterministic blocker classification

#### Requirements

- Classify blockers into Medication, Documentation, Transport, Caregiver, Billing, Allied Health, Equipment, Bed Management, or Unknown.
- Keep classification logic isolated from UI code.
- Use readable frontend labels.
- Provide Unknown fallback for ambiguous blocker text.

#### Acceptance criteria

- Known keyword mappings produce expected categories.
- Multi-word categories display correctly.
- Unknown or ambiguous cases do not receive false precision.
- Tests cover known mappings and fallback behaviour.

### 8.4 Priority scoring and risk levels

#### Requirements

- Score cases using deterministic inputs such as bed-release risk, SLA pressure, blocker age, escalation state, and readiness state.
- Assign risk levels such as Low, Medium, High, or Critical.
- Explain score methodology to users.
- Keep risk scoring isolated from UI code.

#### Acceptance criteria

- Score range and risk bands are visible where recommendations are reviewed.
- SLA breaches and critical-risk cases are clearly identified.
- Tests cover score thresholds, minimum/maximum bounds, SLA pressure, blocker age, and escalation state.

### 8.5 Recommendation generation

#### Requirements

- Generate operational recommendations with recommended action, rationale, accountable department, confidence, expected next step, risk, and SLA context.
- Keep recommendation generation deterministic and explainable.
- Avoid clinical advice or treatment recommendations.

#### Acceptance criteria

- Each recommendation can be traced to blocker category and priority-scoring logic.
- Recommendations stay within non-clinical operational scope.
- Confidence values are explained as deterministic rule estimates, not statistical probabilities.

### 8.6 Escalation Queue

#### Requirements

- Show prioritised recommendations sorted by operational urgency.
- Display case ID, risk score, recommendation status, blocker category, accountable department, confidence, rationale, and expected next step.
- Provide queue filters where implemented.

#### Acceptance criteria

- Critical-risk items are visible near the top of the queue.
- Users can see why a case is prioritised.
- Expected next steps are visible without opening raw data.

### 8.7 Human Review

#### Requirements

- Let users select recommendation, decision action, reviewer, and accountable department.
- Supported actions: Accept, Override, Escalate, Resolve, Reject.
- Require rationale for override and escalation decisions.
- Record human decisions as governance events.

#### Acceptance criteria

- Accept, override, escalate, resolve, and reject actions produce expected state changes.
- Override and escalation cannot be recorded without rationale.
- Human decision events preserve reviewer, action, rationale, accountable department, and timestamp.

### 8.8 Governance Log

#### Requirements

- Record recommendation, human decision, override, escalation, resolution, rejection, reset, taxonomy, and brief-generation events where applicable.
- Display events as readable cards rather than raw JSON.
- Support filtering by date, category, risk level, event type, and search text where implemented.
- Show active filters as removable chips.

#### Acceptance criteria

- Every material recommendation or human-review action creates a governance event.
- Users can filter and inspect governance events without seeing raw JSON.
- Taxonomy changes are recorded without rewriting historical event records.

### 8.9 KPI Tree

#### Requirements

- Link discharge cycle-time pressure to blocker categories, accountable departments, SLA breaches, bed-release risk, and contributing case patterns.
- Support Daily, Weekly, and Monthly views.
- Let users inspect contributing cases or department linkage where implemented.
- Explain contribution points as synthetic operating-pressure units.

#### Acceptance criteria

- KPI tree charts differ by reporting period where data supports it.
- Department linkage is visible.
- Users can understand that contribution points are synthetic and not clinical metrics.

### 8.10 Operating Briefs

#### Requirements

- Generate Daily, Weekly, and Monthly operating briefs.
- Support Executive and Detailed modes.
- Support formatted text and Markdown viewing modes.
- Include current operating status, blockers, leadership escalations, SLA breaches, risks, mitigations, and governance summary where relevant.
- Include visual report charts where supported.
- Support export to Markdown, DOCX, and client-side PDF where implemented.

#### Acceptance criteria

- Briefs reflect current local dataset, decisions, and governance events.
- Executive mode is concise and leadership-ready.
- Detailed mode exposes more operational and governance detail.
- Exported artifacts preserve core brief content.

### 8.11 Taxonomy and settings

#### Requirements

- Allow frontend configuration of governance event types and categories.
- Prevent duplicate taxonomy entries by normalising case and spacing.
- Confirm destructive taxonomy deletion.
- Persist appearance and taxonomy settings locally.

#### Acceptance criteria

- Equivalent taxonomy labels cannot be added twice.
- Deleted taxonomy labels do not rewrite historical governance records.
- Settings remain organised by user-relevant categories.

### 8.12 Data export and persistence

#### Requirements

- Persist local app state in the browser.
- Export synthetic cases as CSV.
- Support browser save-file capabilities when available, with fallback downloads.

#### Acceptance criteria

- Refreshing the browser does not remove current local state.
- CSV export contains expected synthetic case fields.
- Export actions do not require backend services.

---

## 9. Non-functional requirements

### 9.1 Deployment

- The app must remain deployable as a static site.
- Core functionality must not require a backend server.
- GitHub Pages should remain the intended public deployment path.

### 9.2 Security and privacy

- No real patient data or PHI should be committed, uploaded, pasted, or included in the demo.
- No API keys or credentials should be required for MVP functionality.
- Browser-local persistence should be treated as MVP-grade only.
- Public demo copy should warn users not to enter confidential or proprietary data.

### 9.3 Accessibility

- Use readable typography, sufficient contrast, semantic labels, keyboard-reachable controls, visible focus states, and usable modal semantics.
- Charts and tables should remain legible in light and dark modes.

### 9.4 Performance

- Dashboard, charts, and tables should remain responsive with the built-in synthetic dataset.
- Export-only dependencies should avoid inflating the main app path where practical.
- Chart-heavy views should remain usable on standard laptop viewports.

### 9.5 Maintainability

- Domain logic should remain isolated from UI components.
- TypeScript models should define case records, recommendations, decisions, governance events, and KPI metrics.
- Tests should focus on externally visible deterministic outputs.

---

## 10. Implementation decisions

- Use React, Vite, TypeScript, and Tailwind CSS.
- Use synthetic discharge workflow records as the only default data source.
- Use deterministic rules for blocker classification, risk scoring, recommendation generation, brief generation, and confidence explanation.
- Keep departments as the user-facing ownership concept.
- Maintain browser-local persistence for cases, recommendations, decisions, governance events, theme preference, taxonomy settings, and taxonomy change logs.
- Keep classification, priority scoring, recommendation generation, governance event creation, brief generation, export generation, and CSV logic in dedicated modules.
- Use Recharts for dashboard and brief charts.
- Use Papa Parse for CSV workflows.
- Use client-side DOCX and PDF generation to preserve static deployability.
- Keep client-side PDF export trade-offs explicit.
- Use STRATIS visual conventions: white/slate workbench surfaces, restrained teal accents, structured dashboard layout, and auditability-first language.

---

## 11. Testing strategy

### 11.1 Testing principles

- Test externally visible behaviour and deterministic outputs, not implementation details.
- Prioritise logic that affects risk, recommendation, governance, and export outputs.
- Include regression checks for build, unit tests, and export workflows.

### 11.2 Required test coverage

| Test area | Required coverage |
|---|---|
| Blocker classification | Known keyword mappings, multi-word labels, Unknown fallback |
| Priority scoring | SLA pressure, blocker age, bed-release risk, escalation state, min/max score, risk thresholds |
| Recommendation generation | Category, department, rationale, confidence, expected next step, status, score propagation |
| Human review | Accept, override, escalate, resolve, reject, rationale requirement |
| Governance log | Recommendation events, human decision events, taxonomy events, readable details |
| KPI tree | Daily/Weekly/Monthly views, department linkage, contribution data |
| Brief generation | Required sections, Executive vs Detailed modes, governance summary, guardrail language |
| Export | Markdown content, DOCX blob, PDF blob, chart references where supported |
| UI workflows | Navigation, filters, sorting, dark mode, modal controls, active filter chips |
| Accessibility | Labels, keyboard reachability, focus states, contrast, modal semantics |

---

## 12. Success metrics

### 12.1 Product success metrics

| Metric | Target |
|---|---|
| Time to understand operating state | Under 60 seconds from Overview screen |
| Time to identify top escalation | Under 60 seconds from Escalation Queue |
| Recommendation traceability | Each recommendation shows category, score rationale, owner, confidence, and next step |
| Human review completeness | Material decisions preserve action, reviewer, rationale where required, department, and timestamp |
| Brief generation utility | Executive brief can be generated and understood without reading raw case data |
| Governance readability | Events are readable by non-technical reviewers without raw JSON inspection |

### 12.2 Portfolio success metrics

| Metric | Target |
|---|---|
| Repository clarity | Reviewer understands purpose and boundaries within 3 minutes |
| Product credibility | README includes hero, screenshots, workflow, scope, guardrails, and walkthrough |
| Technical credibility | Scripts, stack, deterministic logic, and test coverage are visible |
| Healthcare boundary clarity | No implication of clinical AI, PHI processing, or production compliance readiness |

---

## 13. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Product is mistaken for clinical decision support | Regulatory and trust risk | Keep guardrails explicit across README, PRD, UI, and model documentation |
| Deterministic confidence is misread as statistical probability | Misinterpretation of recommendation strength | Label confidence as rule-based and explain score methodology |
| LocalStorage is interpreted as enterprise-grade persistence | Overstated implementation maturity | State that browser-local persistence is MVP-grade only |
| Client-side PDF export creates inconsistent formatting | Poor executive artifact quality | Treat as MVP export; roadmap server-rendered reports for enterprise use |
| Synthetic data appears unrealistic | Weak portfolio signal | Improve sample scenarios, edge cases, and cross-department patterns |
| Governance log becomes passive rather than operationally useful | Weak decision-loop credibility | Link every material action to an event and ensure filters are useful |
| README overclaims AI capability | Credibility risk | Position MVP as deterministic command centre, not autonomous AI |

---

## 14. Roadmap

### v0.1 — Core command-centre MVP

- [x] Synthetic discharge workflow dataset
- [x] Overview dashboard
- [x] Command Centre table
- [x] Deterministic blocker classification
- [x] Priority scoring
- [x] Recommendation generation
- [x] Escalation Queue
- [x] Human Review
- [x] Governance Log
- [x] KPI Tree
- [x] Operating brief generation
- [x] Local persistence
- [x] CSV export

### v0.2 — Portfolio polish and export hardening

- [x] README screenshots
- [x] README hero collage
- [ ] Export smoke-test coverage
- [ ] Accessibility pass
- [ ] Better sample-data realism
- [ ] More complete Product Labs case study

### v0.3 — Data and governance hardening

- [ ] CSV import UI and schema validation
- [ ] Governance export bundle
- [ ] IndexedDB persistence
- [ ] Richer scenario filters
- [ ] Stronger taxonomy management

### v0.4 — Enterprise concept exploration

- [ ] Optional authenticated backend concept
- [ ] Role-based review workflow concept
- [ ] Server-rendered report generation concept
- [ ] Immutable audit archive concept
- [ ] Non-confidential integration mock adapters

---

## 15. Open questions

1. Should CSV import be added before IndexedDB persistence, or should persistence hardening come first?
2. Should the governance log remain local-only, or should future versions explore an authenticated audit archive?
3. Should brief generation remain deterministic, or should optional AI narrative be introduced with human review and deterministic fallback?
4. Should risk scoring include no-go thresholds or escalation triggers beyond weighted scoring?
5. Should the product include role-specific views for discharge coordinators, operations leaders, and executives?
6. Should screenshot/demo polish remain README-focused, or be expanded into a Product Labs case-study page?

---

## 16. Final product positioning

STRATIS Healthcare Ops Command Centre should remain a regulated-operations decision-support demonstration, not a clinical AI product and not a production hospital integration.

Its differentiating value is the complete operating loop:

> Classify blockers, prioritise risk, recommend action, preserve human judgement, record governance events, and convert operating state into leadership-ready briefs.
