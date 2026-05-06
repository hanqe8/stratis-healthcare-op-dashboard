import type {
  BlockerCategory,
  DecisionAction,
  GovernanceEventType,
  RecommendationStatus,
  RiskLevel,
} from "../types/models";

export const BLOCKER_CATEGORY_LABELS: Record<BlockerCategory, string> = {
  Medication: "Medication",
  Documentation: "Documentation",
  Transport: "Transport",
  Caregiver: "Caregiver",
  Billing: "Billing",
  AlliedHealth: "Allied Health",
  Equipment: "Equipment",
  BedManagement: "Bed Management",
  Unknown: "Unknown",
};

export const DECISION_ACTION_LABELS: Record<DecisionAction, string> = {
  accept: "Accept",
  override: "Override",
  escalate: "Escalate",
  resolve: "Resolve",
  reject: "Reject",
};

export const RECOMMENDATION_STATUS_LABELS: Record<RecommendationStatus, string> = {
  Recommended: "Recommended",
  Accepted: "Accepted",
  Overridden: "Overridden",
  Escalated: "Escalated",
  Resolved: "Resolved",
  Rejected: "Rejected",
};

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  Low: "Low",
  Medium: "Medium",
  High: "High",
  Critical: "Critical",
};

export const GOVERNANCE_EVENT_TYPE_LABELS: Record<GovernanceEventType, string> = {
  recommendation_created: "Recommendation Created",
  human_decision: "Human Decision",
  case_resolved: "Case Resolved",
  dataset_reset: "Dataset Reset",
  brief_generated: "Brief Generated",
};

export function formatBlockerCategory(category: BlockerCategory): string {
  return BLOCKER_CATEGORY_LABELS[category];
}

export function formatDecisionAction(action: DecisionAction): string {
  return DECISION_ACTION_LABELS[action];
}

export function formatRecommendationStatus(status: RecommendationStatus): string {
  return RECOMMENDATION_STATUS_LABELS[status];
}
