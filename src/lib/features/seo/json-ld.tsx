interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[];
}

export function JsonLd({ data }: JsonLdProps) {
  const jsonLd = Array.isArray(data)
    ? data
    : { "@context": "https://schema.org", ...data };

  // Escape characters that could break out of the <script> context or be
  // interpreted as HTML, preventing XSS via attacker-controlled structured data
  // (e.g. a title containing "</script>").
  const __html = JSON.stringify(jsonLd)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html }}
    />
  );
}
