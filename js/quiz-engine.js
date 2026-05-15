/**
 * Fisher-Yates shuffle — returns a new shuffled array.
 */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Randomly select n questions from the pool.
 */
export function selectQuestions(pool, n) {
  return shuffle(pool).slice(0, n);
}

/**
 * Validate a submitted answer against the correct answer(s).
 * selectedIds: string[] of answer IDs the user chose.
 */
export function isCorrect(question, selectedIds) {
  const correct = [...question.correctIds].sort();
  const selected = [...selectedIds].sort();
  if (correct.length !== selected.length) return false;
  return correct.every((id, i) => id === selected[i]);
}

/**
 * Evaluate stop-on-outcome for the current quiz state.
 * Returns "pass", "fail", or null (quiz continues).
 *
 * Pass: correctCount >= passThreshold
 * Fail: incorrectCount >= (totalQuestions - passThreshold + 1)
 *       — at that point the user can no longer reach the threshold
 */
export function evaluateOutcome(correctCount, incorrectCount, totalQuestions, passThreshold) {
  if (correctCount >= passThreshold) return "pass";
  const failThreshold = totalQuestions - passThreshold + 1;
  if (incorrectCount >= failThreshold) return "fail";
  return null;
}

/**
 * Final score for run-to-end mode.
 */
export function calculateFinalOutcome(correctCount, passThreshold) {
  return correctCount >= passThreshold ? "pass" : "fail";
}
