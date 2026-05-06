# Architecture

## Runtime

Static React application served by GitHub Pages.

## Modules

- `src/data/sampleCases.ts`: synthetic discharge workflow dataset.
- `src/types/models.ts`: typed domain models.
- `src/logic/classifyBlocker.ts`: deterministic blocker classification.
- `src/logic/scorePriority.ts`: deterministic priority and risk scoring.
- `src/logic/generateRecommendation.ts`: owner, rationale, confidence, and next-step generation.
- `src/logic/governance.ts`: recommendation and human decision event creation.
- `src/logic/generateBrief.ts`: executive brief generation.
- `src/logic/storage.ts`: browser-local persistence.
- `src/logic/csv.ts`: CSV parse/export utility using Papa Parse.

## Persistence

MVP persistence uses `localStorage`. This keeps the deployment static and inspectable. IndexedDB/Dexie is a future hardening option.

## Deployment

GitHub Actions builds and uploads `dist` to GitHub Pages.

## Bundle Strategy

Vite manual chunks separate charting dependencies into a `charts` bundle and React runtime into `react-vendor`. This avoids forcing Recharts into the main app chunk while preserving static deployment simplicity.
