"""Create a clean submission ZIP for the FUPRE Campus Marketplace (project 3).

Usage (from the project root, Git Bash or cmd):

    python package.py

The archive is written next to the project folder so it does not include
itself. Generated and machine-specific directories (virtualenv, node_modules,
build output, local database, uploads, caches) are excluded. Secrets (.env)
are excluded; .env.example is included.
"""

from pathlib import Path
import sys
import zipfile

ROOT = Path(__file__).resolve().parent
OUT = ROOT.parent / "FUPRE_Campus_Marketplace_Project3.zip"
PREFIX = "fupre-campus-marketplace"

EXCLUDE_DIRS = {
    "venv", ".venv", "node_modules", "dist", ".vite", "__pycache__",
    ".pytest_cache", "media", "htmlcov", ".git", ".idea", ".vscode",
    "tools",  # portable PostgreSQL binaries and data (setup_postgres.sh)
}
EXCLUDE_NAMES = {".env", ".env.local", "Thumbs.db", ".DS_Store"}
EXCLUDE_SUFFIXES = (".pyc", ".pyo", ".sqlite3")


def included(path: Path, rel: Path) -> bool:
    if any(part in EXCLUDE_DIRS for part in rel.parts):
        return False
    if rel.name in EXCLUDE_NAMES:
        return False
    if rel.name.endswith(EXCLUDE_SUFFIXES):
        return False
    return path.is_file()


def main() -> int:
    if OUT.exists():
        OUT.unlink()

    files = []
    for path in sorted(ROOT.rglob("*")):
        rel = path.relative_to(ROOT)
        if rel.as_posix() == "package.py":
            continue
        if included(path, rel):
            files.append((path, rel))

    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as archive:
        for path, rel in files:
            archive.write(path, f"{PREFIX}/{rel.as_posix()}")

    size_mb = OUT.stat().st_size / (1024 * 1024)
    print(f"Created {OUT}")
    print(f"{len(files)} files, {size_mb:.2f} MB")
    print("Excluded: venv, node_modules, dist, db.sqlite3, media, caches, .env")
    return 0


if __name__ == "__main__":
    sys.exit(main())
