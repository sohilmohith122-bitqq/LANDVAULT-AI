"""Value normalization — original values are ALWAYS preserved upstream; these produce the *_normalized fields.

Rules are conservative and auditable: whitespace collapse, case folding for latin, punctuation
padding. Tamil text is never transliterated or case-folded (no uppercase concept) — only trimmed.
"""

import re
import unicodedata

_MULTI_SPACE = re.compile(r"\s+")


def normalize_owner_name(original: str | None) -> str | None:
    """owner_name_original → owner_name_normalized (never mutates the original)."""
    if original is None:
        return None
    cleaned = unicodedata.normalize("NFC", original.strip())
    cleaned = _MULTI_SPACE.sub(" ", cleaned)
    # Fold latin to upper (common in extracts); Tamil has no case and passes through.
    cleaned = "".join(c.upper() if "LATIN" in unicodedata.name(c, "") else c for c in cleaned)
    return cleaned or None


def normalize_survey_number(survey: str | None) -> str | None:
    """'124/2a', '124 / 2A' → '124/2A' (separators unified, subdivision case-folded)."""
    if survey is None:
        return None
    cleaned = _MULTI_SPACE.sub("", unicodedata.normalize("NFC", survey.strip()))
    parts = re.split(r"[/\-]", cleaned)
    parts = [p.upper() if any("LATIN" in unicodedata.name(c, "") for c in p) else p for p in parts if p]
    return "/".join(parts) or None


def normalize_extent(value: str | None) -> tuple[float | None, str | None]:
    """'2.50 Acres', '2,50 Hectare' → (2.50, 'Acre'). Unit singularized; unknown → None."""
    if value is None or not value.strip():
        return None, None
    text = unicodedata.normalize("NFC", value.strip())
    match = re.match(r"^([0-9]+(?:[.,][0-9]+)?)\s*(.*)$", text)
    if not match:
        return None, None
    raw_number, raw_unit = match.group(1).replace(",", "."), match.group(2).strip().rstrip(".")
    number: float | None = None
    try:
        number = float(raw_number)
    except ValueError:
        return None, None
    unit_map = {
        "acre": "Acre", "acres": "Acre", "hectare": "Hectare", "hectares": "Hectare",
        "ha": "Hectare", "are": "Are", "ares": "Are", "sq.m": "Sq.m", "sqm": "Sq.m",
        "cent": "Cent", "cents": "Cent", "ground": "Ground", "grounds": "Ground",
    }
    unit = unit_map.get(raw_unit.lower()) if raw_unit else None
    return number, unit


def file_sha256(path) -> str:
    """SHA-256 of any original file (FMB/scans) — tamper-evident preservation."""
    digest = hashlib_sha256_file(path)
    return digest


def hashlib_sha256_file(path, chunk_size: int = 1 << 20) -> str:
    import hashlib

    h = hashlib.sha256()
    with open(path, "rb") as fh:
        while chunk := fh.read(chunk_size):
            h.update(chunk)
    return h.hexdigest()
