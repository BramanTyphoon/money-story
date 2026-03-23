## Why

The Story page discusses lifestyle creep and how certain expense categories (housing, childcare) blur the line between necessary and discretionary spending. It currently points readers to "Explore" for category-level analysis, but that page is unimplemented. An interactive expense chart with category toggling — placed directly in the Story — lets readers immediately test the narrative's claims by excluding categories and observing the effect on the spending trend.

## What Changes

- Add a new interactive expense chart to the Story page, below the existing static expense chart
- The chart starts with all categories selected and matches the shape of the existing aggregate chart
- Readers can click category buttons/checkboxes to toggle their inclusion; the aggregate line and rolling average recompute dynamically
- Category-level monthly data is pre-computed in Python and embedded as JSON at build time — no DuckDB-Wasm required
- Life-event annotations are preserved on the interactive chart

## Capabilities

### New Capabilities
- `interactive-expense-chart`: Client-side interactive expense chart with category toggle controls, embedded category-level data, and dynamic Plotly re-rendering

### Modified Capabilities
- `static-story-charts`: The Story page narrative text will be updated to reference the new interactive chart instead of pointing to the (unimplemented) Explore page. The existing static charts are unchanged.

## Impact

- **`analysis/story_charts.py`**: New function to compute per-category monthly expense data and serialize as JSON for embedding
- **`site/story/index.qmd`**: New section with the interactive chart (Python cell for data + OJS/JS cell for interactivity)
- **Plotly.js**: Already loaded via CDN; no new dependencies
- **Build**: No new system dependencies; the Python data prep runs at Quarto render time under `freeze: auto`
