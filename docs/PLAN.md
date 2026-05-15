# Divel Quiz App — Plan

## What We're Building
A web-based quiz platform. Admins upload question/answer files (PDF, CSV, DOCX), configure quiz rules (session size, pass threshold, stop behaviour, answer type), and publish quizzes. Anonymous users take any quiz any number of times with no account required.

## Delivery Strategy
All four doc stages approved before implementation. Implementation follows task dependency order (T1→T20). Each task maps to one logical commit. GitHub Actions deploys automatically on every push to `main`.

## Tech Stack
- Vanilla HTML / CSS / JavaScript (ES Modules, no build step)
- Firebase Firestore — quiz and question storage
- Firebase Storage — uploaded source files
- Firebase Authentication — admin login only
- Firebase Hosting — static file CDN
- GitHub Actions — CI/CD deploy on push to `main`
- PDF.js, mammoth.js, Papa Parse — client-side file parsing (CDN)

## Key Constraints
- No server / Cloud Functions — all logic runs client-side
- Anonymous users: no accounts, no result persistence
- One admin account created manually in Firebase Console
- Stop-on-outcome logic: stop early when pass guaranteed (correct ≥ threshold) OR fail guaranteed (incorrect > total − threshold)
- AC language rule: every Acceptance Criterion uses "shall" or "must" only

## Approval Gate Workflow
| Stage | Status |
|-------|--------|
| Stage 1 — REQUIREMENTS | Approved |
| Stage 2 — DESIGN | Approved |
| Stage 3 — SPECS | Approved |
| Stage 4 — TASKS | Approved |
| Stage 5 — PLAN + PROGRESS | In progress |
| Stage 6 — IMPLEMENTATION | Not started |

## Feature Set
1. Admin Authentication (Firebase Email/Password)
2. Quiz Creation — file upload, parsing, configuration
3. Quiz Library — public home page listing all quizzes
4. Quiz Taking — anonymous, random questions, stop-on-outcome or run-to-end
5. Quiz Editing — update any field or replace question file
6. US Civics Test — seed quiz, 128 questions, 20/session, 12=pass, stop-on-outcome

## Implementation Tasks Summary
| Task | Description | Status |
|------|-------------|--------|
| T1 | Rename branch master→main | [ ] |
| T2 | Create Firebase project (manual) | [ ] |
| T3 | Create GitHub repo + push | [ ] |
| T4 | firebase.json, firestore.rules, storage.rules | [ ] |
| T5 | .env.example + js/firebase.js | [ ] |
| T6 | css/styles.css | [ ] |
| T7 | .github/workflows/deploy.yml | [ ] |
| T8 | Verify first deployment | [ ] |
| T9 | js/quiz-engine.js | [ ] |
| T10 | js/file-parser.js | [ ] |
| T11 | js/auth-guard.js | [ ] |
| T12 | admin/login.html | [ ] |
| T13 | admin/index.html (Dashboard) | [ ] |
| T14 | admin/quiz-form.html (Create/Edit) | [ ] |
| T15 | index.html (Quiz Library) | [ ] |
| T16 | quiz.html (Quiz Taking) | [ ] |
| T17 | scripts/civics-seed.csv | [ ] |
| T18 | scripts/seed.js | [ ] |
| T19 | End-to-end verification | [ ] |
| T20 | Final docs + seed commit | [ ] |

## Immediate Next Actions
1. Write PLAN.md and progress.md (Stage 5) — IN PROGRESS
2. T1: Rename branch master → main
3. T2: User creates Firebase project in Firebase Console — will prompt for config values
4. T3: Fix gh CLI auth + create GitHub repo + push initial commit
5. T4–T8: Firebase config files, styles, GitHub Actions workflow, first deploy
