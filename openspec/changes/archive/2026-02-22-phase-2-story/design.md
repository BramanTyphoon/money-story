## Context

Phase 1 created the site scaffold with stub pages and the analysis package. The `analysis/story_charts.py` file is an empty stub. The `site/story/index.qmd` is a placeholder. The data is already available via the `site/data_public` symlink. Quarto is configured with `freeze: auto` and executes Python cells during render.

The author will heavily personalize the narrative prose — the rough draft just needs working charts and a sensible page structure to build from.

## Goals / Non-Goals

**Goals:**
- Two interactive Plotly charts: total monthly income over time, total monthly expenditures over time
- Life-event annotations on both charts as colored vertical regions
- A rough-draft `.qmd` story page with charts embedded and placeholder narrative prose
- Charts rendered at build time, cached via `freeze: auto`

**Non-Goals:**
- Polished final narrative — the author will rewrite the prose
- Category breakdowns, stacked areas, or composition charts (potential future additions)
- Client-side interactivity beyond Plotly's built-in zoom/pan/hover

## Decisions

### 1. Chart function signatures

Two functions in `analysis/story_charts.py`:

```python
def plot_income_over_time(
    income_path: str = "data_public/income_monthly.parquet",
    events_path: str = "data_public/events_public.parquet",
) -> go.Figure: ...

def plot_expenses_over_time(
    expenses_path: str = "data_public/expenses_monthly.parquet",
    events_path: str = "data_public/events_public.parquet",
) -> go.Figure: ...
```

Each function:
1. Reads the Parquet file, groups by month, sums values (absolute value for income since raw values are negative)
2. Reads events, adds `vrect` annotations as semi-transparent colored vertical bands
3. Returns a `go.Figure` with a single line trace + event annotations

**Alternative considered:** A single combined income-vs-expenses chart. Rejected because two separate charts let the author place narrative prose between them and discuss each independently.

### 2. Life-event annotation style

Events are rendered as `fig.add_vrect()` with semi-transparent fill spanning the event's date range. Each event type gets a distinct color:
- career → blue
- move → orange
- family → green
- education → purple

A legend entry or annotation label shows the event name. For short-duration events (single month), use a narrow band rather than a vertical line so it's visible.

**Alternative considered:** Vertical lines with text annotations. Rejected because shaded regions are more visually clear and work better with Plotly's interactive hover.

### 3. Data aggregation approach

**Income:** Group `income_monthly.parquet` by `date`, sum `value`, take absolute value (raw values are negative). Plot as a single line.

**Expenses:** Group `expenses_monthly.parquet` by `date`, sum `value`. Exclude `Savings/Investments` and `Transfer between accounts` sub_categories to show actual spending rather than money movement. Plot as a single line.

**Decision: Exclude savings/transfers from expenses.** The raw expense data includes large savings transfers (e.g., 79K in Savings/Investments in 2023) that would dwarf actual spending and distort the trend line. The author can adjust this filter if desired.

### 4. Smoothing

Add a 6-month rolling average as a secondary trace (lighter, thicker line) alongside the raw monthly values. Monthly spending is noisy; the rolling average reveals the underlying trend that correlates with life events.

**Alternative considered:** Only raw values. Rejected because month-to-month variance obscures the story. The author can remove the smoothing if they prefer.

### 5. Story page structure

```
site/story/index.qmd
├── YAML frontmatter (title, hidden Python setup cell)
├── Intro prose (placeholder for author)
├── Income chart + surrounding narrative
├── Expenses chart + surrounding narrative
└── Closing prose (placeholder for author)
```

Python cells use `#| echo: false` to hide code and `#| fig-cap:` for captions. The setup cell imports the chart module and defines paths relative to the `.qmd` location.

### 6. Freeze and the `_freeze/` directory

On first `quarto render`, the Python cell outputs are cached to `site/_freeze/story/index/`. This directory should be committed to git so that CI (and subsequent local renders) don't need to re-execute Python unless the `.qmd` changes. Add `site/_freeze/` to `.gitignore` exclusion if needed.

## Risks / Trade-offs

**Savings/transfer filtering** — Excluding savings from expenses is an editorial choice. The author may want to include or handle them differently.
→ Mitigation: The filter is explicit in the chart function; easy to adjust.

**Rolling average edge effects** — The 6-month rolling average will have NaN for the first 5 months.
→ Mitigation: Use `min_periods=1` so early months show partial averages rather than gaps.

**Data paths in .qmd** — The Python cells need to reference `data_public/` which is a symlink. The pre-render script ensures it exists, but the path must be relative to the site root (where Quarto executes), not the `.qmd` file location.
→ Mitigation: Use `data_public/` as the path since Quarto runs from `site/`.
