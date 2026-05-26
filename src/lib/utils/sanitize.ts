import DOMPurify from "isomorphic-dompurify";

// Whitelist URL schemes for href/src. Blocks javascript:, vbscript:, file:,
// and data:text/html (the latter can carry inline scripts). Image data: URIs
// are filtered separately via the img-specific hook below.
const SAFE_URL_REGEXP = /^(?:(?:https?|mailto|tel):|\/|#|\?)/i;

// Permit only image data: URIs on <img src> — text/html data: would render scripts.
const SAFE_IMG_SRC_REGEXP = /^(?:(?:https?):|\/|data:image\/(?:png|jpe?g|gif|webp|avif|svg\+xml);base64,)/i;

let hooksRegistered = false;
function registerHooks() {
  if (hooksRegistered) return;
  hooksRegistered = true;

  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (!(node instanceof Element)) return;

    if (node.hasAttribute("href")) {
      const href = node.getAttribute("href") ?? "";
      if (!SAFE_URL_REGEXP.test(href.trim())) {
        node.removeAttribute("href");
      } else if (node.tagName === "A") {
        node.setAttribute("rel", "noopener noreferrer nofollow");
        if (node.getAttribute("target") === "_blank") {
          node.setAttribute("rel", "noopener noreferrer nofollow");
        }
      }
    }

    if (node.tagName === "IMG" && node.hasAttribute("src")) {
      const src = node.getAttribute("src") ?? "";
      if (!SAFE_IMG_SRC_REGEXP.test(src.trim())) {
        node.removeAttribute("src");
      }
    }
  });
}

/**
 * Sanitize HTML content to prevent XSS attacks.
 * Strips scripts/event handlers and blocks javascript:/data:text/html URLs in href/src.
 */
export function sanitizeHtml(dirty: string): string {
  registerHooks();
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
