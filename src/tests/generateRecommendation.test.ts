import { describe, expect, it } from "vitest";
import { generateRecommendation } from "../logic/generateRecommendation";
import type { CaseRecord } from "../types/models";

const caseRecord: CaseRecord = {
  id: "DCH-R",
  patientAlias: "Synthetic R",
  ward: "Ward R",
  serviceLine: "Surgery",
  plannedDischargeDate: "2026-05-06",
  dischargeReadiness: "Blocked",
  blockerText: "Discharge summary awaiting consultant documentation.",
  owner: "Medical Team",
  blockerAgeHours: 12,
  slaHours: 8,
  bedType: "StepDown",
  bedReleaseRisk: 70,
  escalationStatus: "None",
  lastUpdated: "2026-05-06T10:00:00+08:00",
};

describe("generateRecommendation", () => {
  it("generates owner, rationale, confidence, and next step", () => {
    const recommendation = generateRecommendation(caseRecord, "2026-05-06T00:00:00.000Z");
    expect(recommendation.category).toBe("Documentation");
    expect(recommendation.owner).toBe("Medical Team Lead");
    expect(recommendation.rationale.length).toBeGreaterThan(2);
    expect(recommendation.confidence).toBeGreaterThan(0.7);
    expect(recommendation.expectedNextStep).toContain("discharge summary");
  });
});
