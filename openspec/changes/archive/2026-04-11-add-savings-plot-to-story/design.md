## Context

The Story page has two existing chart functions in `analysis/story_charts.py`: `plot_income_over_time` and `plot_expenses_over_time`. Both read a Parquet, aggregate by month, and return a `go.Figure` annotated with life events. The savings chart follows the same setup but diverges in what it plots: instead of monthly amounts, it shows savings accumulation — a running total that reveals whether the user was building wealth over time.

Savings flows in `expenses_monthly.parquet` are rows excluded by the standard `_filter_expenses()` filter — specifically rows where `destination == "Savings"` or `sub_category == "Savings/Investments"`. Because the Parquet is already monthly-aggregated, a `cumsum()` over the date-sorted monthly totals yields the accumulated savings series.

## Goals / Non-Goals

**Goals:**
- Add `plot_savings_over_time()` to `story_charts.py` that returns a `go.Figure` showing cumulative savings accumulation over time
- Append a `## Savings` section to `site/story/index.qmd` with narrative text, the chart cell, and a Figure 4 caption
- Keep visual style consistent with the existing charts (same layout dimensions, same event annotation approach, `plotly_white` template)

**Non-Goals:**
- Computed net savings (income minus expenses) — explicit flows only
- A monthly-bar view or secondary monthly trace — single cumulative line only
- Any changes to the data pipeline or Parquet files
- An interactive version (that belongs in Explore)

## Decisions

**Decision: Single cumulative line, no rolling average**

A cumulative sum is already a smoothed view of saving behaviour; adding a rolling average on top of a cumulative series would be misleading (it would average already-accumulated values, not monthly deltas). The chart therefore shows one line: `cumsum(monthly_savings)`.

Alternative considered: show both monthly bars and a cumulative line. Rejected to keep the chart uncluttered and consistent with the narrative focus (trend, not granular month-by-month).

**Decision: Filter logic for savings rows (net, not gross)**

Select three row types and assign signed values before aggregating:
- `destination == "Savings"` → +value (deposit)
- `sub_category == "Savings/Investments"` → +value (deposit)
- `source == "Savings"` → −value (withdrawal)

Sum signed values per month, then cumsum. This matches the Sankey view, where savings flows in both directions.

Alternative considered: inflows only (`destination == "Savings"`). Rejected because it overstates savings by ignoring withdrawals recorded as `source == "Savings"` expenses.

**Decision: Chart color**

Use blue (`rgba(31, 119, 180, ...)`) to distinguish savings from green (income) and red (expenses). Blue is also the career event color but at different opacity levels, so there is no perceptual conflict.

**Decision: No helper function for the savings filter**

The filter is only called once; inline it directly in `plot_savings_over_time()`.

**Decision: Y-axis label**

Use `"Cumulative Savings (USD, scaled)"` to make clear the axis represents a running total, not a monthly amount.

## Risks / Trade-offs

- **Starting point is arbitrary**: The cumulative sum starts from the first month in the dataset (2009-10). If savings activity existed before the tracking period, the chart will understate total accumulated savings. This is acceptable given the data scope and should be noted in the narrative.
- **Freeze invalidation**: Adding a new code cell to `story/index.qmd` requires a re-render to populate `_freeze/`. CI will execute the cell fresh on first build — no functional risk, just slower.
- **Gaps / zero months**: Months with no savings activity contribute zero to the cumsum, which is correct (the line plateaus). No special handling needed.
