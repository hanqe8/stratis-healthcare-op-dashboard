import type {
  DecisionAction,
  GovernanceEvent,
  HumanDecision,
  Recommendation,
} from "../types/models";
import { formatBlockerCategory, formatDecisionAction } from "./display";

function eventId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createRecommendationEvent(recommendation: Recommendation): GovernanceEvent {
  return {
    id: eventId("GOV-REC"),
    timestamp: recommendation.createdAt,
    type: "recommendation_created",
    actor: "System rules engine",
    caseId: recommendation.caseId,
    recommendationId: recommendation.id,
    summary: `Recommendation generated for ${recommendation.caseId}`,
    details: {
      category: recommendation.category,
      categoryDisplay: formatBlockerCategory(recommendation.category),
      riskLevel: recommendation.riskLevel,
      priorityScore: recommendation.priorityScore,
      owner: recommendation.owner,
      confidence: recommendation.confidence,
      rationale: recommendation.rationale,
    },
  };
}

export function createHumanDecision(
  caseId: string,
  recommendationId: string,
  action: DecisionAction,
  rationale: string,
  reviewer: string,
  now = new Date().toISOString(),
): HumanDecision {
  return {
    id: eventId("DEC"),
    caseId,
    recommendationId,
    action,
    rationale,
    reviewer,
    createdAt: now,
  };
}

export function createDecisionEvent(decision: HumanDecision): GovernanceEvent {
  return {
    id: eventId("GOV-DEC"),
    timestamp: decision.createdAt,
    type: decision.action === "resolve" ? "case_resolved" : "human_decision",
    actor: decision.reviewer,
    caseId: decision.caseId,
    recommendationId: decision.recommendationId,
    summary: `${formatDecisionAction(decision.action)} recorded for ${decision.caseId}`,
    details: {
      action: decision.action,
      actionDisplay: formatDecisionAction(decision.action),
      rationale: decision.rationale,
    },
  };
}

export function createSystemEvent(
  type: GovernanceEvent["type"],
  summary: string,
  details: GovernanceEvent["details"] = {},
): GovernanceEvent {
  return {
    id: eventId("GOV-SYS"),
    timestamp: new Date().toISOString(),
    type,
    actor: "System",
    summary,
    details,
  };
}
