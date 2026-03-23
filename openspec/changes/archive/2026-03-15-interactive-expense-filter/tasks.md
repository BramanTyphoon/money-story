## 1. Python Data Functions

- [x] 1.1 Add `get_expenses_by_category()` to `analysis/story_charts.py`: read `expenses_monthly.parquet`, apply same filters as `plot_expenses_over_time` (exclude Savings/Investments, transfers, Savings destination), group by `date` and `category`, sum `value`, return list of dicts with `date` (ISO string), `category`, `value`
- [x] 1.2 Add `get_events()` to `analysis/story_charts.py`: read `events_public.parquet`, return list of dicts with `date_start` (ISO string), `date_end` (ISO string), `event`, `type`
- [x] 1.3 Extract shared expense filtering logic from `plot_expenses_over_time` and the new `get_expenses_by_category` into a common helper to avoid duplication

## 2. Story Page Integration

- [x] 2.1 Add a Python cell to `site/story/index.qmd` that imports and calls `get_expenses_by_category()` and `get_events()`, then passes both to OJS via `ojs_define()`
- [x] 2.2 Add an OJS cell with `Inputs.checkbox()` listing all distinct categories from the data, all selected by default
- [x] 2.3 Add a `<div id="interactive-expense-chart">` to the QMD for Plotly to render into
- [x] 2.4 Add an OJS reactive cell that: filters the category data by selected categories, aggregates by date, computes 7-month centered rolling average (min_periods=1), and calls `Plotly.react()` on the chart div with monthly trace, rolling average trace, event annotations, and matching layout

## 3. Visual Consistency

- [x] 3.1 Match trace colors: monthly line `rgba(214, 39, 40, 0.4)` width 1, rolling average `rgba(214, 39, 40, 1)` width 3
- [x] 3.2 Match layout: `plotly_white` template, axis labels "Date" / "Monthly Expenses (USD, scaled)", dimensions 1100x500, `hovermode: "x unified"`
- [x] 3.3 Render event annotations as shaded vrect regions colored by type (career=blue, move=orange, family=green, education=purple) with semi-transparent fill and event name labels

## 4. Narrative Update

- [x] 4.1 Update the expenditures narrative in `site/story/index.qmd` to introduce the interactive chart and replace the forward-reference to the Explore page
