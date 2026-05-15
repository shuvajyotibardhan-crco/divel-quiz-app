# Divel Quiz App — Tasks

## Setup & Infrastructure

- [ ] **T1** — Rename git branch from `master` to `main`
- [ ] **T2** — Create Firebase project (Spark plan is fine — no Cloud Functions needed)
  - Enable Firestore, Storage, Authentication (Email/Password), Hosting
  - Create one admin user in Firebase Console (Authentication → Add user)
  - Copy Firebase config values
- [ ] **T3** — Create GitHub repository (`divel-quiz-app`) and push initial commit
  - Fix `gh` CLI auth or create repo manually via GitHub web
  - Add all Firebase config values as GitHub Actions Secrets
  - Add `FIREBASE_SERVICE_ACCOUNT` secret (Firebase Console → Project Settings → Service Accounts → Generate key)
- [ ] **T4** — Create `firebase.json`, `firestore.rules`, `storage.rules`
- [ ] **T5** — Create `.env.example` and `js/firebase.js` (config substitution placeholders)
- [ ] **T6** — Create `css/styles.css` (base styles, typography, card layout, responsive grid)
- [ ] **T7** — Create `.github/workflows/deploy.yml` (GitHub Actions: substitute Firebase config, deploy to Firebase Hosting)
- [ ] **T8** — Verify first deployment reaches Firebase Hosting (empty shell is fine)

---

## Core JS Modules

- [ ] **T9** — Implement `js/quiz-engine.js`
  - `selectQuestions(pool, n)` — Fisher-Yates shuffle, return first n
  - `isCorrect(question, selectedIds)` — single and multi validation
  - `evaluateOutcome(correct, incorrect, total, threshold)` — stop-on-outcome logic
  - `calculateScore(correct, total)` — final score string

- [ ] **T10** — Implement `js/file-parser.js`
  - CSV parsing via Papa Parse CDN
  - PDF text extraction via PDF.js CDN
  - DOCX extraction via mammoth.js CDN
  - Returns normalised `Question[]` array for all three formats
  - Invalid/unparseable rows logged and skipped

- [ ] **T11** — Implement `js/auth-guard.js`
  - `onAuthStateChanged` check on every admin page load
  - Redirect to `/admin/login.html` if no authenticated user

---

## Admin — Authentication

- [ ] **T12** — Build `admin/login.html`
  - Email + password form
  - `signInWithEmailAndPassword` on submit
  - Show generic error on failure (no field hint)
  - Redirect to `/admin/index.html` on success
  - If already logged in, redirect immediately

---

## Admin — Quiz Management

- [ ] **T13** — Build `admin/index.html` (Dashboard)
  - Auth guard (T11)
  - List all quizzes from Firestore (name, session size, pass threshold, question count)
  - "Create Quiz" button → `/admin/quiz-form.html`
  - "Edit" button per row → `/admin/quiz-form.html?id=<quizId>`
  - "Delete" button per row → confirm dialog → delete quiz + subcollection questions
  - Log Out button

- [ ] **T14** — Build `admin/quiz-form.html` (Create / Edit)
  - Auth guard (T11)
  - Fields: quiz name, answer type (single/multi/mixed), total questions, pass threshold, stop behaviour
  - File upload input (PDF / CSV / DOCX)
  - On file select: parse with `file-parser.js` (T10), show preview (question count, first 3 questions)
  - Validation: name required, passThreshold ≤ totalQuestions, file parsed successfully
  - On save (Create): upload file to Firebase Storage, batch-write questions to Firestore, create quiz doc
  - On save (Edit): if new file uploaded, delete old questions, re-upload and re-parse; update quiz doc
  - After save: redirect to Admin Dashboard

---

## Public — Quiz Library

- [ ] **T15** — Build `index.html` (Quiz Library)
  - Fetch all quizzes from Firestore
  - Render quiz cards (name, questions per session, pass threshold)
  - Sort A–Z by name
  - "No quizzes available yet" empty state
  - Each card links to `/quiz.html?id=<quizId>`

---

## Public — Quiz Taking

- [ ] **T16** — Build `quiz.html` (Quiz Taking)
  - Read `?id=` param; fetch quiz config + full question pool
  - Call `selectQuestions` (T9) to get random session set
  - Render one question at a time:
    - Radio buttons for `single`, checkboxes for `multi`
    - Mixed: per-question type drives the input type
  - "Submit Answer" button (disabled until selection made)
  - After submit: show correct/incorrect feedback + reveal correct answer(s)
  - "Next" button to advance
  - Progress bar / counter (e.g. "Question 3 of 20")
  - **Stop-on-outcome mode:** after each answer call `evaluateOutcome` (T9); if non-null, jump to result screen
  - **Run-to-end mode:** after last question, calculate score, show result screen
  - Result screen: Pass/Fail heading, score (X / N correct), "Take Again" button (reloads page)

---

## Seed Data

- [ ] **T17** — Convert Civics PDF to `scripts/civics-seed.csv`
  - Extract 128 questions from the PDF manually or via PDF.js script
  - Format per CSV spec in SPECS.md (columns: question, answer_a–d, correct, type)
  - All questions are single-answer type

- [ ] **T18** — Implement `scripts/seed.js` (Node script)
  - Read `scripts/civics-seed.csv` using Papa Parse
  - Initialise Firebase Admin SDK with service account
  - Create quiz doc: name="US Civics Test", totalQuestions=20, passThreshold=12, stopBehaviour="stop-on-outcome", answerType="single"
  - Batch-write all 128 questions to subcollection
  - Run once: `node scripts/seed.js`

---

## Final Checks

- [ ] **T19** — Deploy full app and verify end-to-end
  - Push to `main`, watch GitHub Actions run to completion
  - Verify quiz library loads with US Civics Test
  - Take quiz: confirm stop-on-outcome triggers correctly at 12 correct / 9 incorrect
  - Admin login, create a second test quiz (CSV upload), edit it, delete it
  - Confirm Firestore rules block unauthenticated writes

- [ ] **T20** — Commit all docs + seed files in single "docs + seed" commit, push, verify deploy passes

---

## Task Dependency Order

```
T1 → T3 (branch rename before push)
T2 → T3 (Firebase config needed for secrets)
T3 → T7 → T8 (repo → workflow → first deploy)
T4 → T8 (firebase.json needed for deploy)
T5 → T7 (firebase.js config substitution)
T6 → T15, T16 (styles needed for all pages)
T9 → T16 (quiz engine used by quiz taking)
T10 → T14 (file parser used by quiz form)
T11 → T12, T13, T14 (auth guard used by all admin pages)
T12 → T13 (login must work before dashboard)
T13 → T14 (dashboard links to form)
T14 → T15 (quizzes must exist before library is meaningful)
T15 → T16 (library links to quiz taking)
T17 → T18 (CSV must exist before seed script runs)
T18 → T19 (seed must run before end-to-end test)
T16 → T19 (quiz taking must be built before final test)
```
