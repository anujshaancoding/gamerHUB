/**
 * Tests for the rank-distribution India/global data layer
 * (lib/tools/rank-distribution.ts).
 */

import {
  RANK_PROFILES,
  REGION_META,
  rowsFor,
  percentileFor,
} from "@/lib/tools/rank-distribution";

describe("rank-distribution", () => {
  const profile = RANK_PROFILES[0];

  it("exposes both global and india distributions", () => {
    expect(profile.byRegion.global.length).toBeGreaterThan(0);
    expect(profile.byRegion.india.length).toBeGreaterThan(0);
  });

  it("labels the india layer as an estimate (not authoritative)", () => {
    expect(REGION_META.india.estimate).toBe(true);
    expect(REGION_META.india.note.toLowerCase()).toContain("estimate");
  });

  describe("rowsFor", () => {
    it("returns the requested region's rows", () => {
      expect(rowsFor(profile, "india")).toBe(profile.byRegion.india);
      expect(rowsFor(profile, "global")).toBe(profile.byRegion.global);
    });
  });

  describe("percentileFor", () => {
    const rows = profile.byRegion.global;

    it("normalises below + at + above to ~100%", () => {
      const r = percentileFor(rows, "Gold 2");
      expect(r.below + r.at + r.above).toBeCloseTo(100, 3);
    });

    it("returns 0 below for the lowest tier", () => {
      const r = percentileFor(rows, rows[0].tier);
      expect(r.below).toBeCloseTo(0, 5);
    });

    it("returns 0 above for the highest tier", () => {
      const r = percentileFor(rows, rows[rows.length - 1].tier);
      expect(r.above).toBeCloseTo(0, 5);
    });

    it("returns zeros for an unknown tier", () => {
      expect(percentileFor(rows, "Nope")).toEqual({ below: 0, at: 0, above: 0 });
    });

    it("places a player above more of the field at higher ranks", () => {
      const gold = percentileFor(rows, "Gold 2");
      const diamond = percentileFor(rows, "Diamond 2");
      expect(diamond.below).toBeGreaterThan(gold.below);
    });
  });
});
