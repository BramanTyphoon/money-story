"""Pre-render script: ensure the data_public symlink exists."""

from pathlib import Path

link = Path(__file__).parent / "data_public"
target = Path("../../data_public")

if not link.is_symlink() and not link.exists():
    link.symlink_to(target)
    print(f"Created symlink: {link} -> {target}")
