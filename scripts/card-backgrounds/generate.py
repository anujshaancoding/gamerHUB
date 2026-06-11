#!/usr/bin/env python3
"""Generate the rank-card background images (1080x1350).

These are interim procedural backgrounds for /rank-card. Each theme writes
public/images/cards/bg-<theme>.jpg. To swap in AI-generated art later, just
replace the JPEGs (same filenames/dimensions) — no code changes needed.

Run: python3 scripts/card-backgrounds/generate.py
"""

import numpy as np
from PIL import Image, ImageFilter
from pathlib import Path

W, H = 1080, 1350
OUT = Path(__file__).resolve().parents[2] / "public" / "images" / "cards"

THEMES = {
    "ember": {
        "stops": [(16, 5, 8), (34, 9, 14), (10, 4, 6)],
        "accent": (255, 70, 85),
        "accent_deep": (140, 18, 32),
        "ribbon": (228, 42, 60),
        "ribbon_hi": (255, 120, 130),
    },
    "frost": {
        "stops": [(4, 10, 20), (8, 24, 44), (3, 7, 13)],
        "accent": (64, 176, 255),
        "accent_deep": (18, 64, 130),
        "ribbon": (36, 130, 235),
        "ribbon_hi": (140, 210, 255),
    },
    "aurum": {
        "stops": [(11, 8, 4), (22, 16, 7), (6, 4, 2)],
        "accent": (255, 198, 80),
        "accent_deep": (120, 82, 22),
        "ribbon": (212, 152, 40),
        "ribbon_hi": (255, 226, 150),
    },
    # Light theme modeled on the classic white trading card.
    "clean": {
        "light": True,
        "stops": [(244, 246, 248), (231, 234, 238), (247, 248, 249)],
        "accent": (148, 158, 170),
        "accent_deep": (108, 122, 138),
        "ribbon": (84, 108, 142),
        "ribbon_hi": (236, 240, 245),
    },
}


def smoothstep(edge0, edge1, x):
    t = np.clip((x - edge0) / (edge1 - edge0), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def band(u, center, width, soft):
    """Soft-edged band mask along axis u."""
    return smoothstep(center - width / 2 - soft, center - width / 2 + soft, u) * (
        1 - smoothstep(center + width / 2 - soft, center + width / 2 + soft, u)
    )


def generate(theme):
    t = THEMES[theme]
    light = t.get("light", False)
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    xn, yn = x / W, y / H

    # --- base: 3-stop gradient with a slight diagonal tilt -------------------
    g = np.clip(yn + (xn - 0.5) * 0.18, 0, 1)
    s0, s1, s2 = (np.array(c, dtype=np.float32) for c in t["stops"])
    img = np.zeros((H, W, 3), dtype=np.float32)
    lo = np.clip(g * 2, 0, 1)[..., None]
    hi = np.clip(g * 2 - 1, 0, 1)[..., None]
    img += (s0 * (1 - lo) + s1 * lo) * (g[..., None] < 0.5)
    img += (s1 * (1 - hi) + s2 * hi) * (g[..., None] >= 0.5)

    accent = np.array(t["accent"], dtype=np.float32)
    deep = np.array(t["accent_deep"], dtype=np.float32)

    # --- hero glow behind the player art -------------------------------------
    d = np.sqrt(((xn - 0.5) * 1.0) ** 2 + ((yn - 0.34) * (H / W)) ** 2)
    if light:
        # Light theme: lift toward white instead of pushing accent color.
        glow = np.clip(1 - d / 0.62, 0, 1) ** 2.2
        img += glow[..., None] * np.array([255, 255, 255], np.float32) * 0.05
    else:
        glow = np.clip(1 - d / 0.62, 0, 1) ** 2.2
        img += glow[..., None] * accent * 0.30
        core = np.clip(1 - d / 0.30, 0, 1) ** 2.5
        img += core[..., None] * np.array([255, 255, 255], np.float32) * 0.05

        # --- secondary corner glows (dark themes only) -----------------------
        d2 = np.sqrt((xn - 0.05) ** 2 + ((yn - 0.95) * (H / W)) ** 2)
        img += (np.clip(1 - d2 / 0.55, 0, 1) ** 2)[..., None] * deep * 0.45
        d3 = np.sqrt((xn - 1.0) ** 2 + ((yn - 0.1) * (H / W)) ** 2)
        img += (np.clip(1 - d3 / 0.5, 0, 1) ** 2)[..., None] * deep * 0.35

    # --- diagonal light beams (28deg, matching the brand slash angle) --------
    ang = np.deg2rad(28)
    u = xn * np.cos(ang) + yn * (H / W) * np.sin(ang)
    beams = (
        band(u, 0.30, 0.035, 0.03) * 0.07
        + band(u, 0.42, 0.010, 0.015) * 0.15
        + band(u, 0.78, 0.050, 0.045) * 0.06
        + band(u, 0.95, 0.014, 0.02) * 0.11
    )
    if light:
        img -= (beams * 0.45)[..., None] * (255 - accent)  # darken subtly
    else:
        img += beams[..., None] * accent

    # --- accent ribbon sweeping behind the lower-left (flag slot) ------------
    angr = np.deg2rad(-34)
    ur = (xn - 0.0) * np.cos(angr) + (yn - 0.62) * (H / W) * np.sin(angr)
    vr = -(xn - 0.0) * np.sin(angr) + (yn - 0.62) * (H / W) * np.cos(angr)
    reach = 1 - smoothstep(0.42, 0.62, vr)  # fade as it crosses the card
    ribbon = band(ur, 0.035, 0.075, 0.012) * reach
    ribbon_hi = band(ur, 0.105, 0.018, 0.008) * reach
    img = img * (1 - (ribbon * 0.85)[..., None]) + (
        (ribbon * 0.85)[..., None] * np.array(t["ribbon"], np.float32)
    )
    img = img * (1 - (ribbon_hi * 0.7)[..., None]) + (
        (ribbon_hi * 0.7)[..., None] * np.array(t["ribbon_hi"], np.float32)
    )

    # --- readability zones ------------------------------------------------------
    if light:
        # Lift the bottom panel toward clean white for the dark text block.
        m = (0.55 * smoothstep(0.68, 0.95, yn))[..., None]
        img = img * (1 - m) + np.array([251, 251, 252], np.float32) * m
        m2 = (0.30 * (1 - smoothstep(0.0, 0.10, yn)))[..., None]
        img = img * (1 - m2) + np.array([250, 250, 251], np.float32) * m2
    else:
        img *= (1 - 0.38 * smoothstep(0.70, 1.0, yn))[..., None]
        img *= (1 - 0.25 * (1 - smoothstep(0.0, 0.10, yn)))[..., None]

    # --- vignette --------------------------------------------------------------
    dv = np.sqrt((xn - 0.5) ** 2 + ((yn - 0.5) * (H / W)) ** 2)
    img *= (1 - (0.08 if light else 0.45) * smoothstep(0.45, 0.85, dv))[..., None]

    # --- film grain (after the soften pass so it stays crisp) -----------------
    soft = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
    soft = soft.filter(ImageFilter.GaussianBlur(0.5))
    img = np.asarray(soft, dtype=np.float32)
    rng = np.random.default_rng(7)
    img += rng.normal(0, 1.6 if light else 2.6, (H, W, 1)).astype(np.float32)

    out = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"bg-{theme}.jpg"
    out.save(path, "JPEG", quality=88, optimize=True)
    print(f"wrote {path} ({path.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    for name in THEMES:
        generate(name)
