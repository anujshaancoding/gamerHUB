/**
 * Tests for the canonical analytics source vocabulary (lib/analytics/sources.ts).
 * Pure logic — no DB / network. Guards the funnel event vocabulary against drift.
 */

import {
  ANALYTICS_SOURCES,
  CTA_SOURCES,
  SIGNUP_SOURCES,
  ACTIVATION_SOURCES,
  FUNNEL_EVENTS,
  isCtaSource,
  toolSource,
} from "@/lib/analytics/sources";

describe("analytics sources vocabulary", () => {
  it("exposes the three funnel event names", () => {
    expect(FUNNEL_EVENTS.signup).toBe("signup");
    expect(FUNNEL_EVENTS.activation).toBe("activation");
    expect(FUNNEL_EVENTS.cta_click).toBe("cta_click");
  });

  it("includes the signup providers", () => {
    expect(SIGNUP_SOURCES.email).toBe("email");
    expect(SIGNUP_SOURCES.google).toBe("google");
  });

  it("includes the activation sources", () => {
    expect(ACTIVATION_SOURCES.lfg_accept).toBe("lfg_accept");
    expect(ACTIVATION_SOURCES.friend_accept).toBe("friend_accept");
  });

  it("includes every required discovery/CTA surface", () => {
    const required = [
      "gate_modal",
      "navbar",
      "profile_page",
      "lfg_surface",
      "community_feed",
      "rank_card",
      "onboarding_referral",
    ];
    for (const s of required) {
      expect(Object.values(CTA_SOURCES)).toContain(s);
    }
  });

  it("aggregates all literal sources without collisions", () => {
    const values = Object.values(ANALYTICS_SOURCES);
    expect(new Set(values).size).toBe(values.length);
  });

  describe("toolSource", () => {
    it("namespaces tool sources under tool_<name>", () => {
      expect(toolSource("sens_converter")).toBe("tool_sens_converter");
      expect(toolSource("crosshair")).toBe("tool_crosshair");
    });
  });

  describe("isCtaSource", () => {
    it("accepts known CTA surfaces", () => {
      expect(isCtaSource("gate_modal")).toBe(true);
      expect(isCtaSource("navbar")).toBe(true);
    });

    it("accepts dynamic tool_<name> sources", () => {
      expect(isCtaSource("tool_sens_converter")).toBe(true);
      expect(isCtaSource(toolSource("crosshair"))).toBe(true);
    });

    it("rejects the bare tool_ prefix with no name", () => {
      expect(isCtaSource("tool_")).toBe(false);
    });

    it("rejects unknown or non-string sources", () => {
      expect(isCtaSource("nonsense")).toBe(false);
      expect(isCtaSource("email")).toBe(false); // signup provider, not a CTA surface
      expect(isCtaSource(123)).toBe(false);
      expect(isCtaSource(null)).toBe(false);
      expect(isCtaSource(undefined)).toBe(false);
    });
  });
});
