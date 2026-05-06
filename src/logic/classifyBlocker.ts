import type { BlockerCategory, CaseRecord } from "../types/models";

const CATEGORY_TERMS: Record<BlockerCategory, string[]> = {
  Medication: ["medication", "meds", "pharmacy", "prescription", "reconciliation", "anticoagulant"],
  Documentation: ["documentation", "document", "summary", "letter", "consultant", "sign-off", "forms"],
  Transport: ["transport", "ambulance", "taxi", "vendor", "pickup", "collect"],
  Caregiver: ["caregiver", "family", "daughter", "son", "training", "home support"],
  Billing: ["billing", "finance", "insurer", "insurance", "authorisation", "authorization", "payment"],
  AlliedHealth: ["physio", "physiotherapy", "occupational", "speech", "allied", "therapy", "assessment"],
  Equipment: ["equipment", "oxygen", "wheelchair", "walker", "commode", "device", "delivery"],
  BedManagement: ["bed", "isolation", "cleaning", "room", "downstream", "capacity"],
  Unknown: [],
};

const CATEGORY_PRIORITY: BlockerCategory[] = [
  "Billing",
  "BedManagement",
  "AlliedHealth",
  "Equipment",
  "Caregiver",
  "Transport",
  "Documentation",
  "Medication",
];

export function classifyBlockerText(text: string): BlockerCategory {
  const normalized = text.toLowerCase();
  let bestCategory: BlockerCategory = "Unknown";
  let bestScore = 0;

  for (const category of CATEGORY_PRIORITY) {
    const score = CATEGORY_TERMS[category].reduce(
      (sum, term) => (normalized.includes(term) ? sum + 1 : sum),
      0,
    );

    if (score > bestScore) {
      bestCategory = category;
      bestScore = score;
    }
  }

  return bestCategory;
}

export function classifyCase(caseRecord: CaseRecord): CaseRecord {
  if (caseRecord.dischargeReadiness === "Ready") {
    return { ...caseRecord, blockerCategory: "Unknown" };
  }

  return {
    ...caseRecord,
    blockerCategory: classifyBlockerText(caseRecord.blockerText),
  };
}

export function classifyCases(cases: CaseRecord[]): CaseRecord[] {
  return cases.map(classifyCase);
}
