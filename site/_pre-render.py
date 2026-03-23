"""Pre-render script: ensure the data_public symlink exists and files are
copied to _site for the browser to fetch."""

import shutil
from pathlib import Path

site_dir = Path(__file__).parent

# Symlink for Python cells at render time
link = site_dir / "data_public"
target = Path("../data_public")

if not link.is_symlink() and not link.exists():
    link.symlink_to(target)
    print(f"Created symlink: {link} -> {target}")

# Copy Parquet files to _site/data_public/ for browser fetch
output_dir = site_dir / "_site" / "data_public"
output_dir.mkdir(parents=True, exist_ok=True)

source_dir = link.resolve()
for f in source_dir.glob("*.parquet"):
    dest = output_dir / f.name
    if not dest.exists() or f.stat().st_mtime > dest.stat().st_mtime:
        shutil.copy2(f, dest)
        print(f"Copied {f.name} to _site/data_public/")
