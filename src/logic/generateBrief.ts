import type { CaseRecord, GovernanceEvent, HumanDecision, Recommendation } from "../types/models";
import { formatBlockerCategory } from "./display";
import { hasSlaBreach } from "./scorePriority";

function countBy<T extends string>(items: T[]): Record<T, number> {
  return items.reduce(
    (acc, item) => {
      acc[item] = (acc[item] ?? 0) + 1;
      return acc;
    },
    {} as Record<T, number>,
  );
}

export interface BriefInput {
  cases: CaseRecord[];
  recommendations: Recommendation[];
  decisions: HumanDecision[];
  governanceEvents: GovernanceEvent[];
}

export type BriefDuration = "Daily" | "Weekly" | "Monthly";
export type BriefDetailMode = "Executive" | "Detailed";

export interface BriefOptions {
  duration: BriefDuration;
  detailMode: BriefDetailMode;
}

const DEFAULT_BRIEF_OPTIONS: BriefOptions = {
  duration: "Weekly",
  detailMode: "Executive",
};

function durationFocus(duration: BriefDuration): string {
  if (duration === "Daily") {
    return "current-shift unblock actions, same-day SLA breaches, and immediate bed-release risk.";
  }
  if (duration === "Monthly") {
    return "recurring blocker patterns, department capacity signals, governance posture, and process improvement themes.";
  }
  return "operating status, leadership escalations, decisions made, and near-term risk mitigation.";
}

function filterByDuration(input: BriefInput, duration: BriefDuration): BriefInput {
  const allowedPeriods: BriefDuration[] =
    duration === "Daily" ? ["Daily"] : duration === "Weekly" ? ["Daily", "Weekly"] : ["Daily", "Weekly", "Monthly"];
  const cases = input.cases.filter((caseRecord) => allowedPeriods.includes(caseRecord.reportingPeriod ?? "Daily"));
  const caseIds = new Set(cases.map((caseRecord) => caseRecord.id));
  const recommendations = input.recommendations.filter((recommendation) => caseIds.has(recommendation.caseId));
  const decisions = input.decisions.filter((decision) => caseIds.has(decision.caseId));
  const governanceEvents = input.governanceEvents.filter(
    (event) => !event.caseId || caseIds.has(event.caseId) || event.type === "brief_generated" || event.type === "dataset_reset",
  );

  return { cases, recommendations, decisions, governanceEvents };
}

export function generateBrief(input: BriefInput, options: BriefOptions = DEFAULT_BRIEF_OPTIONS): string {
  const scopedInput = filterByDuration(input, options.duration);
  const blocked = scopedInput.cases.filter((caseRecord) => caseRecord.dischargeReadiness === "Blocked");
  const ready = scopedInput.cases.filter((caseRecord) => caseRecord.dischargeReadiness === "Ready");
  const slaBreaches = scopedInput.cases.filter(hasSlaBreach);
  const critical = scopedInput.recommendations.filter((rec) => rec.riskLevel === "Critical");
  const topBlockerCounts = countBy(
    scopedInput.recommendations
      .filter((rec) => rec.category !== "Unknown")
      .map((rec) => rec.category),
  );
  const topBlockers = Object.entries(topBlockerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const decisionsMade = scopedInput.decisions.slice(-8);
  const openLeadershipItems = scopedInput.recommendations
    .filter((rec) => rec.priorityScore >= 70 && rec.status !== "Resolved" && rec.status !== "Rejected")
    .sort((a, b) => b.priorityScore - a.priorityScore);
  const detailedEvidence =
    options.detailMode === "Detailed"
      ? `
## Detailed Evidence
${scopedInput.recommendations
  .slice()
  .sort((a, b) => b.priorityScore - a.priorityScore)
  .map((rec) => `- ${rec.caseId}: ${formatBlockerCategory(rec.category)}, ${rec.riskLevel} risk, score ${rec.priorityScore}, department ${rec.owner}, status ${rec.status}.`)
  .join("\n")}

## Governance Event Detail
${scopedInput.governanceEvents
  .slice(0, 12)
  .map((event) => `- ${event.summary} (${event.type}, ${new Date(event.timestamp).toLocaleString()})`)
  .join("\n")}
`
      : "";

  return `# STRATIS Healthcare Ops ${options.duration} ${options.detailMode} Operating Brief

## BLUF
${blocked.length} of ${scopedInput.cases.length} planned discharges remain blocked, with ${slaBreaches.length} SLA breaches and ${critical.length} critical-risk escalations. This ${options.duration.toLowerCase()} brief focuses on ${durationFocus(options.duration)}

## Current Operating Status
- Planned discharges: ${scopedInput.cases.length}
- Ready for discharge: ${ready.length}
- Blocked discharges: ${blocked.length}
- SLA breaches: ${slaBreaches.length}
- Open leadership attention items: ${openLeadershipItems.length}

## Top Blockers
${topBlockers.length > 0 ? topBlockers.map(([category, count]) => `- ${formatBlockerCategory(category as Recommendation["category"])}: ${count}`).join("\n") : "- No classified blockers."}

## Escalations Requiring Leadership Attention
${openLeadershipItems.length > 0 ? openLeadershipItems.map((rec) => `- ${rec.caseId}: ${rec.riskLevel} risk, score ${rec.priorityScore}, department ${rec.owner}, next step: ${rec.expectedNextStep}`).join("\n") : "- No priority escalations above threshold."}

## Decisions Made
${decisionsMade.length > 0 ? decisionsMade.map((decision) => `- ${decision.caseId}: ${decision.action} by ${decision.reviewer}. Rationale: ${decision.rationale}`).join("\n") : "- No human decisions recorded in the local workspace yet."}

## SLA Breaches
${slaBreaches.length > 0 ? slaBreaches.map((caseRecord) => `- ${caseRecord.id}: ${caseRecord.blockerAgeHours}h blocker age against ${caseRecord.slaHours}h SLA, department ${caseRecord.owner}.`).join("\n") : "- No SLA breaches."}

## Root Causes
- Primary root causes are inferred from blocker categories, not clinical information.
- Recurring non-clinical constraints include department handoff delay, external vendor dependency, and incomplete administrative closure.

## Risks And Mitigations
- Risk: blocked discharge delays bed release. Mitigation: escalate high-score cases to accountable operational departments.
- Risk: unsafe automation overreach. Mitigation: keep recommendations deterministic and require human rationale for override and escalation.
- Risk: governance gaps. Mitigation: preserve recommendation and decision events in browser-local audit logs.

## Next Actions
${options.duration === "Daily" ? "- Close all critical and high-risk cases before end of shift.\n- Confirm departments for every SLA breach.\n- Escalate unresolved bed-release risk before shift handover." : ""}
${options.duration === "Weekly" ? "- Review SLA breach departments for repeated process constraints.\n- Confirm closure plan for critical and high-risk cases.\n- Export and archive this brief with the governance log snapshot." : ""}
${options.duration === "Monthly" ? "- Identify recurring blocker categories for process redesign.\n- Review department-load concentration and escalation closure rate.\n- Convert repeated root causes into improvement backlog items." : ""}
${detailedEvidence}

## Governance Summary
- Governance events recorded: ${scopedInput.governanceEvents.length}
- Recommendation events: ${scopedInput.governanceEvents.filter((event) => event.type === "recommendation_created").length}
- Human decision events: ${scopedInput.governanceEvents.filter((event) => event.type === "human_decision" || event.type === "case_resolved").length}
- Data scope: synthetic discharge operations data only; no patient records, diagnosis, treatment, or medical advice.
`;
}
