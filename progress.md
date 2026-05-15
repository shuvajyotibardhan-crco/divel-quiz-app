# Project State
- **Last Updated:** 2026-05-15
- **Current Branch:** master (to be renamed main — T1)
- **Current Task:** T1 — Rename branch, then T2 (Firebase project creation)

## Completed Actions
1. [x] Git repo confirmed initialised
2. [x] Created .gitignore
3. [x] Created CLAUDE.md
4. [x] Created docs/ directory
5. [x] Stage 1 — REQUIREMENTS.md approved
6. [x] Stage 2 — DESIGN.md + architecture.drawio approved
7. [x] Stage 3 — SPECS.md approved
8. [x] Stage 4 — TASKS.md approved
9. [x] Stage 5 — PLAN.md + progress.md written

## Current Logic Context
- All 4 doc stages approved — cleared for implementation
- Tech stack: Vanilla JS + Firebase (Firestore, Storage, Auth, Hosting)
- Stop-on-outcome: fail threshold = totalQuestions − passThreshold + 1 incorrect
- Seed quiz: US Civics Test — 128 questions pool, 20/session, 12=pass, stop-on-outcome
- gh CLI token is expired — need to re-auth or create GitHub repo manually (T3)
- Firebase project not yet created — user must do this in Firebase Console (T2)

## Next Immediate Step
- T1: Rename branch master → main (`git branch -m master main`)
- T2: User creates Firebase project → provides config values
- T3: Fix gh CLI auth → create GitHub repo → push
