import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely parses an HTTP Response as JSON, providing robust fallback when
 * the server returns non-JSON bodies (e.g. 500 plain text "A server error has occurred",
 * HTML error pages, reverse proxy errors, or network disconnects).
 */
export async function safeParseJson<T = any>(
  response: Response,
  fallbackErrorMessage = "Server request failed"
): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
  let text = "";
  try {
    text = await response.text();
  } catch (err: any) {
    return {
      ok: false,
      status: response.status,
      data: null,
      error: `Network reading error: ${err?.message || "Could not read response body"}`,
    };
  }

  let parsed: any = null;
  if (text && text.trim().length > 0) {
    try {
      parsed = JSON.parse(text);
    } catch {
      // Non-JSON response (e.g. plain text 500 from Vercel/Node runtime crash or HTML error page)
      const cleanText = text.replace(/<[^>]*>?/gm, "").trim();
      const snippet = cleanText.length > 200 ? cleanText.slice(0, 200) + "..." : cleanText;
      return {
        ok: false,
        status: response.status,
        data: null,
        error: snippet || `${fallbackErrorMessage} (HTTP ${response.status})`,
      };
    }
  }

  if (!response.ok) {
    const errorMsg =
      parsed?.error ||
      parsed?.message ||
      `${fallbackErrorMessage} (HTTP ${response.status})`;
    return {
      ok: false,
      status: response.status,
      data: parsed,
      error: errorMsg,
    };
  }

  return {
    ok: true,
    status: response.status,
    data: parsed,
  };
}

export {
  normalizeAdmissionNumber,
  matchAdmissionNumbers,
} from "../../../shared/const.ts";

export {
  OFFICIAL_INSTITUTIONAL_COHORTS,
  resolveCanonicalCohortKey,
  findCohortByCodeOrAlias,
  getDepartmentForCohort,
  getStorageKeysForCohort,
} from "../../../shared/cohortRegistry.ts";
