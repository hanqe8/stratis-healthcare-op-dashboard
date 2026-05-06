import { SAMPLE_CASES } from "../data/sampleCases";
import { classifyCases } from "./classifyBlocker";
import { generateRecommendations } from "./generateRecommendation";
import { createRecommendationEvent, createSystemEvent } from "./governance";
import type { AppDataset } from "../types/models";

const STORAGE_KEY = "stratis-healthcare-ops-dataset-v4";

export function createInitialDataset(now = new Date().toISOString()): AppDataset {
  const cases = classifyCases(SAMPLE_CASES);
  const recommendations = generateRecommendations(cases, now).sort(
    (a, b) => b.priorityScore - a.priorityScore,
  );
  const governanceEvents = recommendations.map(createRecommendationEvent);

  return {
    cases,
    recommendations,
    decisions: [],
    governanceEvents,
  };
}

export function loadDataset(): AppDataset {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return createInitialDataset();
  }

  try {
    const parsed = JSON.parse(raw) as AppDataset;
    const hasReportingPeriods = parsed.cases.every((caseRecord) => caseRecord.reportingPeriod);
    if (!hasReportingPeriods || parsed.cases.length < SAMPLE_CASES.length) {
      return createInitialDataset();
    }
    return parsed;
  } catch {
    return createInitialDataset();
  }
}

export function saveDataset(dataset: AppDataset): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dataset));
}

export function resetDataset(): AppDataset {
  const dataset = createInitialDataset();
  dataset.governanceEvents.unshift(
    createSystemEvent("dataset_reset", "Workspace reset to built-in synthetic sample dataset."),
  );
  saveDataset(dataset);
  return dataset;
}
