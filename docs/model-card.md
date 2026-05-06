# Model Card

## System Type

Deterministic rules engine. No machine learning model is used in the MVP.

## Intended Use

Operational discharge workflow decision support using synthetic data.

## Out of Scope

- Clinical diagnosis.
- Treatment recommendation.
- Patient-specific medical advice.
- Real patient data processing.

## Inputs

Synthetic discharge case records containing ward, service line, readiness state, blocker text, owner, blocker age, SLA, bed type, and bed-release risk.

## Outputs

- Blocker category.
- Priority score.
- Risk level.
- Recommendation text.
- Rationale.
- Accountable owner.
- Expected next step.

## Priority Score

The score is deterministic and bounded from 0 to 100.

- Low: 0-44.
- Medium: 45-69.
- High: 70-84.
- Critical: 85-100.

The current scoring inputs are bed-release risk, SLA pressure, blocker age, open escalation state, and readiness state. The score is an operational triage heuristic, not a clinical risk score.

## Confidence

Confidence is deterministic and rule-based:

- 0.82 when blocker text matches a known blocker category.
- 0.58 when blocker text is Unknown or ambiguous.

This is not an ML probability. It is a simple transparency signal indicating how directly the rules engine matched the blocker text to a known operational category.

## Limitations

Rules are keyword and scoring based. They are explainable but can miss ambiguous blockers. Human review remains required.
