## 1. Chart Function

- [x] 1.1 Add `plot_savings_over_time()` to `analysis/story_charts.py` with optional `expenses_path` and `events_path` parameters defaulting to the `data_public/` paths
- [x] 1.2 Implement savings filter: retain rows where `(destination == "Savings") | (sub_category == "Savings/Investments")`
- [x] 1.3 Aggregate filtered data by `date` (sum `value`), sort ascending, then compute cumulative sum with `cumsum()`
- [x] 1.4 Add a single blue line trace (`rgba(31, 119, 180, ...)`) for the cumulative series — no rolling average trace
- [x] 1.5 Call `_add_event_annotations()` to annotate with life events
- [x] 1.6 Set layout: `yaxis_title="Cumulative Savings (USD, scaled)"`, `xaxis_title="Date"`, `template="plotly_white"`, `width=1100`, `height=500`

## 2. Story Page

- [x] 2.1 Add the `plot_savings_over_time` import to the setup code cell in `site/story/index.qmd`
- [x] 2.2 Append a `## Savings` section with a narrative paragraph explaining the chart shows explicit savings flows (not net savings), cumulated from the start of the tracked period
- [x] 2.3 Append the Python code cell calling `plot_savings_over_time()` with `#| echo: false`
- [x] 2.4 Append the `<p class="figure-caption">` caption with **Figure 4.** label

## 3. Freeze Cache

- [ ] 3.1 Run `uv run quarto render site/` (or `quarto render site/`) locally to populate `_freeze/story/index/` with the new frozen cell output, then commit the updated freeze files
