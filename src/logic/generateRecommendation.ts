import { classifyCase } from "./classifyBlocker";
import { formatBlockerCategory } from "./display";
import { hasSlaBreach, scorePriority } from "./scorePriority";
import type { CaseRecord, Recommendation } from "../types/models";

const OWNER_BY_CATEGORY: Record<string, string> = {
  Medication: "Pharmacy Lead",
  Documentation: "Medical Team Lead",
  Transport: "Transport Coordinator",
  Caregiver: "Caregiver Liaison",
  Billing: "Finance Counsellor",
  AlliedHealth: "Allied Health Lead",
  Equipment: "Equipment Coordinator",
  BedManagement: "Bed Manager",
  Unknown: "Discharge Coordinator",
};

const NEXT_STEP_BY_CATEGORY: Record<string, string> = {
  Medication: "Confirm medication reconciliation and collection window.",
  Documentation: "Obtain discharge summary completion commitment from accountable clinician.",
  Transport: "Secure transport slot or approve alternative pathway.",
  Caregiver: "Confirm caregiver availability and complete discharge readiness handoff.",
  Billing: "Escalate payer or finance authorisation blocker with target response time.",
  AlliedHealth: "Book required therapy assessment and document clearance decision.",
  Equipment: "Confirm equipment delivery ETA and contingency supply route.",
  BedManagement: "Coordinate bed-release sequencing with bed management control.",
  Unknown: "Run coordinator review to classify blocker and assign accountable department.",
};

export function generateRecommendation(caseRecord: CaseRecord, now = new Date().toISOString()): Recommendation {
  const classifiedCase = classifyCase(caseRecord);
  const category = classifiedCase.blockerCategory ?? "Unknown";
  const priority = scorePriority(classifiedCase);
  const breach = hasSlaBreach(classifiedCase);
  const owner = OWNER_BY_CATEGORY[category] ?? classifiedCase.owner;
  const rationale = [
    ...priority.factors,
    `Blocker classified as ${formatBlockerCategory(category)}.`,
    breach ? "Case is in SLA breach." : "Case has not breached SLA.",
  ];

  return {
    id: `REC-${classifiedCase.id}`,
    caseId: classifiedCase.id,
    category,
    priorityScore: priority.score,
    riskLevel: priority.riskLevel,
    recommendation:
      priority.riskLevel === "Critical" || breach
        ? `Escalate to ${owner} for same-shift resolution.`
        : `Assign to ${owner} department for managed discharge unblock.`,
    rationale,
    owner,
    confidence: category === "Unknown" ? 0.58 : 0.82,
    expectedNextStep: NEXT_STEP_BY_CATEGORY[category] ?? NEXT_STEP_BY_CATEGORY.Unknown,
    status: "Recommended",
    createdAt: now,
  };
}

export function generateRecommendations(cases: CaseRecord[], now = new Date().toISOString()): Recommendation[] {
  return cases.map((caseRecord) => generateRecommendation(caseRecord, now));
}
