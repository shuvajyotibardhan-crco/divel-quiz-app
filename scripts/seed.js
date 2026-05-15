/**
 * One-time seed script — loads US Civics Test into Firestore.
 *
 * Usage (from project root):
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/sa.json node scripts/seed.js
 *
 * Requires: npm install firebase-admin papaparse (run from project root)
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import Papa from "papaparse";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Init Firebase Admin ──────────────────────────────────────────────────────
const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!saPath) {
  console.error("Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON path.");
  process.exit(1);
}

initializeApp({ credential: cert(JSON.parse(readFileSync(saPath, "utf8"))) });
const db = getFirestore();

// ── Parse CSV ────────────────────────────────────────────────────────────────
const csvPath = join(__dirname, "civics-seed.csv");
const csv = readFileSync(csvPath, "utf8");
const { data, errors } = Papa.parse(csv, { header: true, skipEmptyLines: true });

if (errors.length) console.warn("CSV warnings:", errors);
console.log(`Parsed ${data.length} questions from CSV.`);

// ── Build question docs ──────────────────────────────────────────────────────
function rowToQuestion(row) {
  const answerKeys = ["answer_a", "answer_b", "answer_c", "answer_d"];
  const ids = ["a", "b", "c", "d"];
  const answers = answerKeys
    .map((k, i) => ({ id: ids[i], text: (row[k] || "").trim() }))
    .filter(a => a.text);

  const correctIds = (row.correct || "").toLowerCase()
    .split(",").map(s => s.trim()).filter(Boolean);

  return {
    text: row.question.trim(),
    answers,
    correctIds,
    type: correctIds.length > 1 ? "multi" : (row.type || "single"),
  };
}

const questions = data.map(rowToQuestion);

// ── Write to Firestore ────────────────────────────────────────────────────────
const QUIZ_NAME = "US Civics Test";
const TOTAL_QUESTIONS = 20;
const PASS_THRESHOLD = 12;

async function seed() {
  console.log("Creating quiz document…");

  // Check if quiz already exists
  const existing = await db.collection("quizzes").where("name", "==", QUIZ_NAME).limit(1).get();
  let quizId;

  if (!existing.empty) {
    quizId = existing.docs[0].id;
    console.log(`Quiz already exists (id: ${quizId}). Updating…`);
    await db.collection("quizzes").doc(quizId).set({
      name: QUIZ_NAME,
      answerType: "single",
      totalQuestions: TOTAL_QUESTIONS,
      passThreshold: PASS_THRESHOLD,
      stopBehaviour: "stop-on-outcome",
      questionCount: questions.length,
      sourceFileUrl: "",
      sourceFileName: "civics-seed.csv",
      updatedAt: new Date(),
    }, { merge: false });

    // Delete old questions
    const oldQs = await db.collection("quizzes").doc(quizId).collection("questions").get();
    const delBatch = db.batch();
    oldQs.forEach(d => delBatch.delete(d.ref));
    await delBatch.commit();
    console.log(`Deleted ${oldQs.size} old questions.`);
  } else {
    const ref = await db.collection("quizzes").add({
      name: QUIZ_NAME,
      answerType: "single",
      totalQuestions: TOTAL_QUESTIONS,
      passThreshold: PASS_THRESHOLD,
      stopBehaviour: "stop-on-outcome",
      questionCount: questions.length,
      sourceFileUrl: "",
      sourceFileName: "civics-seed.csv",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    quizId = ref.id;
    console.log(`Created quiz (id: ${quizId})`);
  }

  // Batch-write questions (Firestore limit: 500 per batch)
  const BATCH_SIZE = 400;
  let written = 0;
  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const batch = db.batch();
    questions.slice(i, i + BATCH_SIZE).forEach(q => {
      const ref = db.collection("quizzes").doc(quizId).collection("questions").doc();
      batch.set(ref, q);
    });
    await batch.commit();
    written += Math.min(BATCH_SIZE, questions.length - i);
    console.log(`Written ${written}/${questions.length} questions…`);
  }

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch(err => { console.error("Seed failed:", err); process.exit(1); });
