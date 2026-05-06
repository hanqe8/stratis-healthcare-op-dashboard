import type { CaseRecord, RiskLevel } from "../types/models";

export interface PriorityScore {
  score: number;
  riskLevel: RiskLevel;
  factors: string[];
}

export function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 85) {
    return "Critical";
  }
  if (score >= 70) {
    return "High";
  }
  if (score >= 45) {
    return "Medium";
  }
  return "Low";
}

export function scorePriority(caseRecord: CaseRecord): PriorityScore {
  if (caseRecord.dischargeReadiness === "Ready") {
    return {
      score: Math.max(5, Math.round(caseRecord.bedReleaseRisk * 0.15)),
      riskLevel: "Low",
      factors: ["Case is marked ready; priority is monitoring only."],
    };
  }

  const slaRatio = caseRecord.slaHours > 0 ? caseRecord.blockerAgeHours / caseRecord.slaHours : 1;
  const slaPressure = Math.min(35, Math.round(slaRatio * 25));
  const bedRisk = Math.round(caseRecord.bedReleaseRisk * 0.35);
  const blockerAge = Math.min(20, Math.round(caseRecord.blockerAgeHours * 0.8));
  const escalationLoad = caseRecord.escalationStatus === "Open" ? 10 : 0;
  const readinessPenalty = caseRecord.dischargeReadiness === "Blocked" ? 12 : 6;
  const score = Math.min(100, bedRisk + slaPressure + blockerAge + escalationLoad + readinessPenalty);

  const factors = [
    `Bed-release risk contributes ${bedRisk} points.`,
    `SLA pressure contributes ${slaPressure} points from ${caseRecord.blockerAgeHours}h age vs ${caseRecord.slaHours}h SLA.`,
    `Blocker age contributes ${blockerAge} points.`,
  ];

  if (escalationLoad > 0) {
    factors.push("Open escalation adds leadership attention pressure.");
  }

  return {
    score,
    riskLevel: riskLevelFromScore(score),
    factors,
  };
}

export function hasSlaBreach(caseRecord: CaseRecord): boolean {
  return caseRecord.dischargeReadiness !== "Ready" && caseRecord.blockerAgeHours > caseRecord.slaHours;
}
