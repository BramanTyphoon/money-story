"""Schema definitions for the 3 public Parquet tables."""

import polars as pl

# --- Shared flow schema (used by both expenses and income) ---

FLOW_SCHEMA = {
    "date": pl.Date,
    "flow_type": pl.String,
    "source": pl.String,
    "destination": pl.String,
    "sub_category": pl.String,
    "category": pl.String,
    "value": pl.Float64,
}

FLOW_COLUMNS = list(FLOW_SCHEMA.keys())

FLOW_GROUP_COLUMNS = ["date", "flow_type", "source", "destination", "sub_category", "category"]

# --- Expense categorical values ---

EXPENSE_SOURCE_VALUES = ["General Funds", "Savings"]

EXPENSE_DESTINATION_VALUES = [
    "Children",
    "Clothing",
    "Entertainment",
    "Food",
    "Gifts/Charity",
    "Healthcare/Insurance",
    "Housing",
    "Miscellaneous",
    "Savings",
    "Transportation",
    "Travel",
    "Unknown",
]

EXPENSE_CATEGORY_VALUES = [
    "Children",
    "Clothing",
    "Entertainment",
    "Food",
    "Gifts/Charity",
    "Healthcare/Insurance",
    "Housing",
    "Miscellaneous",
    "Savings/Investments",
    "Transportation",
    "Travel",
    "Unknown",
]

EXPENSE_SUB_CATEGORY_VALUES = [
    "Car/Car Maintenance",
    "Charity",
    "Child Education/Childcare",
    "Clothing",
    "Dining Out",
    "Entertainment",
    "Gifts",
    "Groceries",
    "Healthcare/Insurance",
    "Hobbies",
    "Home Maintenance/Improvement",
    "Household Goods",
    "Media/Subscriptions",
    "Miscellaneous",
    "Parent Enrichment/Education",
    "Rent/Mortgage",
    "Savings/Investments",
    "Sports/Outdoors",
    "Transfer between accounts",
    "Transportation",
    "Travel",
    "Unknown",
    "Utilities",
]

# --- Income categorical values ---

INCOME_SOURCE_VALUES = ["Miscellaneous Income", "Reimbursements", "Salary/Wages"]

INCOME_DESTINATION_VALUES = ["General Funds", "Savings"]

INCOME_CATEGORY_VALUES = [
    "Miscellaneous Income",
    "Reimbursements",
    "Salary/Wages",
    "Transfer between accounts",
]

INCOME_SUB_CATEGORY_VALUES = [
    "Gift Income",
    "Interest/Dividends",
    "Refunds/Rebates",
    "Salary/Wages",
    "Side Hustle (e.g. Juku)",
    "Transfer between accounts",
    "Unknown Income",
]

# --- Events schema ---

EVENT_SCHEMA = {
    "date_start": pl.Date,
    "date_end": pl.Date,
    "event": pl.String,
    "type": pl.String,
}

EVENT_TYPE_VALUES = ["career", "education", "family", "move"]
