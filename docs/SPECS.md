# Divel Quiz App — Technical Specs

## Data Models

### Quiz
```js
{
  id: string,            // Firestore auto-ID
  name: string,          // Display name, max 100 chars
  answerType: "single" | "multi" | "mixed",
  totalQuestions: number, // Questions shown per session (≤ question pool size)
  passThreshold: number,  // Correct answers required to pass (≤ totalQuestions)
  stopBehaviour: "stop-on-outcome" | "run-to-end",
  questionCount: number,  // Total questions in pool (set on save)
  sourceFileUrl: string,  // Firebase Storage download URL of uploaded file
  sourceFileName: string, // Original filename
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Question
```js
{
  id: string,            // Firestore auto-ID
  quizId: string,        // Parent quiz ID (also stored as subcollection path)
  text: string,          // Full question text
  answers: Answer[],     // All possible answer options
  correctIds: string[],  // IDs of correct Answer entries (1+ for multi, exactly 1 for single)
  type: "single" | "multi"  // Per-question type (used when quiz.answerType = "mixed")
}
```

### Answer
```js
{
  id: string,   // Short unique ID within the question (e.g. "a", "b", "c", "d")
  text: string  // Answer option text
}
```

### QuizSession (client-side only — never persisted)
```js
{
  quizId: string,
  questions: Question[],  // Randomly selected subset
  currentIndex: number,
  correctCount: number,
  incorrectCount: number,
  complete: boolean,
  outcome: "pass" | "fail" | null
}
```

---

## Storage Schema

### Firestore Collections

```
/quizzes/{quizId}                   — Quiz document
/quizzes/{quizId}/questions/{qId}   — Question subcollection
```

### Firebase Storage

```
/uploads/{quizId}/{filename}   — Original uploaded file (PDF / DOCX / CSV)
```

---

## Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Anyone can read published quizzes and their questions
    match /quizzes/{quizId} {
      allow read: if true;
      allow write: if request.auth != null;

      match /questions/{questionId} {
        allow read: if true;
        allow write: if request.auth != null;
      }
    }
  }
}
```

### Firebase Storage Rules

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /uploads/{quizId}/{filename} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

## File Upload Format

### CSV (primary / recommended format)
Each row represents one question. Columns:

| Column | Required | Description |
|--------|----------|-------------|
| `question` | Yes | Full question text |
| `answer_a` | Yes | First answer option |
| `answer_b` | Yes | Second answer option |
| `answer_c` | No | Third answer option |
| `answer_d` | No | Fourth answer option |
| `correct` | Yes | Comma-separated correct option letters, e.g. `a` or `a,c` |
| `type` | No | `single` or `multi` — defaults to `single` if `correct` has one value |

Example row:
```
"What is the supreme law of the land?","The Constitution","The Bill of Rights","The Declaration of Independence","Federal law","a","single"
```

### PDF
- Text extracted via PDF.js
- Parser looks for numbered question patterns: `1.` or `1)` followed by question text
- Answers detected as lines starting with `A.` `B.` `C.` `D.` (case-insensitive)
- Correct answer detected as a line starting with `Answer:` or `Correct:`
- Questions that cannot be parsed are skipped and flagged in the import preview

### DOCX
- Text extracted via mammoth.js
- Same pattern matching as PDF after text extraction

---

## Algorithms

### Random Question Selection
```
function selectQuestions(pool: Question[], n: number): Question[]
  shuffled = fisher-yates shuffle of pool
  return shuffled.slice(0, n)
```

### Answer Validation
```
function isCorrect(question: Question, selectedIds: string[]): boolean
  if question.type == "single"
    return selectedIds.length == 1 && selectedIds[0] == question.correctIds[0]
  else  // multi
    return selectedIds.sort() deep-equals question.correctIds.sort()
```

### Stop-on-Outcome Evaluation
```
function evaluateOutcome(
  correctCount: number,
  incorrectCount: number,
  totalQuestions: number,
  passThreshold: number
): "pass" | "fail" | null

  if correctCount >= passThreshold
    return "pass"
  failThreshold = totalQuestions - passThreshold + 1
  if incorrectCount >= failThreshold
    return "fail"
  return null   // quiz continues
```

### Seed Script Flow (`scripts/seed.js`)
```
1. Read CSV file from scripts/civics-seed.csv
2. Parse using Papa Parse
3. Create quiz document in /quizzes with Civics Test config
4. For each row: create question document in /quizzes/{id}/questions
5. Update quiz.questionCount to 128
6. Log success / failure per question
```

---

## API Endpoints (Firebase SDK — no REST calls)

| Operation | SDK Call | Auth Required |
|-----------|----------|---------------|
| List quizzes | `getDocs(collection(db, "quizzes"))` | No |
| Get quiz | `getDoc(doc(db, "quizzes", id))` | No |
| Get questions | `getDocs(collection(db, "quizzes", id, "questions"))` | No |
| Create quiz | `addDoc(collection(db, "quizzes"), data)` | Yes (admin) |
| Update quiz | `updateDoc(doc(db, "quizzes", id), data)` | Yes (admin) |
| Delete quiz | `deleteDoc(doc(db, "quizzes", id))` | Yes (admin) |
| Add question | `addDoc(collection(db, "quizzes", id, "questions"), q)` | Yes (admin) |
| Delete all questions | batch delete subcollection | Yes (admin) |
| Upload file | `uploadBytes(ref(storage, path), file)` | Yes (admin) |
| Admin login | `signInWithEmailAndPassword(auth, email, pw)` | — |
| Admin logout | `signOut(auth)` | — |

---

## Configuration

### Firebase Config (`js/firebase.js`)
Injected at deploy time via GitHub Actions secrets substitution:

```js
const firebaseConfig = {
  apiKey: "%%FIREBASE_API_KEY%%",
  authDomain: "%%FIREBASE_AUTH_DOMAIN%%",
  projectId: "%%FIREBASE_PROJECT_ID%%",
  storageBucket: "%%FIREBASE_STORAGE_BUCKET%%",
  messagingSenderId: "%%FIREBASE_MESSAGING_SENDER_ID%%",
  appId: "%%FIREBASE_APP_ID%%"
};
```

### `.env.example`
```
FIREBASE_API_KEY=your-api-key-here
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id
```

---

## File Inventory

```
Divel Quiz App/
├── .gitignore
├── .env.example
├── CLAUDE.md
├── progress.md
├── firebase.json              # Firebase Hosting config
├── firestore.rules            # Firestore security rules
├── storage.rules              # Firebase Storage security rules
├── index.html                 # Quiz Library (home, public)
├── quiz.html                  # Quiz Taking screen (public)
├── admin/
│   ├── index.html             # Admin Dashboard (protected)
│   ├── login.html             # Admin Login
│   └── quiz-form.html         # Create / Edit Quiz form
├── js/
│   ├── firebase.js            # Firebase init, exports db/auth/storage
│   ├── quiz-engine.js         # Pure logic: selection, validation, stop-on-outcome
│   ├── file-parser.js         # File upload parser (PDF/DOCX/CSV)
│   └── auth-guard.js          # Redirects unauthenticated admin page visits
├── css/
│   └── styles.css             # Global styles
├── scripts/
│   ├── seed.js                # One-time Firestore seeder (Node, run manually)
│   └── civics-seed.csv        # Civics test questions in CSV format
├── docs/
│   ├── REQUIREMENTS.md
│   ├── DESIGN.md
│   ├── SPECS.md
│   ├── TASKS.md
│   ├── PLAN.md
│   └── architecture.drawio
├── .github/
│   └── workflows/
│       └── deploy.yml         # GitHub Actions: build + Firebase deploy on push to main
└── 2025-Civics-Test-128-Questions-and-Answers.pdf   # Source PDF (not committed to git — too large; use scripts/civics-seed.csv instead)
```

---

## Browser Compatibility

| Feature | Minimum Browser |
|---------|----------------|
| ES Modules (`type="module"`) | Chrome 61+, Firefox 60+, Safari 10.1+ |
| Fetch API | Chrome 42+, Firefox 39+, Safari 10.1+ |
| PDF.js | Chrome 60+, Firefox 55+, Safari 11+ |
| File API (upload) | All modern browsers |

---

## Security Notes

- Admin credentials are managed entirely in Firebase Console — no self-registration endpoint exists
- Firestore rules enforce that write operations require a valid Firebase Auth token
- No quiz result data is persisted — nothing is stored about anonymous users
- Firebase config values (API key etc.) are safe to expose in client JS — Firebase security is enforced via Firestore/Storage rules and Auth, not by keeping the config secret
- The seed script uses Application Default Credentials (service account JSON) and must not be committed with real credentials
