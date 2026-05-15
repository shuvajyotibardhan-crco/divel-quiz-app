# Divel Quiz App — Requirements

## Overview
Divel Quiz App is a web-based quiz platform for administrators and anonymous end-users. Administrators upload question/answer source files, configure quiz rules, and publish quizzes. Any user can take a published quiz any number of times without creating an account.

## Scope

### In Scope
- Admin portal: upload, configure, publish, and edit quizzes
- File parsing: PDF, CSV, DOCX question/answer formats
- Quiz-taking: anonymous, unlimited attempts, configurable stop behaviour
- Stop-on-outcome mode and run-to-end mode
- Multiple answer type support: single-correct, multi-select, or mixed per quiz
- First quiz seeded from US Civics Test PDF (128 questions)
- Firebase Hosting deployment via GitHub Actions

### Out of Scope
- User accounts / result history persistence (no login for quiz-takers)
- Leaderboards or social features
- Payment or access gating
- Mobile-native apps (web only)

---

## Feature 1 — Admin Authentication

### User Story
As an administrator, I want to log in with an email and password so that only authorised users can create and edit quizzes.

### Acceptance Criteria
1. The login page shall display an email and password input and a "Log In" button.
2. The system shall authenticate admin credentials via Firebase Authentication.
3. On successful login, the admin shall be redirected to the Admin Dashboard.
4. On failed login, the system shall display an error message without revealing which field is wrong.
5. The admin session shall persist across page refreshes until the admin explicitly logs out.
6. The admin portal pages must not be accessible to unauthenticated users; any direct URL visit shall redirect to the login page.

### Test Plan
| Step | Expected Result |
|------|----------------|
| Navigate to `/admin` without logging in | Redirected to `/admin/login` |
| Enter invalid credentials and click Log In | Error message displayed; no redirect |
| Enter valid credentials and click Log In | Redirected to Admin Dashboard |
| Refresh page after login | Admin remains logged in |
| Click Log Out | Session cleared; redirected to login page |

---

## Feature 2 — Quiz Creation (Admin)

### User Story
As an administrator, I want to upload a question/answer file and configure quiz settings so that a new quiz is available for users to take.

### Acceptance Criteria
1. The Create Quiz form shall accept a quiz name (required, max 100 characters).
2. The form shall allow uploading a file in PDF, CSV, or DOCX format.
3. The system shall parse the uploaded file and extract questions with their answers.
4. The admin shall be able to set the answer type for the quiz: **single correct answer**, **multiple correct answers (select all)**, or **mixed** (each question declares its own type).
5. The admin shall set the total number of questions to present per quiz session (between 1 and the total questions parsed).
6. The admin shall set the pass threshold — the number of correct answers required to pass.
7. The admin shall choose the stop behaviour:
   - **Stop on outcome**: stop the quiz early once pass is guaranteed (correct count ≥ threshold) or fail is guaranteed (incorrect count > total\_questions − threshold); whichever is reached first.
   - **Run to end**: always present all configured questions; grade at the end.
8. The system shall preview the number of questions parsed before the admin saves the quiz.
9. On save, the quiz shall be stored in Firestore and marked as **published**.
10. The system must enforce that the pass threshold is less than or equal to the total questions per session.

### Test Plan
| Step | Expected Result |
|------|----------------|
| Upload a valid CSV file | Questions parsed and count shown in preview |
| Upload an unsupported file type | Error: "Unsupported file format" |
| Leave quiz name blank and submit | Validation error: name required |
| Set pass threshold > total questions and submit | Validation error |
| Complete form with valid data and save | Quiz saved; appears in quiz list |

---

## Feature 3 — Quiz Library (Admin & User)

### User Story
As a user, I want to see a list of all available quizzes so that I can choose one to take.

### Acceptance Criteria
1. The home page shall display a list of all published quizzes.
2. Each quiz card shall show the quiz name, total questions per session, and pass threshold.
3. The list shall be sorted alphabetically by quiz name by default.
4. Clicking a quiz card shall navigate the user to the quiz-taking screen for that quiz.
5. If no quizzes are published, the page shall display a "No quizzes available yet" message.

### Test Plan
| Step | Expected Result |
|------|----------------|
| Load home page with published quizzes | Quiz cards displayed, sorted A–Z |
| Load home page with no published quizzes | "No quizzes available yet" message shown |
| Click a quiz card | Navigated to quiz-taking screen |

---

## Feature 4 — Quiz Taking (Anonymous User)

### User Story
As an anonymous user, I want to take a quiz so that I can test my knowledge and see whether I pass or fail.

### Acceptance Criteria
1. On starting a quiz, the system shall randomly select the configured number of questions from the quiz's question pool.
2. Questions shall be presented one at a time.
3. For **single-correct** questions, the system shall render radio buttons (one answer selectable).
4. For **multi-select** questions, the system shall render checkboxes (one or more answers selectable).
5. The user shall not be able to advance without selecting at least one answer.
6. After submitting an answer, the system shall immediately show whether the answer was correct or incorrect, and reveal the correct answer(s).
7. A progress indicator shall show the current question number and total questions remaining.
8. **Stop-on-outcome mode:**
   - The quiz shall stop and show the result screen as soon as the user's correct count reaches the pass threshold (Pass), **or** the user's incorrect count exceeds (total\_questions − threshold) (Fail).
   - The result screen shall display the outcome (Pass/Fail), score so far, and a "Take Again" button.
9. **Run-to-end mode:**
   - All configured questions shall be presented regardless of intermediate score.
   - After the last question, the result screen shall show outcome (Pass/Fail), final score, and a "Take Again" button.
10. The user shall be able to retake the quiz unlimited times; each attempt generates a fresh random question set.
11. The system must not require the user to create an account or log in to take a quiz.

### Test Plan
| Step | Expected Result |
|------|----------------|
| Start a quiz | Configured N questions drawn randomly |
| Submit answer without selecting | Advance blocked; prompt to select |
| Submit correct answer | Correct/incorrect feedback shown with correct answer revealed |
| Reach pass threshold in stop-on-outcome mode | Quiz stops; "Passed" result shown |
| Accumulate enough incorrect answers in stop-on-outcome mode | Quiz stops; "Failed" result shown |
| Complete all questions in run-to-end mode with ≥ threshold correct | "Passed" shown at end |
| Complete all questions in run-to-end mode with < threshold correct | "Failed" shown at end |
| Click "Take Again" | New random question set; quiz restarts |

---

## Feature 5 — Quiz Editing (Admin)

### User Story
As an administrator, I want to edit an existing quiz so that I can correct mistakes, update questions, or change configuration.

### Acceptance Criteria
1. The Admin Dashboard shall list all quizzes with an "Edit" button per quiz.
2. Clicking "Edit" shall load the quiz's current settings and questions into the Create Quiz form.
3. The admin shall be able to update any field: name, answer type, total questions, pass threshold, stop behaviour, or replace the question file.
4. If a new file is uploaded during edit, the system shall re-parse and replace the existing question set.
5. On save, the updated quiz shall be persisted in Firestore immediately and reflected on the quiz library without a page reload.
6. The admin shall be able to delete a quiz; deleted quizzes shall be removed from the quiz library immediately.

### Test Plan
| Step | Expected Result |
|------|----------------|
| Click "Edit" on a quiz | Form populated with current quiz data |
| Change quiz name and save | Updated name shown in quiz library |
| Upload new file and save | New question set replaces old one |
| Delete a quiz | Quiz no longer shown in quiz library |

---

## Feature 6 — US Civics Test Seed Quiz

### User Story
As an administrator, I want the app to ship with a pre-loaded US Civics Test quiz so that users can try the app immediately after launch.

### Acceptance Criteria
1. The system must pre-load the US Civics Test as the first quiz on initial deployment.
2. The seed quiz shall contain all 128 questions from the source PDF.
3. The seed quiz shall be configured with: 20 questions per session, pass threshold of 12, stop-on-outcome mode.
4. The seed quiz shall use single-correct-answer type.
5. The seed quiz shall be editable by the admin like any other quiz.

### Test Plan
| Step | Expected Result |
|------|----------------|
| Open app after first deployment | "US Civics Test" quiz visible in quiz library |
| Start US Civics Test quiz | 20 random questions from 128-question pool presented |
| Answer 12 questions correctly before answering 9 incorrectly | Quiz stops; "Passed" shown |
| Answer 9 questions incorrectly before answering 12 correctly | Quiz stops; "Failed" shown |
