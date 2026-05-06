# Data Dictionary

## CaseRecord

- `id`: synthetic case identifier.
- `reportingPeriod`: Daily, Weekly, or Monthly synthetic reporting scope.
- `patientAlias`: non-identifying synthetic alias.
- `ward`: operational ward.
- `serviceLine`: service line.
- `plannedDischargeDate`: planned date.
- `dischargeReadiness`: Ready, Pending, or Blocked.
- `blockerText`: non-clinical operational blocker description.
- `blockerCategory`: deterministic blocker class.
- `owner`: current operational owner.
- `blockerAgeHours`: age of blocker.
- `slaHours`: target resolution SLA.
- `bedType`: operational bed type.
- `bedReleaseRisk`: 0-100 risk score.
- `escalationStatus`: None, Open, or Closed.
- `lastUpdated`: timestamp.
- `outcome`: optional closure note.

## Recommendation

Contains case link, category, priority score, risk level, recommendation, rationale, owner, confidence, expected next step, status, and created timestamp.

## HumanDecision

Contains decision action, rationale, reviewer, case link, recommendation link, and timestamp.

## GovernanceEvent

Contains event metadata and structured details for audit.
