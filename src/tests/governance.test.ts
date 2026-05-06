import { describe, expect, it } from "vitest";
import { createDecisionEvent, createHumanDecision, createRecommendationEvent } from "../logic/governance";
import type { Recommendation } from "../types/models";

const recommendation: Recommendation = {
  id: "REC-DCH-G",
  caseId: "DCH-G",
  category: "Transport",
  priorityScore: 76,
  riskLevel: "High",
  recommendation: "Escalate transport blocker.",
  rationale: ["SLA pressure"],
  owner: "Transport Coordinator",
  confidence: 0.82,
  expectedNextStep: "Secure transport slot.",
  status: "Recommended",
  createdAt: "2026-05-06T00:00:00.000Z",
};

describe("governance", () => {
  it("creates recommendation audit events", () => {
    const event = createRecommendationEvent(recommendation);
    expect(event.type).toBe("recommendation_created");
    expect(event.caseId).toBe("DCH-G");
    expect(event.details.priorityScore).toBe(76);
  });

  it("creates human decision and matching audit event", () => {
    const decision = createHumanDecision("DCH-G", "REC-DCH-G", "escalate", "Vendor delay.", "Ops Lead");
    const event = createDecisionEvent(decision);
    expect(event.type).toBe("human_decision");
    expect(event.details.action).toBe("escalate");
    expect(event.details.rationale).toBe("Vendor delay.");
  });
});
