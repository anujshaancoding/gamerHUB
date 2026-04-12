/**
 * Sanitize a search string for safe use in .or() filter expressions.
 * Strips characters that could alter the filter logic: commas, dots (used as operator separators),
 * parentheses (used for grouping), and other PostgREST filter metacharacters.
 */
export function sanitizeSearchQuery(input: string): string {
  // Remove characters that are meaningful in PostgREST filter syntax
  return input.replace(/[,.()\[\]{}\\;:'"!@#$%^&*+=|<>?/~`]/g, "").trim();
}
