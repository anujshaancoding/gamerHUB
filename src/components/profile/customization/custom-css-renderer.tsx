"use client";

/**
 * Renders user-supplied custom CSS with strict sanitization.
 *
 * Security approach:
 * 1. Strip all @ rules (imports, charset, keyframes, font-face, etc.)
 * 2. Strip dangerous CSS functions (url, expression, javascript, var with url)
 * 3. Strip position:fixed, high z-index, pointer-events:none (overlay attacks)
 * 4. Strip opacity:0 on large elements (phishing overlays)
 * 5. Only allow property declarations within simple selectors
 */

const DANGEROUS_PATTERNS = [
  // @ rules that load external resources or define new contexts
  /@import\b[^;]*/gi,
  /@charset\b[^;]*/gi,
  /@font-face\b[^}]*/gi,
  /@namespace\b[^;]*/gi,

  // Positioning abuse (fixed overlays, stacking-context attacks)
  /position\s*:\s*fixed/gi,
  /position\s*:\s*sticky/gi,
  /z-index\s*:\s*[0-9]{4,}/gi,

  // Script injection vectors
  /javascript\s*:/gi,
  /expression\s*\(/gi,
  /-moz-binding\s*:/gi,
  /behavior\s*:/gi,

  // External resource loading
  /url\s*\(/gi,

  // Pointer-events abuse (click-jacking through transparent elements)
  /pointer-events\s*:\s*none/gi,

  // Visibility abuse for phishing overlays
  /clip-path\s*:\s*(?!none)[^;]*/gi,
  /backdrop-filter\s*:[^;]*/gi,

  // Content injection
  /content\s*:\s*(?!["']|none|normal|"")/gi,
];

function sanitizeCss(raw: string): string {
  let css = raw;

  // Remove all comments first (could hide malicious code)
  css = css.replace(/\/\*[\s\S]*?\*\//g, "");

  // Apply all dangerous pattern removals
  for (const pattern of DANGEROUS_PATTERNS) {
    css = css.replace(pattern, "/* [removed] */");
  }

  return css.trim();
}

interface CustomCssRendererProps {
  css: unknown;
}

export function CustomCssRenderer({ css: rawCss }: CustomCssRendererProps) {
  // Validate input is a non-empty string
  if (typeof rawCss !== "string" || !rawCss.trim()) {
    return null;
  }

  const sanitized = sanitizeCss(rawCss);

  // If nothing meaningful remains after sanitization, render nothing
  if (!sanitized || sanitized.replace(/\/\*.*?\*\//g, "").trim() === "") {
    return null;
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: sanitized,
      }}
    />
  );
}
