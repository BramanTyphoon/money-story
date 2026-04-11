## Why

The Story page covers income and expenditures but leaves savings unaddressed, giving an incomplete picture of the decade. Adding a savings chart closes this gap by showing explicit monthly savings flows — money that was actively directed into savings accounts or investments — using data already present in the Parquet files.

## What Changes

- New `plot_savings_over_time()` function added to `analysis/story_charts.py`, filtering `expenses_monthly.parquet` to rows where `destination == "Savings"` or `sub_category == "Savings/Investments"`, aggregating by month, then computing a cumulative sum to show accumulated savings over time
- New `## Savings` section appended to `site/story/index.qmd` with a narrative paragraph, the chart cell, and a `Figure 4.` caption
- The `_freeze/` cache updated to include the new frozen output

## Capabilities

### New Capabilities

- `story-savings-chart`: A static Plotly chart rendered in the Story page showing cumulative savings accumulation over time (running total of explicit transfers to Savings), with life-event annotations, consistent in style with the existing income and expenditure charts

### Modified Capabilities

- `static-story-charts`: The existing story charts spec gains a new chart function (`plot_savings_over_time`) following the same conventions as `plot_income_over_time` and `plot_expenses_over_time`

## Impact

- `analysis/story_charts.py` — new function added
- `site/story/index.qmd` — new section and code cell appended
- `site/_freeze/story/index/` — cache updated on next render
- No schema changes, no new dependencies, no breaking changes
