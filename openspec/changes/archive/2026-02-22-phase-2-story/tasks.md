## 1. Chart Functions

- [x] 1.1 Implement shared helper `_add_event_annotations(fig, events_path)` in `analysis/story_charts.py` that reads `events_public.parquet` and adds `vrect` annotations colored by event type (career=blue, move=orange, family=green, education=purple) with semi-transparent fill and event name labels
- [x] 1.2 Implement `plot_income_over_time(income_path, events_path)` — reads income parquet, groups by date, sums value, takes absolute value, plots raw monthly line + 6-month rolling average (min_periods=1), adds event annotations, returns `go.Figure`
- [x] 1.3 Implement `plot_expenses_over_time(expenses_path, events_path)` — reads expenses parquet, excludes Savings/Investments and Transfer between accounts sub_categories, groups by date, sums value, plots raw monthly line + 6-month rolling average (min_periods=1), adds event annotations, returns `go.Figure`
- [x] 1.4 Verify both chart functions work by running them from the `site/` directory (where Quarto will call them) and confirming the `data_public/` symlink paths resolve

## 2. Story Page

- [x] 2.1 Replace `site/story/index.qmd` stub with rough-draft narrative page: YAML frontmatter with title, hidden Python setup cell importing `analysis.story_charts`, income chart cell with `#| echo: false`, expenses chart cell with `#| echo: false`, and placeholder prose sections (intro, between charts, closing) for the author to personalize
- [x] 2.2 Run `quarto render site/` to verify the story page renders with both charts and confirm `_freeze/` directory is generated

## 3. Freeze Cache

- [x] 3.1 Commit the `site/_freeze/` directory so CI can use cached chart output without re-executing Python
