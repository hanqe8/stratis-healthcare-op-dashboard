import { describe, expect, it } from "vitest";
import { SAMPLE_CASES } from "../data/sampleCases";
import { classifyCases } from "../logic/classifyBlocker";
import { generateBrief } from "../logic/generateBrief";
import { generateRecommendations } from "../logic/generateRecommendation";

describe("generateBrief", () => {
  it("produces an executive brief with required sections", () => {
    const cases = classifyCases(SAMPLE_CASES);
    const recommendations = generateRecommendations(cases, "2026-05-06T00:00:00.000Z");
    const brief = generateBrief({
      cases,
      recommendations,
      decisions: [],
      governanceEvents: [],
    });

    expect(brief).toContain("## BLUF");
    expect(brief).toContain("## Current Operating Status");
    expect(brief).toContain("## Governance Summary");
    expect(brief).toContain("synthetic discharge operations data only");
  });
});
