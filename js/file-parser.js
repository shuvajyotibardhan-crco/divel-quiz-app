/**
 * Parse an uploaded File into a normalised Question array.
 * Supports CSV, PDF, and DOCX.
 *
 * Returned Question shape:
 * { text, answers: [{id, text}], correctIds: string[], type: "single"|"multi" }
 */

const PAPA_URL = "https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js";
const PDFJS_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.min.mjs";
const MAMMOTH_URL = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.7.2/mammoth.browser.min.js";

async function loadScript(url) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${url}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = url; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function loadModule(url) {
  return import(url);
}

/** Parse CSV using Papa Parse */
async function parseCSV(file) {
  await loadScript(PAPA_URL);
  return new Promise((resolve, reject) => {
    window.Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete({ data, errors }) {
        if (errors.length) console.warn("CSV parse warnings:", errors);
        const questions = [];
        data.forEach((row, i) => {
          try {
            const q = rowToQuestion(row, i);
            if (q) questions.push(q);
          } catch (e) {
            console.warn(`Row ${i + 1} skipped:`, e.message);
          }
        });
        resolve(questions);
      },
      error: reject,
    });
  });
}

function rowToQuestion(row, idx) {
  const text = (row.question || "").trim();
  if (!text) throw new Error("Missing question text");

  const answerKeys = ["answer_a", "answer_b", "answer_c", "answer_d"];
  const letterToId = { a: "a", b: "b", c: "c", d: "d" };
  const answers = answerKeys
    .map((k, i) => ({ id: ["a", "b", "c", "d"][i], text: (row[k] || "").trim() }))
    .filter(a => a.text);

  if (answers.length < 2) throw new Error("Need at least 2 answer options");

  const correctRaw = (row.correct || "").toLowerCase().split(",").map(s => s.trim()).filter(Boolean);
  const correctIds = correctRaw.map(l => letterToId[l]).filter(Boolean);
  if (!correctIds.length) throw new Error("No valid correct answer");

  const type = correctIds.length > 1 ? "multi" : ((row.type || "").trim() || "single");
  return { text, answers, correctIds, type };
}

/** Extract text from PDF using PDF.js */
async function parsePDF(file) {
  const pdfjsLib = await loadModule(PDFJS_URL);
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    fullText += content.items.map(i => i.str).join(" ") + "\n";
  }
  return parseTextQuestions(fullText);
}

/** Extract text from DOCX using mammoth */
async function parseDOCX(file) {
  await loadScript(MAMMOTH_URL);
  const arrayBuffer = await file.arrayBuffer();
  const { value } = await window.mammoth.extractRawText({ arrayBuffer });
  return parseTextQuestions(value);
}

/**
 * Parse plain text extracted from PDF/DOCX.
 * Expected format:
 *   1. Question text
 *   A. Answer option
 *   B. Answer option
 *   Answer: A
 */
function parseTextQuestions(text) {
  const questions = [];
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  let current = null;

  for (const line of lines) {
    const qMatch = line.match(/^(\d+)[.)]\s+(.+)/);
    const aMatch = line.match(/^([A-D])[.)]\s+(.+)/i);
    const answerMatch = line.match(/^(?:Answer|Correct)[:\s]+([A-D,\s]+)/i);

    if (qMatch) {
      if (current) questions.push(finaliseTextQuestion(current));
      current = { text: qMatch[2].trim(), answers: [], correctIds: [] };
    } else if (aMatch && current) {
      current.answers.push({ id: aMatch[1].toLowerCase(), text: aMatch[2].trim() });
    } else if (answerMatch && current) {
      current.correctIds = answerMatch[1]
        .split(/[,\s]+/).map(l => l.trim().toLowerCase()).filter(l => /^[a-d]$/.test(l));
    }
  }
  if (current) questions.push(finaliseTextQuestion(current));
  return questions;
}

function finaliseTextQuestion(q) {
  if (!q.text) throw new Error("Empty question");
  if (q.answers.length < 2) throw new Error("Too few answers");
  if (!q.correctIds.length) throw new Error("No correct answer marked");
  return { ...q, type: q.correctIds.length > 1 ? "multi" : "single" };
}

/** Public entry point */
export async function parseFile(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv")) return parseCSV(file);
  if (name.endsWith(".pdf")) return parsePDF(file);
  if (name.endsWith(".docx")) return parseDOCX(file);
  throw new Error(`Unsupported file format: ${file.name}`);
}
