"use client";

/**
 * Renders user-supplied custom CSS with strict sanitization.
 *
 * Security approach:
 * 1. Enforce a maximum CSS length (10 KB) to prevent abuse
 * 2. Block Unicode escape sequences that can bypass pattern matching
 * 3. Block ALL @-rules except @media and @keyframes (safe subset)
 * 4. Strip dangerous CSS functions (url, expression, javascript, -moz-binding, behavior)
 * 5. Block var(--) references to prevent leaking parent-page custom properties
 * 6. Strip position:fixed, high z-index, pointer-events:none (overlay attacks)
 * 7. Scope all selectors to .profile-customization to prevent page-wide side effects
 */

/** Maximum allowed CSS length in characters (~10 KB). */
const MAX_CSS_LENGTH = 10_000;

const DANGEROUS_PATTERNS: RegExp[] = [
  // Block ALL @-rules except @media and @keyframes
  /@(?!media\b|keyframes\b)[a-z-]+[^;{}]*/gi,

  // Positioning abuse (fixed overlays, stacking-context attacks)
  /position\s*:\s*fixed/gi,
  /position\s*:\s*sticky/gi,
  /z-index\s*:\s*[0-9]{4,}/gi,

  // Script / legacy injection vectors
  /javascript\s*:/gi,
  /expression\s*\(/gi,
  /-moz-binding\s*:/gi,
  /behavior\s*:/gi,

  // External resource loading
  /url\s*\(/gi,

  // CSS custom-property references (prevent leaking parent-page vars)
  /var\s*\(\s*--/gi,

  // Pointer-events abuse (click-jacking through transparent elements)
  /pointer-events\s*:\s*none/gi,

  // Visibility abuse for phishing overlays
  /clip-path\s*:\s*(?!none)[^;]*/gi,
  /backdrop-filter\s*:[^;]*/gi,

  // Content injection
  /content\s*:\s*(?!["']|none|normal|"")/gi,
];

/** Characters / sequences that can be used to bypass regex-based sanitisation. */
const UNICODE_ESCAPE_RE = /\\0/gi;

/**
 * Prefix every top-level selector with the profile-customization scope so user
 * CSS cannot affect the rest of the page.  Selectors inside @media / @keyframes
 * blocks are also prefixed.
 *
 * Approach: split on `{` / `}` tokens and prefix selector-like segments.
 */
function scopeSelectors(css: string, scope: string): string {
  // Tokenise into a flat list of selector / block pairs.
  // Walk character-by-character so we can handle nesting (@media).
  const out: string[] = [];
  let depth = 0;
  let buf = "";
  let inAtRule = false;

  for (let i = 0; i < css.length; i++) {
    const ch = css[i];

    if (ch === "{") {
      if (depth === 0) {
        const selector = buf.trim();
        // @media / @keyframes should not be scoped themselves
        if (/^@(media|keyframes)\b/i.test(selector)) {
          out.push(`${selector} {`);
          inAtRule = true;
        } else {
          // Prefix each comma-separated selector
          const scoped = selector
            .split(",")
            .map((s) => `${scope} ${s.trim()}`)
            .join(", ");
          out.push(`${scoped} {`);
        }
      } else {
        // Nested selector inside @media – scope it
        if (inAtRule && depth === 1) {
          const selector = buf.trim();
          const scoped = selector
            .split(",")
            .map((s) => `${scope} ${s.trim()}`)
            .join(", ");
          out.push(`${scoped} {`);
          buf = "";
          depth++;
          continue;
        }
        out.push(buf + "{");
      }
      buf = "";
      depth++;
      continue;
    }

    if (ch === "}") {
      depth--;
      out.push(buf + "}");
      buf = "";
      if (depth === 0) {
        inAtRule = false;
      }
      continue;
    }

    buf += ch;
  }

  // Append any trailing text (shouldn't happen with well-formed CSS)
  if (buf.trim()) {
    out.push(buf);
  }

  return out.join("\n");
}

function sanitizeCss(raw: string): string | null {
  // Enforce maximum length
  if (raw.length > MAX_CSS_LENGTH) {
    return null;
  }

  let css = raw;

  // Remove all comments first (could hide malicious code)
  css = css.replace(/\/\*[\s\S]*?\*\//g, "");

  // Block Unicode escape sequences (e.g. \0065xpression → expression bypass)
  if (UNICODE_ESCAPE_RE.test(css)) {
    return null;
  }

  // Apply all dangerous pattern removals
  for (const pattern of DANGEROUS_PATTERNS) {
    css = css.replace(pattern, "/* [removed] */");
  }

  // Scope all selectors to the profile customization container
  css = scopeSelectors(css, ".profile-customization");

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
