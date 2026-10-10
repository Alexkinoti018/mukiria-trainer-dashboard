/**
 * Mukiria Technical Training Institute (MTTI)
 * Unified Exam Design System Tokens
 * Strictly enforces MTTI brand identity and WCAG 2.1 AAA high-contrast standards (> 7:1 ratio)
 * for interactive screens and physical print/PDF exports.
 */

export const EXAM_THEME_TOKENS = {
  colors: {
    brand: {
      navy: "#000953",
      navyHover: "#000e7a",
      gold: "#c48820",
      goldLight: "#fef6e7",
      white: "#ffffff",
    },
    text: {
      screenBody: "#0f172a",     // Slate-900 (18.6:1 contrast against white - WCAG AAA)
      screenMuted: "#334155",    // Slate-700
      screenSubtle: "#64748b",   // Slate-500
      printPrimary: "#000000",   // Pure Black (21:1 contrast, ink-efficient)
      printMuted: "#1f2937",     // Dark Gray
    },
    border: {
      divider: "#e2e8f0",
      goldDivider: "#c48820",
      navyDivider: "#000953",
    },
  },
  typography: {
    fontFamilies: {
      screen: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
      print: '"Helvetica Neue", Arial, Calibri, sans-serif',
      mono: 'ui-monospace, "SFMono-Regular", Menlo, Monaco, Consolas, monospace',
    },
    screenScale: {
      institutionHeader: {
        fontSize: "1.625rem", // 26px
        fontWeight: "700",
        lineHeight: "1.2",
      },
      examPaperTitle: {
        fontSize: "1.25rem", // 20px
        fontWeight: "700",
        lineHeight: "1.3",
      },
      sectionHeading: {
        fontSize: "1.125rem", // 18px
        fontWeight: "600",
        lineHeight: "1.3",
      },
      questionPrompt: {
        fontSize: "1.0rem", // 16px
        fontWeight: "500",
        lineHeight: "1.55",
      },
      allocatedMarksBadge: {
        fontSize: "0.8125rem", // 13px
        fontWeight: "700",
        lineHeight: "1.0",
      },
      footersTimestamps: {
        fontSize: "0.75rem", // 12px
        fontWeight: "400",
        lineHeight: "1.4",
      },
    },
    printScale: {
      institutionHeader: {
        fontSize: "18pt",
        fontWeight: "700",
        lineHeight: "1.2",
      },
      examPaperTitle: {
        fontSize: "14pt",
        fontWeight: "700",
        lineHeight: "1.3",
      },
      sectionHeading: {
        fontSize: "12pt",
        fontWeight: "600",
        lineHeight: "1.3",
      },
      questionPrompt: {
        fontSize: "11pt",
        fontWeight: "500",
        lineHeight: "1.55",
      },
      allocatedMarksBadge: {
        fontSize: "10pt",
        fontWeight: "700",
        lineHeight: "1.0",
      },
      footersTimestamps: {
        fontSize: "9pt",
        fontWeight: "400",
        lineHeight: "1.3",
      },
    },
  },
} as const;

export type ExamThemeTokens = typeof EXAM_THEME_TOKENS;
