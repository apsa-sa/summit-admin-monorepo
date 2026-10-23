# © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
"""Independent Poppler checks of real synthetic Chromium outputs; no Python packages."""
from __future__ import annotations
import hashlib
import json
import re
import subprocess
from pathlib import Path
from xml.etree import ElementTree


class PdfOutputContract:
    def command(self, *arguments: str) -> str:
        return subprocess.check_output(arguments, text=True, timeout=30)

    def inspect(self, path: Path, locale: str, multipage: bool) -> dict:
        if path.is_symlink() or not path.is_file() or not 1000 < path.stat().st_size < 16_000_000:
            raise ValueError("Missing or invalid owned PDF artifact")
        info = self.command("pdfinfo", str(path))
        for key, value in [("Tagged", "yes"), ("JavaScript", "no"), ("Encrypted", "no")]:
            if not re.search(rf"^{key}:\s+{value}\s*$", info, re.MULTILINE):
                raise ValueError(f"Unexpected PDF {key}: {path.name}")
        count = re.search(r"^Pages:\s+(\d+)", info, re.MULTILINE)
        if count is None:
            raise ValueError("Missing page count")
        pages = int(count[1])
        if pages < (2 if multipage else 1):
            raise ValueError("Missing PDF pages")
        fonts = self.command("pdffonts", str(path))
        noto = [line for line in fonts.splitlines()[2:] if "NotoSansArabic" in line]
        if not noto or any(not re.search(r"\byes\s+yes\s+yes\s+\d+\s+\d+\s*$", line) for line in noto):
            raise ValueError("Required embedded/subset/Unicode Arabic fonts missing")
        text = self.command("pdftotext", "-layout", str(path), "-")
        chunks = [part for part in text.split("\f") if part.strip()]
        header = "الحالة" if locale == "ar" else "Status"
        if len(chunks) != pages or any(header not in part for part in chunks):
            raise ValueError("Table header missing from a printed page")
        records = None
        if multipage:
            identifiers = [int(value) for value in re.findall(r"synthetic-(\d+)@example\.test", text)]
            if sorted(identifiers) != list(range(1, 102)):
                raise ValueError("Missing, duplicated or truncated synthetic record")
            records = len(identifiers)
        boxes = ElementTree.fromstring(self.command("pdftotext", "-bbox", str(path), "-"))
        bounded_pages = list(boxes.iter("{http://www.w3.org/1999/xhtml}page"))
        if len(bounded_pages) != pages:
            raise ValueError("Independent bounding-box parser lost pages")
        for page in bounded_pages:
            width, height = float(page.attrib["width"]), float(page.attrib["height"])
            words = list(page.iter("{http://www.w3.org/1999/xhtml}word"))
            if not words:
                raise ValueError("Missing extractable text on a printed page")
            for word in words:
                if not (-0.5 <= float(word.attrib["xMin"]) <= float(word.attrib["xMax"]) <= width + 0.5
                        and -0.5 <= float(word.attrib["yMin"]) <= float(word.attrib["yMax"]) <= height + 0.5):
                    raise ValueError("Printed text outside page bounds")
        return {"file": path.name, "pages": pages, "synthetic_records": records,
                "embedded_arabic_font_faces": len(noto), "sha256": hashlib.sha256(path.read_bytes()).hexdigest()}

    def run(self) -> None:
        root = Path(__file__).resolve().parents[2]
        directory = root / "test-results"
        results = []
        for locale in ["ar", "en"]:
            results.append(self.inspect(directory / f"pdf-layout-{locale}.pdf", locale, True))
            for theme in ["light", "dark"]:
                results.append(self.inspect(directory / f"users-{locale}-{theme}.pdf", locale, False))
        tool = subprocess.run(["pdftotext", "-v"], capture_output=True, text=True, check=True, timeout=10)
        version = (tool.stdout + tool.stderr).splitlines()[0]
        report = {"status": "PASS", "parser": version, "outputs": results,
                  "limitation": "Content/fonts/bounds checks complement direct raster visual review; not PDF/UA or security certification."}
        (directory / "pdf-output-contract.json").write_text(json.dumps(report, indent=2) + "\n")
        print(f"Independent PDF contract: {len(results)} actual outputs PASS; complete 101-row bilingual multipage data, fonts, headers and bounds.")


if __name__ == "__main__":
    PdfOutputContract().run()
