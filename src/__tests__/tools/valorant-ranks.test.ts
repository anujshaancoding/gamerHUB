/**
 * Tests for the shared Valorant rank-tier metadata (lib/tools/valorant-ranks.ts).
 * Pure logic — guards the rank-card / percentile shared vocabulary.
 */

import {
  VALORANT_TIERS,
  tierGroup,
  tierColor,
  normaliseTier,
} from "@/lib/tools/valorant-ranks";

describe("valorant-ranks", () => {
  it("lists every tier lowest → highest, ending at Radiant", () => {
    expect(VALORANT_TIERS[0]).toBe("Iron 1");
    expect(VALORANT_TIERS[VALORANT_TIERS.length - 1]).toBe("Radiant");
    expect(VALORANT_TIERS).toContain("Gold 2");
    // 8 named tiers × 3 divisions + Radiant = 25
    expect(VALORANT_TIERS.length).toBe(25);
  });

  describe("tierGroup", () => {
    it("maps full tiers to their color family", () => {
      expect(tierGroup("Gold 2")).toBe("gold");
      expect(tierGroup("Immortal 3")).toBe("immortal");
      expect(tierGroup("Radiant")).toBe("radiant");
    });
    it("falls back to 'all' for unknown input", () => {
      expect(tierGroup("Unranked")).toBe("all");
      expect(tierGroup("")).toBe("all");
    });
  });

  describe("tierColor", () => {
    it("returns a hex color for a known tier", () => {
      expect(tierColor("Gold 2")).toMatch(/^#/);
    });
    it("falls back to the ggLobby accent for unknown input", () => {
      expect(tierColor("Unranked")).toMatch(/^#/);
    });
  });

  describe("normaliseTier", () => {
    it("matches a full tier case-insensitively", () => {
      expect(normaliseTier("gold 2")).toBe("Gold 2");
      expect(normaliseTier("  RADIANT ")).toBe("Radiant");
    });
    it("maps a bare group name to its middle division", () => {
      expect(normaliseTier("gold")).toBe("Gold 2");
      expect(normaliseTier("immortal")).toBe("Immortal 2");
    });
    it("returns null for null / non-tier input", () => {
      expect(normaliseTier(null)).toBeNull();
      expect(normaliseTier(undefined)).toBeNull();
      expect(normaliseTier("nonsense")).toBeNull();
    });
  });
});
