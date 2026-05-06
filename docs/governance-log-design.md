# Governance Log Design

## Purpose

The governance log provides an inspectable trail of system recommendations and human decisions.

## Event Types

- `recommendation_created`
- `human_decision`
- `case_resolved`
- `dataset_reset`
- `brief_generated`

## Fields

- Event ID
- Timestamp
- Actor
- Case ID
- Recommendation ID
- Summary
- Structured details

## Design Notes

The MVP log is browser-local and suitable for demonstration. Production use would require server-side immutable event storage, role-based access, retention policy, and export controls.

## Frontend Presentation

The frontend presents governance events as readable cards rather than raw JSON. Structured backend-safe payloads remain available in memory, while the UI formats category, risk, score, owner, confidence, action, rationale, and brief-generation metadata into field rows.

Governance Log filtering supports creation date, event type, blocker category, risk level, and case or actor search.

Active filters are displayed as removable chips. Users can remove a single criterion without clearing the whole filter state.

The Settings page includes local frontend taxonomy controls for Governance Log event types and categories. Duplicate checks ignore case and spaces.
