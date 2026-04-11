"""Story chart generation functions.

Two charts for the narrative page:
- Total monthly income over time
- Total monthly expenditures over time

Both annotated with life-event vertical regions.
"""

from pathlib import Path

import numpy as np
import polars as pl
import plotly.graph_objects as go

_DATA_DIR = Path(__file__).resolve().parent.parent / "data_public"

EVENT_COLORS = {
    "career": "rgba(31, 119, 180, 0.15)",
    "move": "rgba(255, 127, 14, 0.15)",
    "family": "rgba(44, 160, 44, 0.15)",
    "education": "rgba(148, 103, 189, 0.15)",
}

EVENT_LINE_COLORS = {
    "career": "rgba(31, 119, 180, 0.4)",
    "move": "rgba(255, 127, 14, 0.4)",
    "family": "rgba(44, 160, 44, 0.4)",
    "education": "rgba(148, 103, 189, 0.4)",
}


def _add_event_annotations(
    fig: go.Figure,
    events_path: str | Path = _DATA_DIR / "events_public.parquet",
) -> None:
    """Add life-event vrect annotations to a figure."""
    events = pl.read_parquet(events_path)

    for row in events.sort("date_start").iter_rows(named=True):
        event_type = row["type"]
        fig.add_vrect(
            x0=row["date_start"],
            x1=row["date_end"],
            fillcolor=EVENT_COLORS.get(event_type, "rgba(128,128,128,0.15)"),
            line=dict(
                color=EVENT_LINE_COLORS.get(event_type, "rgba(128,128,128,0.4)"),
                width=1,
            ),
            annotation_text=row["event"],
            annotation_position="top left",
            annotation_font_size=11,
            annotation_textangle=-90,
        )


def plot_income_over_time(
    income_path: str | Path = _DATA_DIR / "income_monthly.parquet",
    events_path: str | Path = _DATA_DIR / "events_public.parquet",
) -> go.Figure:
    """Plot total monthly income over time with life-event annotations."""
    df = pl.read_parquet(income_path)

    monthly = (
        df.group_by("date").agg(pl.col("value").sum().abs().alias("total")).sort("date")
    )

    dates = monthly["date"].to_list()
    values = monthly["total"].to_list()
    rolling = monthly.with_columns(
        pl.col("total")
        .rolling_mean(window_size=7, min_periods=1, center=True)
        .alias("rolling")
    )["rolling"].to_list()

    fig = go.Figure()
    fig.add_trace(
        go.Scatter(
            x=dates,
            y=values,
            mode="lines",
            name="Monthly Income",
            line=dict(color="rgba(44, 160, 44, 0.4)", width=1),
        )
    )
    fig.add_trace(
        go.Scatter(
            x=dates,
            y=rolling,
            mode="lines",
            name="7-Month Average",
            line=dict(color="rgba(44, 160, 44, 1)", width=3),
        )
    )

    _add_event_annotations(fig, events_path)

    fig.update_layout(
        xaxis_title="Date",
        yaxis_title="Monthly Income (USD, scaled)",
        hovermode="x unified",
        template="plotly_white",
        width=1100,
        height=500,
    )

    return fig


def _filter_expenses(df: pl.DataFrame) -> pl.DataFrame:
    """Apply standard expense filters (exclude savings, investments, transfers)."""
    return df.filter(
        ~pl.col("sub_category").is_in(
            ["Savings/Investments", "Transfer between accounts"]
        )
    ).filter(pl.col("destination") != "Savings")


def get_expenses_by_category(
    expenses_path: str | Path = _DATA_DIR / "expenses_monthly.parquet",
) -> list[dict]:
    """Return per-category monthly expense totals as a list of dicts for ojs_define()."""
    df = _filter_expenses(pl.read_parquet(expenses_path))

    monthly = (
        df.group_by("date", "category")
        .agg(pl.col("value").sum().alias("value"))
        .sort("date", "category")
    )

    return [
        {
            "date": row["date"].isoformat(),
            "category": row["category"],
            "value": row["value"],
        }
        for row in monthly.iter_rows(named=True)
    ]


def get_events(
    events_path: str | Path = _DATA_DIR / "events_public.parquet",
) -> list[dict]:
    """Return life events as a list of dicts for ojs_define()."""
    events = pl.read_parquet(events_path)
    return [
        {
            "date_start": row["date_start"].isoformat(),
            "date_end": row["date_end"].isoformat(),
            "event": row["event"],
            "type": row["type"],
        }
        for row in events.sort("date_start").iter_rows(named=True)
    ]


def bounded_cumsum(
    series: pl.Series, lower: float = -np.inf, upper: float = np.inf
) -> pl.Series:
    values = series.to_numpy()
    out = np.empty_like(values)
    curr = 0
    for i, x in enumerate(values):
        curr = max(lower, min(upper, curr + x))
        out[i] = curr
    return pl.Series(out)


def plot_savings_over_time(
    expenses_path: str | Path = _DATA_DIR / "expenses_monthly.parquet",
    income_path: str | Path = _DATA_DIR / "income_monthly.parquet",
    events_path: str | Path = _DATA_DIR / "events_public.parquet",
) -> go.Figure:
    """Plot cumulative savings accumulation over time with life-event annotations."""
    df = pl.concat([pl.read_parquet(expenses_path), pl.read_parquet(income_path)])

    savings = (
        df.with_columns(
            pl.when(
                (pl.col("source") == "Savings")
                & (pl.col("sub_category") != "Savings/Investments")
                & (pl.col("sub_category") != "Transfer between accounts")
            )
            .then(-pl.col("value"))
            .otherwise(
                pl.when(pl.col("destination") == "Savings")
                .then(pl.col("value"))
                .otherwise(-pl.col("value"))
            )
            .alias("signed_value")
        )
        .group_by("date")
        .agg(pl.col("signed_value").sum().alias("net"))
        .sort("date")
        .with_columns(
            pl.col("net")
            .map_batches(lambda x: bounded_cumsum(x, lower=0))
            .alias("cumulative")
        )
    )

    dates = savings["date"].to_list()
    cumulative = savings["cumulative"].to_list()

    fig = go.Figure()
    fig.add_trace(
        go.Scatter(
            x=dates,
            y=cumulative,
            mode="lines",
            name="Cumulative Savings",
            line=dict(color="rgba(31, 119, 180, 1)", width=2),
        )
    )

    _add_event_annotations(fig, events_path)

    fig.update_layout(
        xaxis_title="Date",
        yaxis_title="Cumulative Savings (USD, scaled)",
        hovermode="x unified",
        template="plotly_white",
        width=1100,
        height=500,
    )

    return fig


def plot_expenses_over_time(
    expenses_path: str | Path = _DATA_DIR / "expenses_monthly.parquet",
    events_path: str | Path = _DATA_DIR / "events_public.parquet",
    exclude_categories: list[str] | None = None,
    title: str = "",
) -> go.Figure:
    """Plot total monthly expenditures over time with life-event annotations.

    Parameters
    ----------
    exclude_categories : list[str] | None
        Category values (from the ``category`` column) to exclude from the
        aggregation.  Applied *after* the standard savings/transfer filter.
    title : str
        Chart title.
    """
    df = _filter_expenses(pl.read_parquet(expenses_path))

    if exclude_categories:
        df = df.filter(~pl.col("category").is_in(exclude_categories))

    monthly = df.group_by("date").agg(pl.col("value").sum().alias("total")).sort("date")

    dates = monthly["date"].to_list()
    values = monthly["total"].to_list()
    rolling = monthly.with_columns(
        pl.col("total")
        .rolling_mean(window_size=7, min_periods=1, center=True)
        .alias("rolling")
    )["rolling"].to_list()

    fig = go.Figure()
    fig.add_trace(
        go.Scatter(
            x=dates,
            y=values,
            mode="lines",
            name="Monthly Expenses",
            line=dict(color="rgba(214, 39, 40, 0.4)", width=1),
        )
    )
    fig.add_trace(
        go.Scatter(
            x=dates,
            y=rolling,
            mode="lines",
            name="7-Month Average",
            line=dict(color="rgba(214, 39, 40, 1)", width=3),
        )
    )

    _add_event_annotations(fig, events_path)

    fig.update_layout(
        xaxis_title="Date",
        yaxis_title="Monthly Expenses (USD, scaled)",
        hovermode="x unified",
        template="plotly_white",
        width=1100,
        height=500,
    )

    if title:
        fig.update_layout(title=title)

    return fig
