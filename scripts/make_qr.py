#!/usr/bin/env python3
"""Generate the QR code used on the printable ticket.

Usage: python3 scripts/make_qr.py "https://starring-nare.com"
Writes assets/qr.svg (for printing) and assets/qr.png.
"""
import sys
from pathlib import Path

INK = "#2b1a12"


def main() -> int:
    if len(sys.argv) != 2:
        print('Usage: python3 scripts/make_qr.py "https://example.com"')
        return 1

    try:
        import qrcode
        import qrcode.image.svg
    except ImportError:
        print("Missing dependency: qrcode. Install with: python3 -m pip install 'qrcode[pil]'")
        return 2

    url = sys.argv[1].strip()
    assets = Path(__file__).resolve().parents[1] / "assets"
    assets.mkdir(exist_ok=True)

    qr = qrcode.QRCode(version=None, error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=20, border=2)
    qr.add_data(url)
    qr.make(fit=True)

    svg = qr.make_image(image_factory=qrcode.image.svg.SvgPathImage).to_string(encoding="unicode")
    svg = svg.replace('fill="#000000"', f'fill="{INK}"')
    (assets / "qr.svg").write_text(svg, encoding="utf-8")

    try:
        qr.make_image(fill_color=INK, back_color="white").save(assets / "qr.png")
    except Exception as exc:  # Pillow missing is fine, SVG is what the ticket uses
        print(f"PNG skipped: {exc}")

    print(assets / "qr.svg")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
