"use client";

/**
 * Patterns that are stripped from user-supplied CSS for security.
 *
 * - @import / @charset     : prevent loading external resources
 * - position:\s*fixed      : prevent fixed overlays hijacking the page
 * - z-index with 4+ digits : prevent stacking-context abuse
 * - javascript:            : prevent script injection via url()
 * - expression(            : IE CSS expression injection
 * - url(data:              : prevent data-URI payloads
 */
const DANGEROUS_PATTERNS = [
  /@import\b[^;]*/gi,
  /@charset\b[^;]*/gi,
  /position\s*:\s*fixed/gi,
  /z-index\s*:\s*[0-9]{4,}/gi,
  /javascript\s*:/gi,
  /expression\s*\(/gi,
  /url\s*\(\s*data\s*:/gi,
];

function sanitizeCss(raw: string): string {
  let css = raw;
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
