"""Build public aggregated Parquet files from private transaction data.

Run: python -m analysis.build_public_data

Exits cleanly if no private data directory exists, allowing CI to work
with pre-committed or sample data.
"""

from __future__ import annotations

from pathlib import Path

PRIVATE_DIR = Path("data_private")
PUBLIC_DIR = Path("data_public")


def main() -> None:
    if not PRIVATE_DIR.exists():
        print(f"No private data directory found at {PRIVATE_DIR}/")
        print("Skipping build — using existing data_public/ files.")
        return

    # Placeholder: implement aggregation pipeline when private data is available.
    # Expected steps:
    # 1. Read raw transactions from data_private/
    # 2. Aggregate to monthly category totals
    # 3. Extract income rows
    # 4. Build events table
    # 5. Write to data_public/*.parquet
    print("Private data found — aggregation pipeline not yet implemented.")
    print("Use 'python -m analysis.generate_sample_data' to generate sample data.")


if __name__ == "__main__":
    main()
