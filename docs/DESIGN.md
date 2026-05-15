# Divel Quiz App — Design

## High-Level Overview
Divel Quiz App is a client-side web application backed entirely by Firebase. There is no custom server — all business logic runs in the browser, with Firestore as the persistent store, Firebase Storage holding uploaded source files, and Firebase Auth gating the admin portal. The deliberately thin stack (Vanilla JS, no framework, no build step) keeps deployment trivial: every push to `main` triggers a GitHub Actions workflow that deploys static files to Firebase Hosting.

## Architecture Diagram
![Architecture Diagram](architecture.drawio)

## Module Design

### `index.html` — Quiz Library (Home)
Loads all published quizzes from Firestore and renders quiz cards. Entry point for anonymous users. Links to `/quiz.html?id=<quizId>`.

### `quiz.html` — Quiz Taking Screen
Receives `?id=<quizId>` query param. Fetches quiz config and question pool from Firestore. Randomly selects N questions, renders them one at a time, enforces stop behaviour, and shows the result screen. Entirely client-side — no auth required.

### `admin/index.html` — Admin Dashboard
Protected page (redirects to `/admin/login.html` if unauthenticated). Lists all quizzes with Edit and Delete actions. Links to the Create/Edit form.

### `admin/login.html` — Admin Login
Email/password form wired to Firebase Auth `signInWithEmailAndPassword`. On success redirects to Admin Dashboard.

### `admin/quiz-form.html` — Create / Edit Quiz Form
Shared form used for both creating new quizzes and editing existing ones. Handles file upload to Firebase Storage, client-side file parsing (PDF.js for PDF, mammoth.js for DOCX, Papa Parse for CSV), and writing quiz + question documents to Firestore.

### `js/firebase.js` — Firebase Initialisation
Initialises the Firebase app with config from inline constants (set at deploy time via GitHub Actions substitution). Exports `db`, `auth`, and `storage` singletons used by all other modules.

### `js/quiz-engine.js` — Quiz Logic
Pure functions for: random question selection, answer validation (single and multi-select), stop-on-outcome evaluation (given correct count, incorrect count, threshold, total), and score calculation. No Firebase calls — fully testable in isolation.

### `js/file-parser.js` — File Parser
Accepts a `File` object, detects type (PDF / DOCX / CSV), delegates to the appropriate parser library, and returns a normalised `Question[]` array. Expected CSV format documented in SPECS.md.

### `js/auth-guard.js` — Admin Auth Guard
Runs on every admin page load. Calls `onAuthStateChanged`; if no user, redirects to `/admin/login.html`.

### `scripts/seed.js` — Civics Test Seeder (run once)
Node script that reads the CSV export of the Civics Test PDF, creates the seed quiz document in Firestore, and bulk-writes all 128 questions. Run manually once against the production Firestore project before public launch.

## Design Considerations

### Why Vanilla JS (no React/Vue)?
The quiz flow is a simple linear state machine (question → feedback → next/result). A framework would add build complexity (Vite/Webpack config, npm dependencies, CI build step) with no UX benefit for this scope. Vanilla JS with ES modules gives clean separation of concerns without that overhead.

### Why Firebase (not a custom API)?
Firebase gives auth, file storage, a real-time database, and CDN hosting in a single platform with a generous free tier — avoiding the need to provision and maintain any server. Firestore's document model maps naturally to `quiz → questions[]`.

### Why client-side file parsing?
Parsing PDFs/CSVs in the browser (PDF.js, Papa Parse, mammoth.js) eliminates the need for a Cloud Function or server endpoint for file ingestion. The parsed questions are written directly to Firestore from the admin's browser. The raw uploaded file is stored in Firebase Storage purely for audit purposes.

### Why is stop-on-outcome logic in `quiz-engine.js` (not Firestore)?
Firestore has no concept of quiz state across answers — it would require a server-side session. Running the logic client-side with the config fetched once at quiz start is simpler, faster, and free. The worst case for cheating (inspecting JS) is seeing questions early — there are no stakes that warrant server-side enforcement.

### Admin auth model
A single admin account is created manually in Firebase Console. There is no self-registration flow — this is a content-management tool, not a public auth system.

## Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | Vanilla HTML / CSS / JS (ES Modules) | No build step; simple deployment |
| Database | Firebase Firestore | Document model, real-time, free tier |
| File Storage | Firebase Storage | Stores raw uploaded quiz files |
| Authentication | Firebase Auth (Email/Password) | Admin-only login; no user accounts |
| Hosting | Firebase Hosting | CDN, HTTPS, integrates with GitHub Actions |
| CI/CD | GitHub Actions | Automated deploy on push to `main` |
| PDF Parsing | PDF.js (Mozilla) | Client-side PDF text extraction |
| DOCX Parsing | mammoth.js | Client-side DOCX → plain text |
| CSV Parsing | Papa Parse | Client-side CSV parsing |

## Deployment
All static files are deployed to Firebase Hosting via the `FirebaseExtended/action-hosting-deploy` GitHub Action. Pushing to `main` triggers the workflow automatically. Firebase config values are injected as GitHub Actions Secrets and substituted into `js/firebase.js` at deploy time. No manual `firebase deploy` commands are required.

## Constraints & Known Limitations

| Constraint | Detail |
|---|---|
| PDF parsing quality | PDF.js extracts raw text — questions must follow a consistent format in the PDF for the parser to work reliably. Badly formatted PDFs may need manual correction. |
| No result persistence | Anonymous users have no account; quiz results are shown on screen only and not stored. |
| Single admin account | No multi-admin or role management — one email/password account managed via Firebase Console. |
| Client-side stop logic | Determined by client JS; not server-enforced. Acceptable for low-stakes quizzes. |
| File size limit | Firebase Storage free tier and browser memory limit large file uploads to ~10 MB in practice. |
