## Context

The site has a static story page with pre-rendered Plotly charts and one inline interactive expense chart. The explore page is a placeholder. Three Parquet files in `data_public/` contain monthly expense, income, and life-event data. An existing Python Sankey implementation in `BudgetTracker/budgettrack/plot.py` produces annual flow diagrams using Polars + Plotly.

The goal is to build the explore page with three interactive sections — all running client-side via DuckDB-Wasm querying the same Parquet files the static story uses.

## Goals / Non-Goals

**Goals:**
- Single explore page with categories-over-time chart, Sankey diagram, and SQL playground
- All interactions run entirely in-browser — no backend, no Python at runtime
- DuckDB-Wasm as the shared query engine across all three sections
- Sankey faithfully ports the existing Python logic (category mapping, carryover, colors)
- Consistent visual style with the existing story charts

**Non-Goals:**
- No Pyodide or server-side computation
- No bundler or build tooling — JS modules loaded as ESM from CDN or local files
- No sub-category drill-down in v1 (categories-over-time uses `category` column only)
- No user-defined SQL schema exploration (playground is recipe-driven with optional editing)
- No changes to the data pipeline or Parquet schema

## Decisions

### 1. DuckDB-Wasm initialization pattern

**Decision:** Single async init module (`duckdb_init.js`) that exports a `getConnection()` promise. All sections await this before querying.

**Why:** DuckDB-Wasm worker + Parquet registration is ~1-2s. Sharing one instance avoids redundant init. The module registers all three Parquet files once and caches the connection.

**Alternative considered:** Lazy init per section. Rejected because the Parquet files are small (~50KB total) and eager registration avoids latency when switching between sections.

### 2. Sankey: JS port using DuckDB-Wasm for aggregation

**Decision:** Port the Sankey diagram to JavaScript. DuckDB-Wasm handles the data aggregation (filtering, grouping by date range, summing values). JS handles the Sankey-specific logic: category translation maps, carryover calculation, node/link construction, and rendering via `Plotly.newPlot()` with `go.Sankey` trace type.

**Why:** The existing Python code uses Polars for data manipulation, but the aggregation queries are straightforward SQL. The complex part — category mapping, carryover — is business logic that must be in JS regardless. Keeping aggregation in SQL is cleaner than doing it all in JS array operations.

**Alternative considered:** Pre-computing Sankey data for fixed year presets at build time. Rejected because the spec requires arbitrary date range selection, and the data is small enough for real-time computation.

**Carryover approach:** The Python code computes cumulative savings and general fund balances from all data before the selected period. In JS, this becomes two DuckDB queries: sum savings flows before start date, sum general fund flows before start date. These feed into the "General Carryover" and "Savings Carryover" nodes.

### 3. Categories-over-time: Plotly.js multi-series line chart with category toggles and adjustable moving average

**Decision:** Query monthly totals per category via DuckDB-Wasm, render as a Plotly.js multi-series line chart. Primary controls are category checkboxes (toggle individual categories on/off) and a moving average window slider (e.g., 1–12 months). Plotly's native zoom/pan handles time range exploration.

**Why:** Category checkboxes give direct control over which series are visible and let users compare specific categories. The moving average slider lets users smooth out noise at their preferred granularity — useful for spotting trends vs. examining month-to-month variance. These two controls address the most interesting analytical questions (which categories drive spending? what's the underlying trend?).

**Alternative considered:** Time range quick-filter buttons (1y, 3y, 5y, all). Deprioritized because Plotly's built-in zoom/pan already handles time range exploration well, and the analytical value of category toggles and smoothing controls is higher.

### 4. SQL playground: textarea + curated recipes

**Decision:** Dropdown of curated SQL recipes. Selecting a recipe populates an editable textarea. A "Run" button executes the SQL via DuckDB-Wasm. Results render in an HTML table. Optional simple bar/line chart for single-column numeric results.

**Why:** Keeps the playground approachable (curated starting points) while allowing power users to modify queries. HTML table rendering is simple and sufficient for the dataset size.

**Recipes planned:**
- Monthly totals by category for a selected year
- Top N categories for a date range
- Year-over-year change by category
- Income vs expenses summary by year
- Monthly savings rate

### 5. Page structure: single QMD with section anchors

**Decision:** One `explore/index.qmd` file with three sections separated by headers. Each section loads its JS module. DuckDB init happens once at page load via a shared `<script type="module">`.

**Why:** Single page keeps navigation simple and allows DuckDB-Wasm to be initialized once. The three sections are complementary views of the same data.

**JS module layout:**
- `site/assets/js/duckdb_init.js` — init, register Parquet, export connection
- `site/assets/js/explore_charts.js` — categories-over-time chart
- `site/assets/js/sankey.js` — Sankey diagram with date picker
- `site/assets/js/sql_playground.js` — SQL editor and result renderer

### 6. CDN dependencies

**Decision:** Load DuckDB-Wasm and Plotly.js from CDN via ESM imports. No bundler.

- DuckDB-Wasm: `@duckdb/duckdb-wasm` v1.29.0 (pinned, matching project convention)
- Plotly.js: already loaded by Quarto for static charts; reuse the same CDN version

**Why:** No build tooling change needed. CDN caching benefits repeat visitors. Pinning versions ensures reproducibility.

## Risks / Trade-offs

**DuckDB-Wasm cold start (~1-2s)** → Show a loading spinner on the explore page while WASM initializes. The three sections become interactive only after init completes. This is acceptable for a portfolio site.

**Large Sankey date ranges** → Selecting the full date range (2009-2023) produces a very busy Sankey. → Mitigation: default to most recent complete year; allow but don't encourage full-range selection.

**SQL injection in playground** → Users edit SQL that runs via DuckDB-Wasm. → No real risk: DuckDB-Wasm runs entirely client-side against public data. The user can only query their own browser. No server impact.

**Mobile experience** → Sankey diagrams and multi-series charts can be cramped on mobile. → Acceptable trade-off for a portfolio site. Charts will be scrollable and Plotly provides pinch-zoom.
