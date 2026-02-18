"""Chart functions for static story pages.

Each function returns a plotly.graph_objects.Figure that Quarto renders
inline when called from a .qmd Python code block.
"""

from __future__ import annotations

from pathlib import Path

import plotly.graph_objects as go
import polars as pl

DATA_DIR = Path("data_public")

# Consistent color palette
COLORS = [
    "#636EFA", "#EF553B", "#00CC96", "#AB63FA", "#FFA15A",
    "#19D3F3", "#FF6692", "#B6E880", "#FF97FF", "#FECB52",
]


def _load_spend() -> pl.DataFrame:
    return pl.read_parquet(DATA_DIR / "spend_monthly_category.parquet")


def _load_income() -> pl.DataFrame:
    return pl.read_parquet(DATA_DIR / "income_monthly.parquet")


def _load_events() -> pl.DataFrame:
    return pl.read_parquet(DATA_DIR / "events_public.parquet")


def _add_event_annotations(fig: go.Figure, events: pl.DataFrame) -> None:
    """Add semi-transparent vertical rectangles for life events."""
    for row in events.iter_rows(named=True):
        fig.add_vrect(
            x0=row["start_date"],
            x1=row["end_date"],
            fillcolor="gray",
            opacity=0.15,
            line_width=0,
            annotation_text=row["label"],
            annotation_position="top left",
            annotation_font_size=10,
        )


def _responsive_layout(title: str, yaxis_title: str = "Amount ($)") -> dict:
    """Common layout settings for responsive charts."""
    return dict(
        title=title,
        xaxis_title="Month",
        yaxis_title=yaxis_title,
        autosize=True,
        template="plotly_white",
        hovermode="x unified",
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        margin=dict(l=60, r=20, t=60, b=40),
    )


def lifestyle_creep_total_spend() -> go.Figure:
    """Monthly total spending with 6-month rolling average + event annotations."""
    spend = _load_spend()
    events = _load_events()

    monthly = (
        spend
        .group_by("month")
        .agg(pl.col("amount").sum().alias("total"))
        .sort("month")
    )

    # Rolling average
    monthly = monthly.with_columns(
        pl.col("total").rolling_mean(window_size=6).alias("rolling_avg")
    )

    fig = go.Figure()

    fig.add_trace(go.Scatter(
        x=monthly["month"].to_list(),
        y=monthly["total"].to_list(),
        mode="lines",
        name="Monthly Total",
        line=dict(color=COLORS[0], width=1),
        opacity=0.5,
    ))

    fig.add_trace(go.Scatter(
        x=monthly["month"].to_list(),
        y=monthly["rolling_avg"].to_list(),
        mode="lines",
        name="6-Month Rolling Avg",
        line=dict(color=COLORS[1], width=2.5),
    ))

    _add_event_annotations(fig, events)
    fig.update_layout(**_responsive_layout("Total Monthly Spending Over Time"))

    return fig


def lifestyle_creep_by_category() -> go.Figure:
    """Stacked area chart of top categories over time."""
    spend = _load_spend()
    events = _load_events()

    by_cat = (
        spend
        .group_by("month", "category_l1")
        .agg(pl.col("amount").sum().alias("total"))
        .sort("month")
    )

    # Get top 8 categories by total spend
    top_cats = (
        by_cat
        .group_by("category_l1")
        .agg(pl.col("total").sum())
        .sort("total", descending=True)
        .head(8)["category_l1"]
        .to_list()
    )

    fig = go.Figure()

    for i, cat in enumerate(top_cats):
        cat_data = by_cat.filter(pl.col("category_l1") == cat).sort("month")
        fig.add_trace(go.Scatter(
            x=cat_data["month"].to_list(),
            y=cat_data["total"].to_list(),
            mode="lines",
            name=cat,
            stackgroup="one",
            line=dict(color=COLORS[i % len(COLORS)]),
        ))

    _add_event_annotations(fig, events)
    fig.update_layout(**_responsive_layout("Spending by Category (Stacked)"))

    return fig


def income_vs_spend_over_time() -> go.Figure:
    """Overlaid income and total spending lines."""
    spend = _load_spend()
    income = _load_income()
    events = _load_events()

    monthly_spend = (
        spend
        .group_by("month")
        .agg(pl.col("amount").sum().alias("total_spend"))
        .sort("month")
    )

    merged = monthly_spend.join(income, on="month", how="inner").sort("month")

    # Savings
    merged = merged.with_columns(
        (pl.col("income_amount") - pl.col("total_spend")).alias("savings")
    )

    fig = go.Figure()

    fig.add_trace(go.Scatter(
        x=merged["month"].to_list(),
        y=merged["income_amount"].to_list(),
        mode="lines",
        name="Income",
        line=dict(color="#00CC96", width=2),
    ))

    fig.add_trace(go.Scatter(
        x=merged["month"].to_list(),
        y=merged["total_spend"].to_list(),
        mode="lines",
        name="Total Spending",
        line=dict(color="#EF553B", width=2),
    ))

    fig.add_trace(go.Bar(
        x=merged["month"].to_list(),
        y=merged["savings"].to_list(),
        name="Savings",
        marker_color=merged["savings"].to_list(),
        marker_colorscale=[[0, "#EF553B"], [0.5, "#FECB52"], [1, "#00CC96"]],
        opacity=0.3,
    ))

    _add_event_annotations(fig, events)
    fig.update_layout(**_responsive_layout("Income vs. Spending"))

    return fig


def spend_around_job_change() -> go.Figure:
    """Compare spending in 6-month windows before/after each job change."""
    spend = _load_spend()
    events = _load_events().filter(pl.col("type") == "job")

    monthly = (
        spend
        .group_by("month")
        .agg(pl.col("amount").sum().alias("total"))
        .sort("month")
    )

    fig = go.Figure()

    for i, event in enumerate(events.iter_rows(named=True)):
        event_date = event["start_date"]
        window_start = event_date.replace(day=1) - pl.duration(days=180)
        window_end = event_date.replace(day=1) + pl.duration(days=180)

        # Use timedelta for date arithmetic
        from datetime import timedelta
        ws = event_date - timedelta(days=180)
        we = event_date + timedelta(days=180)

        window_data = monthly.filter(
            (pl.col("month") >= ws) & (pl.col("month") <= we)
        ).sort("month")

        # Relative months from event
        months_relative = [
            (d.year - event_date.year) * 12 + (d.month - event_date.month)
            for d in window_data["month"].to_list()
        ]

        fig.add_trace(go.Scatter(
            x=months_relative,
            y=window_data["total"].to_list(),
            mode="lines+markers",
            name=event["label"],
            line=dict(color=COLORS[i % len(COLORS)], width=2),
        ))

    fig.add_vline(x=0, line_dash="dash", line_color="gray",
                  annotation_text="Event", annotation_position="top")

    fig.update_layout(**_responsive_layout(
        "Spending Around Job Changes",
        yaxis_title="Monthly Spend ($)",
    ))
    fig.update_xaxes(title_text="Months Relative to Event")

    return fig


def category_shift_at_events() -> go.Figure:
    """Grouped bar chart: category mix 6 months before vs after each job change."""
    spend = _load_spend()
    events = _load_events().filter(pl.col("type") == "job")

    from datetime import timedelta

    fig = go.Figure()

    # Use the most recent job change for clarity
    latest_event = events.sort("start_date", descending=True).row(0, named=True)
    event_date = latest_event["start_date"]

    before_start = event_date - timedelta(days=180)
    after_end = event_date + timedelta(days=180)

    before = (
        spend
        .filter((pl.col("month") >= before_start) & (pl.col("month") < event_date))
        .group_by("category_l1")
        .agg(pl.col("amount").mean().alias("avg_before"))
    )

    after = (
        spend
        .filter((pl.col("month") >= event_date) & (pl.col("month") <= after_end))
        .group_by("category_l1")
        .agg(pl.col("amount").mean().alias("avg_after"))
    )

    merged = before.join(after, on="category_l1", how="outer_coalesce").sort("category_l1")

    cats = merged["category_l1"].to_list()
    fig.add_trace(go.Bar(
        x=cats,
        y=merged["avg_before"].to_list(),
        name="6 Months Before",
        marker_color=COLORS[0],
    ))
    fig.add_trace(go.Bar(
        x=cats,
        y=merged["avg_after"].to_list(),
        name="6 Months After",
        marker_color=COLORS[1],
    ))

    fig.update_layout(
        barmode="group",
        **_responsive_layout(
            f"Category Shift: {latest_event['label']}",
            yaxis_title="Avg Monthly Spend ($)",
        ),
    )

    return fig
