# Divel Quiz App — CLAUDE.md

## What This Project Is
A web-based quiz platform. Admins upload question/answer files (PDF, CSV, DOCX), configure quiz rules, and publish quizzes. Anonymous users can take any published quiz any number of times.

## Tech Stack
- **Frontend:** Vanilla HTML / CSS / JavaScript (no build step)
- **Database:** Firebase Firestore (quizzes, questions, results)
- **File Storage:** Firebase Storage (uploaded source files)
- **Auth:** Firebase Authentication (admin login only; users are anonymous)
- **Hosting:** Firebase Hosting
- **CI/CD:** GitHub Actions → Firebase Hosting deploy on push to `main`

## Architecture Decisions
- No framework — keeps it simple and deployable to Firebase Hosting with zero build config
- Firestore stores parsed questions so the uploaded file is only needed at import time
- Admin auth via Firebase Email/Password; quiz-takers require no account
- Stop-on-outcome logic runs client-side — Firestore holds the config, browser enforces it

## Key Rules & Gotchas
- All Acceptance Criteria must use **"shall"** (expected behaviour) or **"must"** (mandatory constraint). No other modal verbs.
- Never commit `.env` — use `.env.example` with placeholders
- GitHub Actions deploys on every push to `main` — never run `firebase deploy` manually
- Refer to `/Users/shuvajyotibardhan/Projects/.claude_rules.md` for Token Savings, Documentation, AC Language, and progress.md template rules

## Global Rules Reference
See `/Users/shuvajyotibardhan/Projects/.claude_rules.md` for:
- **Token Savings Rules** — diff only, no full rewrites, check progress.md first
- **Documentation Rules** — REQUIREMENTS → DESIGN → SPECS → TASKS, each approved before code
- **AC Language Rule** — "shall" or "must" only in every Acceptance Criterion, no exceptions
- **Feature Delivery Workflow** — Stages 1–4 approved before any implementation

## GitHub Repo
TBD — to be created and linked here once gh CLI auth is resolved.

## Firebase Project
TBD — to be created as part of Stage 6 setup.

## Env Variables
See `.env.example` (to be created). Variables include Firebase config keys.

## Seed Data
`2025-Civics-Test-128-Questions-and-Answers.pdf` in project root — seeded as "US Civics Test" quiz (20 questions per session, 12 correct = pass, stop-on-outcome mode).
