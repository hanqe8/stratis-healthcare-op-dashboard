export type BlockerCategory =
  | "Medication"
  | "Documentation"
  | "Transport"
  | "Caregiver"
  | "Billing"
  | "AlliedHealth"
  | "Equipment"
  | "BedManagement"
  | "Unknown";

export type RiskLevel = "Low" | "Medium" | "High" | "Critical";

export type RecommendationStatus =
  | "Recommended"
  | "Accepted"
  | "Overridden"
  | "Escalated"
  | "Resolved"
  | "Rejected";

export type DecisionAction = "accept" | "override" | "escalate" | "resolve" | "reject";

export type GovernanceEventType =
  | "recommendation_created"
  | "human_decision"
  | "case_resolved"
  | "dataset_reset"
  | "brief_generated";

export interface CaseRecord {
  id: string;
  reportingPeriod?: "Daily" | "Weekly" | "Monthly";
  patientAlias: string;
  ward: string;
  serviceLine: string;
  plannedDischargeDate: string;
  dischargeReadiness: "Ready" | "Pending" | "Blocked";
  blockerText: string;
  blockerCategory?: BlockerCategory;
  owner: string;
  blockerAgeHours: number;
  slaHours: number;
  bedType: "General" | "StepDown" | "ICU" | "Isolation";
  bedReleaseRisk: number;
  escalationStatus: "None" | "Open" | "Closed";
  lastUpdated: string;
  outcome?: string;
}

export interface Recommendation {
  id: string;
  caseId: string;
  category: BlockerCategory;
  priorityScore: number;
  riskLevel: RiskLevel;
  recommendation: string;
  rationale: string[];
  owner: string;
  confidence: number;
  expectedNextStep: string;
  status: RecommendationStatus;
  createdAt: string;
}

export interface HumanDecision {
  id: string;
  caseId: string;
  recommendationId: string;
  action: DecisionAction;
  rationale: string;
  reviewer: string;
  createdAt: string;
}

export interface GovernanceEvent {
  id: string;
  timestamp: string;
  type: GovernanceEventType;
  actor: string;
  caseId?: string;
  recommendationId?: string;
  summary: string;
  details: Record<string, string | number | boolean | string[] | undefined>;
}

export interface KpiMetric {
  id: string;
  label: string;
  value: string | number;
  delta?: string;
  status: "Neutral" | "Good" | "Warning" | "Critical";
  description: string;
}

export interface AppDataset {
  cases: CaseRecord[];
  recommendations: Recommendation[];
  decisions: HumanDecision[];
  governanceEvents: GovernanceEvent[];
}
