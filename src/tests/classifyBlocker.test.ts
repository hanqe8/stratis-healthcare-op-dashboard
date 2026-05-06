import { describe, expect, it } from "vitest";
import { classifyBlockerText } from "../logic/classifyBlocker";

describe("classifyBlockerText", () => {
  it("classifies pharmacy blockers as Medication", () => {
    expect(classifyBlockerText("Pharmacy reconciliation pending")).toBe("Medication");
  });

  it("classifies caregiver availability blockers", () => {
    expect(classifyBlockerText("Family caregiver training is not complete")).toBe("Caregiver");
  });

  it("returns Unknown when no deterministic signal exists", () => {
    expect(classifyBlockerText("Needs further coordinator review")).toBe("Unknown");
  });

  it("prefers the stronger operational blocker when text contains multiple category terms", () => {
    expect(classifyBlockerText("Billing pre-authorisation pending insurer response for discharge medication.")).toBe(
      "Billing",
    );
  });
});
