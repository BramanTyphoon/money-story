## 1. DuckDB-Wasm Loader

- [x] 1.1 Create `site/assets/js/duckdb_init.js` with DuckDB-Wasm v1.29.0 CDN import, Web Worker initialization, and singleton connection caching
- [x] 1.2 Implement Parquet file registration for `expenses_monthly`, `income_monthly`, and `events_public` from `data_public/` paths
- [x] 1.3 Implement `runQuery(sql)` helper that awaits initialization and returns results as an array of plain objects

## 2. Explore Page Scaffold

- [x] 2.1 Rewrite `site/explore/index.qmd` with three section headings (Categories Over Time, Sankey Diagram, SQL Playground), container divs for each section, and a loading indicator
- [x] 2.2 Add `<script type="module">` block that imports `duckdb_init.js`, awaits initialization, hides the loading indicator, and activates each section's module
- [x] 2.3 Add Plotly.js CDN `<script>` tag and DuckDB-Wasm ESM import map or direct CDN URLs

## 3. Categories Over Time Chart

- [x] 3.1 Create `site/assets/js/explore_charts.js` with DuckDB query for monthly expense totals grouped by category and date (with savings/transfer/Savings-destination filtering)
- [x] 3.2 Implement category checkbox UI — render checkboxes for all categories, all checked by default, with change event listeners
- [x] 3.3 Implement moving average window control (slider or number input, range 1–12, default 7)
- [x] 3.4 Implement aggregate trace computation — sum selected categories per month, compute centered rolling average with current window size
- [x] 3.5 Query `events_public` and render life-event shaded regions with type-based colors and labels
- [x] 3.6 Render chart via `Plotly.react()` with raw aggregate trace, rolling average trace, event annotations, and `plotly_white` template

## 4. Sankey Diagram

- [x] 4.1 Create `site/assets/js/sankey.js` with date range picker UI (start/end month inputs, Generate button, validation)
- [x] 4.2 Implement expense and income category translation maps matching the Python implementation's mappings
- [x] 4.3 Implement source/destination assignment logic — income routing to General Funds/Savings, expense routing from General Funds/Savings, self-referential flow exclusion
- [x] 4.4 Implement carryover computation — DuckDB queries for cumulative savings and general fund balances before the selected start date
- [x] 4.5 Build Sankey node list (carryover nodes, General Funds, Savings, income sources, expense categories) with category-based color assignment
- [x] 4.6 Build Sankey link list from aggregated flows with destination-colored links at 0.4 opacity
- [x] 4.7 Render Sankey diagram via `Plotly.newPlot()` with formatted title, node styling (pad 15, thickness 15, black outline), and value formatting

## 5. SQL Playground

- [x] 5.1 Create `site/assets/js/sql_playground.js` with recipe dropdown, editable textarea, and Run button
- [x] 5.2 Define curated SQL recipes: monthly totals by category (year), top N categories (date range), year-over-year change, income vs expenses by year, monthly savings rate
- [x] 5.3 Implement query execution via `runQuery()` with error display in a styled error block
- [x] 5.4 Implement HTML table result renderer with column headers, row data, and 100-row truncation with count note
- [x] 5.5 Add collapsible table/column reference showing available tables and their schemas

## 6. Integration and Polish

- [x] 6.1 Verify all three sections initialize correctly after DuckDB-Wasm loads and loading indicator disappears
- [x] 6.2 Test Sankey output against Python implementation for a known year to validate category mapping and carryover fidelity
- [x] 6.3 Add basic CSS styling for controls (checkboxes, slider, date pickers, textarea, buttons, result tables) in `site/assets/css/styles.css`
