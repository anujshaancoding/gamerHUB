/**
 * Canonical version stamp for the Terms of Service and Privacy Policy.
 *
 * Bump this string whenever the policy "Last updated" date changes (see
 * src/app/terms/page.tsx and src/app/privacy/page.tsx). We record the version a
 * user consented to at signup so we have a DPDP audit trail and can later detect
 * who needs to re-consent after a material policy change.
 */
export const POLICY_VERSION = "2026-06-05";
