import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize HTML content to prevent XSS attacks.
 * Allows safe HTML tags (formatting, links, images) but strips scripts and event handlers.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "br", "hr",
      "strong", "em", "b", "i", "u", "s", "del", "ins", "mark",
      "ul", "ol", "li",
      "blockquote", "pre", "code",
      "a", "img",
      "table", "thead", "tbody", "tr", "th", "td",
      "div", "span",
    ],
    ALLOWED_ATTR: [
      "href", "target", "rel", "src", "alt", "title", "class",
      "width", "height",
    ],
    // Force all links to open safely
    ADD_ATTR: ["target"],
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input", "textarea", "select"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"],
  });
}

/**
 * Sanitize a search string for safe use in .or() filter expressions.
 * Strips characters that could alter the filter logic: commas, dots (used as operator separators),
 * parentheses (used for grouping), and other PostgREST filter metacharacters.
 */
export function sanitizeSearchQuery(input: string): string {
  // Remove characters that are meaningful in PostgREST filter syntax
  return input.replace(/[,.()\[\]{}\\;:'"!@#$%^&*+=|<>?/~`]/g, "").trim();
}
