/**
 * Tests for the "best agents for your rank" recommendation layer
 * (lib/tools/agent-rank-guide.ts).
 */

import {
  RANK_BANDS,
  ROLE_SLUGS,
  recsFor,
  isRankBand,
  isRoleSlug,
} from "@/lib/features/tools/agent-rank-guide";
import { AGENTS } from "@/lib/data/valorant-agents";

describe("agent-rank-guide", () => {
  it("returns recommendations for every rank × role combination", () => {
    for (const rank of RANK_BANDS) {
      for (const role of ROLE_SLUGS) {
        const recs = recsFor(rank, role);
        expect(recs.length).toBeGreaterThan(0);
      }
    }
  });

  it("only recommends agent slugs that resolve to real agents", () => {
    for (const rank of RANK_BANDS) {
      for (const role of ROLE_SLUGS) {
        for (const rec of recsFor(rank, role)) {
          expect(AGENTS.some((a) => a.slug === rec.slug)).toBe(true);
          expect(rec.why.length).toBeGreaterThan(10);
        }
      }
    }
  });

  it("recommends role-appropriate agents", () => {
    // Every recommended duelist must actually be a Duelist in the dataset.
    for (const rank of RANK_BANDS) {
      for (const rec of recsFor(rank, "duelist")) {
        const agent = AGENTS.find((a) => a.slug === rec.slug);
        expect(agent?.role).toBe("Duelist");
      }
    }
  });

  describe("guards", () => {
    it("isRankBand validates known bands", () => {
      expect(isRankBand("gold")).toBe(true);
      expect(isRankBand("nope")).toBe(false);
      expect(isRankBand(undefined)).toBe(false);
    });
    it("isRoleSlug validates known roles", () => {
      expect(isRoleSlug("duelist")).toBe(true);
      expect(isRoleSlug("support")).toBe(false);
      expect(isRoleSlug(null)).toBe(false);
    });
  });
});
