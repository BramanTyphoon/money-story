## Why

The site's explore section is currently a placeholder. The static story page tells a fixed narrative, but readers have no way to interrogate the data themselves — drill into specific categories, visualize money flows for chosen time periods, or run ad-hoc queries. Adding interactive exploration backed by DuckDB-Wasm lets visitors engage with the data directly in-browser with zero backend, completing the site's original vision.

## What Changes

- Add DuckDB-Wasm initialization module that loads Parquet files and provides a shared query interface for all interactive components
- Build a unified explore page (`site/explore/index.qmd`) combining three interactive sections:
  - **Categories over time**: multi-series time plot of expenses by category with category toggles (checkboxes), adjustable moving average window, and zoom/pan
  - **Sankey diagram**: date-range-selectable flow diagram showing income sources → general funds → expense categories (ported from existing Python implementation to client-side JS)
  - **SQL playground**: curated query recipes with editable SQL, parameter inputs, and tabular result display
- Port the existing Python Sankey logic (`BudgetTracker/budgettrack/plot.py`) to JavaScript using Plotly.js Sankey traces, adapting category translation, carryover calculation, and color mapping
- Add JS modules for DuckDB initialization, chart rendering, Sankey construction, and SQL execution

## Capabilities

### New Capabilities
- `duckdb-wasm-loader`: DuckDB-Wasm initialization, Parquet registration, shared connection singleton, and query helper
- `explore-categories-chart`: Interactive multi-category time series chart with category checkboxes, adjustable moving average window, and zoom/pan
- `explore-sankey`: Date-range-selectable Sankey diagram ported from Python to JS, using DuckDB-Wasm for data aggregation
- `explore-sql-playground`: Curated SQL recipe selector with editable query textarea, parameter inputs, run button, and table/chart result display

### Modified Capabilities
- `quarto-scaffold`: Explore page changes from placeholder to full interactive page with DuckDB-Wasm dependencies and JS module loading

## Impact

- **New JS modules**: `site/assets/js/duckdb_init.js`, `explore_charts.js`, `sankey.js`, `sql_playground.js`
- **Dependencies**: DuckDB-Wasm loaded from CDN (no build tooling change); Plotly.js already available from CDN
- **Explore page**: `site/explore/index.qmd` rewritten from placeholder to three-section interactive page
- **Data**: No schema changes — existing Parquet files in `data_public/` are queried as-is by DuckDB-Wasm
- **Build/CI**: No changes needed — JS modules are static assets, no server-side rendering required
- **Sankey port**: The Python Sankey function (~200 lines of Polars logic) must be faithfully translated to JS+SQL, preserving category mappings, carryover calculations, and color scheme
