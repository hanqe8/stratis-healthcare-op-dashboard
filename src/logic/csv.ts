import Papa from "papaparse";
import type { CaseRecord } from "../types/models";

export function parseCaseCsv(csvText: string): Promise<CaseRecord[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<CaseRecord>(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (result) => {
        if (result.errors.length > 0) {
          reject(new Error(result.errors.map((error) => error.message).join("; ")));
          return;
        }
        resolve(result.data);
      },
      error: (error: Error) => reject(error),
    });
  });
}

export function casesToCsv(cases: CaseRecord[]): string {
  return Papa.unparse(cases);
}
