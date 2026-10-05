from pathlib import Path
from PIL import Image

src = Path("public/assets/flow/flow-logo.jpg")
dst = Path("public/assets/flow/flow-logo.png")

img = Image.open(src).convert("RGBA")
px = img.load()

# The source is a JPEG on a pure-black canvas. Remove only black / near-black
# pixels and feather the JPEG-compressed edge so the original artwork stays intact.
LOW = 8
HIGH = 42

for y in range(img.height):
    for x in range(img.width):
        r, g, b, _ = px[x, y]
        peak = max(r, g, b)
        if peak <= LOW:
            a = 0
        elif peak >= HIGH:
            a = 255
        else:
            t = (peak - LOW) / (HIGH - LOW)
            # Smoothstep gives a cleaner anti-aliased edge than a hard threshold.
            t = t * t * (3.0 - 2.0 * t)
            a = round(255 * t)
        px[x, y] = (r, g, b, a)

dst.parent.mkdir(parents=True, exist_ok=True)
img.save(dst, "PNG", optimize=True)

print(f"wrote {dst} {img.width}x{img.height}")
