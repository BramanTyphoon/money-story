"""Column definitions for public Parquet tables."""

import polars as pl

SPEND_MONTHLY_CATEGORY_SCHEMA = {
    "month": pl.Date,
    "category_l1": pl.Utf8,
    "category_l2": pl.Utf8,
    "amount": pl.Float64,
}

INCOME_MONTHLY_SCHEMA = {
    "month": pl.Date,
    "income_amount": pl.Float64,
}

EVENTS_PUBLIC_SCHEMA = {
    "event_id": pl.Int32,
    "label": pl.Utf8,
    "start_date": pl.Date,
    "end_date": pl.Date,
    "type": pl.Utf8,
}

# Category hierarchy used by sample data generator
CATEGORY_HIERARCHY: dict[str, list[str]] = {
    "Housing": ["Rent/Mortgage", "Utilities", "Maintenance"],
    "Food": ["Groceries", "Restaurants", "Coffee Shops"],
    "Transportation": ["Gas", "Public Transit", "Car Maintenance"],
    "Healthcare": ["Insurance", "Doctor Visits", "Pharmacy"],
    "Entertainment": ["Streaming", "Events", "Hobbies"],
    "Shopping": ["Clothing", "Electronics", "Home Goods"],
    "Travel": ["Flights", "Hotels", "Activities"],
    "Education": ["Courses", "Books"],
    "Personal Care": ["Gym", "Grooming"],
    "Subscriptions": ["Software", "Media", "Memberships"],
}
