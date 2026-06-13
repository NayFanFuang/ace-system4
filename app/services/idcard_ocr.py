"""Offline OCR for Thai national ID cards (Tesseract, tha+eng).

PII never leaves the server — the image is processed locally and not stored.
Returns best-effort structured fields; the applicant always reviews/corrects
them in the form. The 13-digit number is the most reliable; Thai names and
address are noisier, so we extract what we can and hand back the raw text too.
"""

from __future__ import annotations

import io
import re

import pytesseract
from PIL import Image, ImageChops, ImageFilter, ImageOps

OCR_LANG = "tha+eng"

_MONTHS = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
}


def _to_grayscale(data: bytes) -> Image.Image:
    img = Image.open(io.BytesIO(data))
    img = ImageOps.exif_transpose(img)          # honour phone rotation
    img = img.convert("L")                       # grayscale
    # Upscale small phone crops so glyphs are big enough for Tesseract
    w, h = img.size
    if max(w, h) < 1600:
        scale = 1600 / max(w, h)
        img = img.resize((int(w * scale), int(h * scale)))
    return ImageOps.autocontrast(img)


def _binarize(gray: Image.Image) -> Image.Image:
    """Adaptive (local-mean) black & white — handles uneven phone-photo lighting
    that a single global threshold (Tesseract's built-in Otsu) gets wrong.

    Text is darker than its local background: subtract a blurred 'background'
    estimate from the image; pixels close to the background go white, the
    darker glyph strokes go black. Pure Pillow, no numpy/OpenCV needed.
    """
    radius = max(3, gray.size[0] // 60)          # local window scales with image
    bg = gray.filter(ImageFilter.GaussianBlur(radius))
    diff = ImageChops.subtract(gray, bg, 1.0, 12)  # gray - bg + 12, clamped 0..255
    return diff.point(lambda v: 255 if v > 0 else 0, mode="L")


def _find_id_number(text: str) -> str:
    """The 13-digit citizen ID, usually printed as X XXXX XXXXX XX X."""
    # Collapse spaces/dashes between digits, then look for a 13-digit run.
    for m in re.finditer(r"(?:\d[\s\-]*){13}", text):
        digits = re.sub(r"\D", "", m.group(0))
        if len(digits) == 13:
            return digits
    return ""


def _parse_en_date(s: str) -> str:
    """'5 Mar. 1990' / '5 March 1990' -> '1990-03-05' (English/Gregorian side)."""
    m = re.search(r"(\d{1,2})\s*([A-Za-z]{3,9})\.?\s*(\d{4})", s)
    if not m:
        return ""
    day = int(m.group(1))
    mon = _MONTHS.get(m.group(2)[:3].lower())
    year = int(m.group(3))
    if not mon or not (1 <= day <= 31):
        return ""
    # Thai cards print the Gregorian year on the English line; guard against a
    # Buddhist-era number sneaking in (e.g. 2533 -> 1990).
    if year > 2200:
        year -= 543
    return f"{year:04d}-{mon:02d}-{day:02d}"


def _extract_name_en(lines: list[str]) -> tuple[str, str]:
    first = last = ""
    for ln in lines:
        low = ln.lower()
        if "last name" in low:
            last = re.sub(r".*last\s*name", "", ln, flags=re.I)
        elif "name" in low and not first:
            first = re.sub(r".*name", "", ln, flags=re.I)
    clean = lambda s: re.sub(r"^[\s:.\-]+", "", re.sub(r"(?i)\b(mr|mrs|miss|ms)\.?\b", "", s)).strip()
    return clean(first), clean(last)


def _parse_text(text: str) -> dict:
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    id_number = _find_id_number(text)
    first_en, last_en = _extract_name_en(lines)

    dob = expiry = ""
    for ln in lines:
        low = ln.lower()
        if "birth" in low and not dob:
            dob = _parse_en_date(ln)
        if "expiry" in low and not expiry:
            expiry = _parse_en_date(ln)
    if not dob:
        all_dates = [d for d in (_parse_en_date(ln) for ln in lines) if d]
        if all_dates:
            dob = min(all_dates)  # birth date is the earliest on the card

    full_name = " ".join(p for p in (first_en, last_en) if p).strip()
    return {
        "idCard": id_number,
        "fullName": full_name,
        "fullNameEn": full_name,
        "dob": dob,
        "idCardExpiry": expiry,
        "rawText": text.strip(),
    }


def _score(r: dict) -> int:
    """Prefer the pass that recovered more fields (a valid 13-digit ID counts double)."""
    return (2 if len(re.sub(r"\D", "", r.get("idCard") or "")) == 13 else 0) \
        + sum(1 for k in ("fullName", "dob", "idCardExpiry") if r.get(k))


def extract_idcard(data: bytes) -> dict:
    gray = _to_grayscale(data)
    # Two passes — grayscale (Tesseract's own Otsu) and adaptive black & white —
    # then keep whichever recovered the most fields. Can only help, never hurt.
    candidates = []
    for img in (gray, _binarize(gray)):
        try:
            candidates.append(_parse_text(pytesseract.image_to_string(img, lang=OCR_LANG)))
        except Exception:
            pass
    if not candidates:
        return {"idCard": "", "fullName": "", "fullNameEn": "", "dob": "", "idCardExpiry": "", "rawText": "", "ok": False}
    best = max(candidates, key=_score)
    best["ok"] = bool(best["idCard"] or best["fullName"] or best["dob"])
    return best
