import { describe, expect, it } from "vitest";
import { scorePriority } from "../logic/scorePriority";
import type { CaseRecord } from "../types/models";

const baseCase: CaseRecord = {
  id: "DCH-T",
  patientAlias: "Synthetic Test",
  ward: "Ward T",
  serviceLine: "Medicine",
  plannedDischargeDate: "2026-05-06",
  dischargeReadiness: "Blocked",
  blockerText: "Transport unavailable",
  owner: "Transport",
  blockerAgeHours: 20,
  slaHours: 10,
  bedType: "General",
  bedReleaseRisk: 80,
  escalationStatus: "Open",
  lastUpdated: "2026-05-06T10:00:00+08:00",
};

describe("scorePriority", () => {
  it("assigns high priority to aged SLA-breached blockers with bed risk", () => {
    const result = scorePriority(baseCase);
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(["High", "Critical"]).toContain(result.riskLevel);
  });

  it("keeps ready cases low risk", () => {
    const result = scorePriority({ ...baseCase, dischargeReadiness: "Ready", bedReleaseRisk: 20 });
    expect(result.riskLevel).toBe("Low");
  });
});
