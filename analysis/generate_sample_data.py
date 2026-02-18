"""Generate realistic fake spending data for development and testing.

Run: python -m analysis.generate_sample_data
"""

from __future__ import annotations

import math
import random
from datetime import date, timedelta
from pathlib import Path

import polars as pl

from analysis.schemas import CATEGORY_HIERARCHY

OUTPUT_DIR = Path("data_public")

# Reproducible randomness
SEED = 42
rng = random.Random(SEED)

# Time range: ~10 years of monthly data
START = date(2014, 1, 1)
END = date(2024, 12, 1)

# Life events
EVENTS = [
    {"event_id": 1, "label": "First Job", "start_date": date(2014, 1, 1), "end_date": date(2014, 1, 31), "type": "job"},
    {"event_id": 2, "label": "Job Change — Senior Role", "start_date": date(2017, 3, 1), "end_date": date(2017, 3, 31), "type": "job"},
    {"event_id": 3, "label": "Relocated to New City", "start_date": date(2019, 6, 1), "end_date": date(2019, 7, 31), "type": "move"},
    {"event_id": 4, "label": "Job Change — Lead Role", "start_date": date(2021, 9, 1), "end_date": date(2021, 9, 30), "type": "job"},
]

# Income steps (monthly, post-tax approximate)
INCOME_STEPS = [
    (date(2014, 1, 1), 4000),
    (date(2017, 3, 1), 5500),
    (date(2019, 6, 1), 5500),  # same income, higher cost of living after move
    (date(2021, 9, 1), 7500),
]


def _months_between(start: date, end: date) -> list[date]:
    """Generate first-of-month dates from start to end inclusive."""
    months = []
    current = start.replace(day=1)
    while current <= end:
        months.append(current)
        if current.month == 12:
            current = current.replace(year=current.year + 1, month=1)
        else:
            current = current.replace(month=current.month + 1)
    return months


def _get_income(month: date) -> float:
    """Get income for a given month based on step function."""
    income = INCOME_STEPS[0][1]
    for step_date, step_income in INCOME_STEPS:
        if month >= step_date:
            income = step_income
    return float(income)


def _seasonal_factor(month: date) -> float:
    """Seasonal spending multiplier (higher in Nov-Dec, lower in Jan-Feb)."""
    m = month.month
    return 1.0 + 0.15 * math.sin((m - 3) * math.pi / 6)


def _trend_factor(month: date) -> float:
    """Gradual upward lifestyle creep: ~2% per year compounding."""
    years_elapsed = (month - START).days / 365.25
    return 1.0 + 0.02 * years_elapsed


def _post_move_factor(month: date) -> float:
    """Higher cost of living after relocation."""
    if month >= date(2019, 6, 1):
        return 1.15
    return 1.0


# Base monthly amounts per L2 subcategory
BASE_AMOUNTS: dict[str, dict[str, float]] = {
    "Housing": {"Rent/Mortgage": 1200, "Utilities": 150, "Maintenance": 50},
    "Food": {"Groceries": 350, "Restaurants": 150, "Coffee Shops": 40},
    "Transportation": {"Gas": 100, "Public Transit": 50, "Car Maintenance": 30},
    "Healthcare": {"Insurance": 200, "Doctor Visits": 40, "Pharmacy": 25},
    "Entertainment": {"Streaming": 30, "Events": 60, "Hobbies": 40},
    "Shopping": {"Clothing": 80, "Electronics": 50, "Home Goods": 40},
    "Travel": {"Flights": 50, "Hotels": 40, "Activities": 25},
    "Education": {"Courses": 30, "Books": 15},
    "Personal Care": {"Gym": 40, "Grooming": 25},
    "Subscriptions": {"Software": 20, "Media": 15, "Memberships": 10},
}


def generate_spend_data() -> pl.DataFrame:
    """Generate monthly spending by category."""
    months = _months_between(START, END)
    rows = []

    for month in months:
        seasonal = _seasonal_factor(month)
        trend = _trend_factor(month)
        move = _post_move_factor(month)

        for l1, subcats in CATEGORY_HIERARCHY.items():
            for l2 in subcats:
                base = BASE_AMOUNTS[l1][l2]
                amount = base * seasonal * trend * move

                # Add noise (±20%)
                noise = 1.0 + rng.uniform(-0.20, 0.20)
                amount *= noise

                # Travel is lumpy — zero most months, big spikes occasionally
                if l1 == "Travel":
                    if rng.random() > 0.25:  # 75% chance of no travel spend
                        amount = 0.0
                    else:
                        amount *= rng.uniform(2.0, 5.0)

                rows.append({
                    "month": month,
                    "category_l1": l1,
                    "category_l2": l2,
                    "amount": round(amount, 2),
                })

    return pl.DataFrame(rows).cast({"month": pl.Date})


def generate_income_data() -> pl.DataFrame:
    """Generate monthly income."""
    months = _months_between(START, END)
    rows = []
    for month in months:
        base = _get_income(month)
        noise = 1.0 + rng.uniform(-0.03, 0.03)
        rows.append({
            "month": month,
            "income_amount": round(base * noise, 2),
        })
    return pl.DataFrame(rows).cast({"month": pl.Date})


def generate_events_data() -> pl.DataFrame:
    """Generate life events table."""
    return pl.DataFrame(EVENTS).cast({
        "start_date": pl.Date,
        "end_date": pl.Date,
    })


def main() -> None:
    OUTPUT_DIR.mkdir(exist_ok=True)

    spend = generate_spend_data()
    income = generate_income_data()
    events = generate_events_data()

    spend.write_parquet(OUTPUT_DIR / "spend_monthly_category.parquet")
    income.write_parquet(OUTPUT_DIR / "income_monthly.parquet")
    events.write_parquet(OUTPUT_DIR / "events_public.parquet")

    print(f"Generated {len(spend)} spend rows, {len(income)} income rows, {len(events)} events")
    print(f"Output: {OUTPUT_DIR}/")


if __name__ == "__main__":
    main()
