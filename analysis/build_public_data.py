"""Aggregate private income/expenses data for public consumption.

Reads the private transaction parquet, applies a random scale factor for
privacy, aggregates by month and flow dimensions, and writes 3 public
parquet files plus a hardcoded life-events table.

Usage:
    python -m analysis.build_public_data
"""

import sys
from datetime import date
from pathlib import Path

import polars as pl
from numpy.random import default_rng

from analysis.schemas import EVENT_SCHEMA, FLOW_COLUMNS, FLOW_GROUP_COLUMNS

PRIVATE_SOURCE = Path("data_private") / "categorized_budget_items_formatted.parquet"
OUTPUT_DIR = Path("data_public")

LIFE_EVENTS = [
    {
        "date_start": date(2009, 10, 1),
        "date_end": date(2010, 6, 30),
        "event": "Teaching in Japan",
        "type": "career",
    },
    {
        "date_start": date(2010, 8, 1),
        "date_end": date(2010, 10, 1),
        "event": "Moved to Singapore, started new job",
        "type": "career",
    },
    {
        "date_start": date(2011, 11, 1),
        "date_end": date(2011, 11, 30),
        "event": "Married",
        "type": "family",
    },
    {
        "date_start": date(2013, 1, 1),
        "date_end": date(2014, 9, 30),
        "event": "Masters degree",
        "type": "education",
    },
    {
        "date_start": date(2015, 1, 1),
        "date_end": date(2019, 12, 1),
        "event": "Moved to USA, began PhD",
        "type": "education",
    },
    {
        "date_start": date(2015, 4, 1),
        "date_end": date(2015, 5, 31),
        "event": "Birth of child #1",
        "type": "family",
    },
    {
        "date_start": date(2018, 7, 1),
        "date_end": date(2018, 8, 31),
        "event": "Birth of child #2",
        "type": "family",
    },
    {
        "date_start": date(2020, 1, 1),
        "date_end": date(2020, 3, 31),
        "event": "Data Science Fellowship",
        "type": "career",
    },
    {
        "date_start": date(2020, 8, 1),
        "date_end": date(2020, 8, 31),
        "event": "Began at INFICON",
        "type": "career",
    },
    {
        "date_start": date(2020, 12, 1),
        "date_end": date(2020, 12, 31),
        "event": "Swapped rent/childcare costs with partner",
        "type": "family",
    },
]


def build() -> None:
    if not PRIVATE_SOURCE.exists():
        print(f"Error: Private data file not found: {PRIVATE_SOURCE}", file=sys.stderr)
        sys.exit(1)

    rng = default_rng()

    df = pl.read_parquet(PRIVATE_SOURCE)
    df = df.filter(pl.col("date") <= pl.datetime(2022, 11, 30))
    scale_factor = rng.uniform(0.5, 2.0)
    df = df.with_columns((pl.col("value") * scale_factor).alias("value"))

    df_expenses = (
        df.filter(pl.col("flow_type") == "Expense")
        .select(FLOW_COLUMNS)
        .group_by(FLOW_GROUP_COLUMNS)
        .sum()
    )
    df_income = (
        df.filter(pl.col("flow_type") == "Income")
        .select(FLOW_COLUMNS)
        .group_by(FLOW_GROUP_COLUMNS)
        .sum()
    )

    OUTPUT_DIR.mkdir(exist_ok=True)
    df_expenses.write_parquet(OUTPUT_DIR / "expenses_monthly.parquet")
    df_income.write_parquet(OUTPUT_DIR / "income_monthly.parquet")

    life_event_df = pl.DataFrame(LIFE_EVENTS, schema=EVENT_SCHEMA)
    life_event_df.write_parquet(OUTPUT_DIR / "events_public.parquet")

    print(
        f"Wrote {len(df_expenses)} expense rows, {len(df_income)} income rows, {len(life_event_df)} events"
    )


if __name__ == "__main__":
    build()
