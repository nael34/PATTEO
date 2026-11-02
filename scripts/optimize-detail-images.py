from pathlib import Path

from PIL import Image, ImageDraw, ImageOps


SOURCES = {
    "silver-gray": r"C:\Users\N.N.Adil\.codex\generated_images\01a182c9-cc70-7e41-a38b-5233c0c702ec\exec-fe44ea92-8c04-4918-ae48-74555e0b2444.png",
    "snow-blue": r"C:\Users\N.N.Adil\.codex\generated_images\01a182c9-cc70-7e41-a38b-5233c0c702ec\exec-45675fc6-d410-4e93-82ae-23df87135e5c.png",
    "bright-red": r"C:\Users\N.N.Adil\.codex\generated_images\01a182c9-cc70-7e41-a38b-5233c0c702ec\exec-9d9d195a-598b-4b70-b89e-3c914ed75d73.png",
    "brown": r"C:\Users\N.N.Adil\.codex\generated_images\01a182c9-cc70-7e41-a38b-5233c0c702ec\exec-266256c4-1aa7-4952-83bc-ffa17cb19d38.png",
    "camel": r"C:\Users\N.N.Adil\.codex\generated_images\01a182c9-cc70-7e41-a38b-5233c0c702ec\exec-70e611ee-78a5-40b8-976a-3f02e0c9a9df.png",
    "champagne": r"C:\Users\N.N.Adil\.codex\generated_images\01a182c9-cc70-7e41-a38b-5233c0c702ec\exec-7a17ba63-6b44-4c0a-942d-05faefbc382b.png",
    "dark-gray": r"C:\Users\N.N.Adil\.codex\generated_images\01a182c9-cc70-7e41-a38b-5233c0c702ec\exec-3542b4b3-7afb-40f8-8cfa-bced9e8d6157.png",
    "glass-green": r"C:\Users\N.N.Adil\.codex\generated_images\01a182c9-cc70-7e41-a38b-5233c0c702ec\exec-34f31ffb-ba72-4e7e-8349-dec87f0ac4c3.png",
}

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "dist" / "assets" / "variants"
OUTPUT.mkdir(parents=True, exist_ok=True)

board = Image.new("RGB", (1200, 640), "#faf6ed")
draw = ImageDraw.Draw(board)

for index, (name, source) in enumerate(SOURCES.items()):
    image = Image.open(source).convert("RGB")
    image = ImageOps.fit(image, (1100, 1100), Image.Resampling.LANCZOS)
    destination = OUTPUT / f"{name}-detail.webp"
    image.save(destination, "WEBP", quality=86, method=6)

    tile = ImageOps.fit(image, (300, 280), Image.Resampling.LANCZOS)
    x = (index % 4) * 300
    y = (index // 4) * 320
    board.paste(tile, (x, y))
    draw.text((x + 12, y + 288), name, fill="#123b4d")
    print(name, image.size, destination.stat().st_size)

board.save(OUTPUT / "review-detail-contact-sheet.jpg", quality=88)
