/**
 * Score Audit Trail
 * Tracks all score changes with timestamps, user info, and reason
 */

export interface ScoreAuditEntry {
  id: string;
  submission_id: string;
  question_id: string;
  original_score: number;
  new_score: number;
  override_reason: string;
  changed_by: string; // trainer email
  changed_at: string; // ISO timestamp
  section: "A" | "B"; // Which section
}

/**
 * Format audit entry for display
 */
export function formatAuditEntry(entry: ScoreAuditEntry): string {
  const date = new Date(entry.changed_at);
  return `${date.toLocaleString()}: ${entry.original_score} → ${entry.new_score} (${entry.override_reason}) by ${entry.changed_by}`;
}

/**
 * Calculate score change percentage
 */
export function calculateScoreChange(original: number, newScore: number): number {
  if (original === 0) return newScore > 0 ? 100 : 0;
  return Math.round(((newScore - original) / original) * 100);
}
