## Why

The site skeleton from Phase 1 is deployed with stub pages, but the story section — the core portfolio piece — has no content. Phase 2 creates two key charts (total income over time, total expenditures over time) annotated with life events, and provides a rough-draft narrative page that the author will heavily personalize.

## What Changes

- Implement `analysis/story_charts.py` with two chart functions: total monthly income over time, and total monthly expenditures over time — both annotated with life-event markers from `events_public.parquet`
- Replace the `site/story/index.qmd` stub with a rough-draft narrative page that embeds the two charts via Python code cells and provides initial prose structure for the author to customize
- Charts are pre-rendered at build time via Quarto's `freeze: auto` — no client-side data loading needed

## Capabilities

### New Capabilities

- `static-story-charts`: Two Python functions in `analysis/story_charts.py` that generate Plotly figures for the story page. One plots total monthly income over time; the other plots total monthly expenditures over time. Both read from `data_public/` Parquet files, aggregate to monthly totals, and annotate with life-event vertical shaded regions from `events_public.parquet`. Each returns a `plotly.graph_objects.Figure`. The story `.qmd` page calls these functions from Python code cells and displays the figures inline.

### Modified Capabilities

- `quarto-scaffold`: The story stub page (`site/story/index.qmd`) is replaced with a rough-draft narrative page containing Python code cells and placeholder prose. This changes the requirement from "placeholder indicating content is coming" to a working page with charts that the author will personalize.

## Impact

- **Modified files**: `analysis/story_charts.py` (stub → two chart functions), `site/story/index.qmd` (stub → rough-draft narrative with embedded charts)
- **New build dependency**: Quarto must execute Python cells during render (already supported via `freeze: auto`)
- **Freeze directory**: `site/_freeze/` will be generated on first render and should be committed so CI doesn't need to re-execute Python
- **No new Python dependencies**: Uses polars and plotly already declared in `pyproject.toml`
