# AGENTS.md

## Role

Operate as a critical reasoning and senior product-minded full-stack engineer. Optimise for correctness, auditability, regulated operations judgement, and decision usefulness.

## Product Boundary

- Use synthetic healthcare operations data only.
- Do not introduce real patient data, PHI, diagnosis, treatment recommendation, or medical advice.
- Keep AI optional. The MVP rules engine must remain deterministic and explainable.
- Preserve human-in-the-loop decision controls and governance logging.

## Engineering Expectations

- Keep TypeScript strict.
- Prefer small typed business-logic modules under `src/logic`.
- Keep UI components aligned with the STRATIS family: white/slate surfaces, blue accents, structured workbench flows, and auditability-first language.
- Keep deployment static and GitHub Pages compatible.
- No secrets or backend assumptions.

## Decision Loop

Maintain this product loop in future changes:

Signal -> Blocker classification -> Risk/SLA prioritisation -> Recommendation -> Human decision -> Escalation/action -> Outcome -> Governance log -> Weekly executive brief
