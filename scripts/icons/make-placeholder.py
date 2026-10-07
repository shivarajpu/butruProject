#!/usr/bin/env python3
"""
make-placeholder.py — one-time helper for generating a starter app icon.

NOT part of the build. It exists so you can see the white-label pipeline working
end to end with a placeholder, and so you have a template to adapt the next time
you need a placeholder.

The file it writes — clients/icons/<client>/icon.png — IS committed and IS the
source of truth for that client's icon. `npm run clients:sync` resizes it into
every Android mipmap density and every iOS icon size.

To use a real icon instead: drop your own 1024x1024 PNG over that path and
re-run `npm run clients:sync`. Nothing else changes.

Usage:
    python3 scripts/icons/make-placeholder.py clienta "A" "#2563EB" "#F59E0B"
"""

import os
import sys

try:
    from PIL import Image, ImageDraw, ImageFilter
except ImportError:
    sys.exit("Pillow is required for this one-off helper: pip3 install Pillow")

SIZE = 1024


def lerp(a, b, t):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3))


def hex_rgb(value):
    value = value.lstrip("#")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))


def main():
    client = sys.argv[1] if len(sys.argv) > 1 else "clienta"
    letter = sys.argv[2] if len(sys.argv) > 2 else "A"
    start_hex = sys.argv[3] if len(sys.argv) > 3 else "#2563EB"
    end_hex = sys.argv[4] if len(sys.argv) > 4 else "#F59E0B"

    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    out_dir = os.path.join(root, "clients", "icons", client)
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "icon.png")

    start = hex_rgb(start_hex)
    end = hex_rgb(end_hex)

    # ── Diagonal gradient background ────────────────────────────────────────
    base = Image.new("RGB", (SIZE, SIZE), start)
    draw = ImageDraw.Draw(base)
    for i in range(SIZE):
        draw.line([(0, i), (SIZE, i)], fill=lerp(start, end, i / (SIZE - 1)))

    # ── Soft highlight sweeping across the upper-left ────────────────────────
    glow = Image.new("L", (SIZE, SIZE), 0)
    ImageDraw.Draw(glow).ellipse(
        [-SIZE * 0.35, -SIZE * 0.55, SIZE * 0.85, SIZE * 0.65], fill=70
    )
    glow = glow.filter(ImageFilter.GaussianBlur(SIZE * 0.09))
    base = Image.composite(
        Image.new("RGB", (SIZE, SIZE), (255, 255, 255)), base, glow
    )

    # ── Accent bar, bottom-right, in the secondary brand colour ──────────────
    draw = ImageDraw.Draw(base)
    bar = int(SIZE * 0.052)
    pad = int(SIZE * 0.13)
    draw.rounded_rectangle(
        [pad, SIZE - pad - bar, SIZE - pad, SIZE - pad],
        radius=bar // 2,
        fill=end,
    )

    # ── Monogram ─────────────────────────────────────────────────────────────
    # Drawn from primitives so it scales cleanly to 48x48 on Android.
    cx, cy = SIZE / 2, SIZE / 2 - SIZE * 0.02
    scale = SIZE * 0.30
    stroke = int(stroke_w := scale * 0.20)
    white = (255, 255, 255)

    # Letter "A" as two strokes + a crossbar: stays crisp when downscaled far
    # more than a rendered font outline would.
    draw.line(
        [(cx - scale, cy + scale), (cx, cy - scale)], fill=white, width=stroke
    )
    draw.line(
        [(cx, cy - scale), (cx + scale, cy + scale)], fill=white, width=stroke
    )
    draw.line(
        [
            (cx - scale * 0.52, cy + scale * 0.30),
            (cx + scale * 0.52, cy + scale * 0.30),
        ],
        fill=white,
        width=int(stroke * 0.85),
    )

    # ── iOS forbids transparency in the 1024 marketing icon ──────────────────
    base = base.convert("RGB")
    base.save(out_path, "PNG", optimize=True)

    print(f"✓ {os.path.relpath(out_path, root)}  (1024x1024, no alpha)")
    print(f"  {start_hex} → {end_hex} gradient, monogram '{letter}'")
    print("\nReplace it with your own 1024x1024 PNG at the same path, then:")
    print("  npm run clients:sync")


if __name__ == "__main__":
    main()
