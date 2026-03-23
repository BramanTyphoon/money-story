## Context

The Story page renders two static Plotly charts (income, expenses) via Python at build time. The existing expense chart aggregates all categories into a single line (excluding Savings/Investments and transfers). Plotly.js is already loaded from CDN. Quarto supports OJS (Observable JS) cells with built-in reactivity, and `ojs_define()` to pass Python data into OJS cells.

The expense data has 12 destination categories. The goal is to let readers toggle categories on/off and see the aggregate spending trend update dynamically.

## Goals / Non-Goals

**Goals:**
- Interactive expense chart where readers toggle categories and see the aggregate recompute
- Visual consistency with the existing static expense chart (same colors, layout, event annotations)
- No new system dependencies — runs on what's already available (Plotly.js CDN, Quarto OJS)
- Data pre-computed at build time; no client-side data fetching

**Non-Goals:**
- Replacing the existing static expense chart (it stays for the narrative flow)
- DuckDB-Wasm or any client-side database
- Per-category individual line traces (this is about the aggregate with categories excluded)
- Income chart interactivity (only expenses)

## Decisions

### 1. Data embedding: `ojs_define()` from Python

**Choice**: Use Quarto's `ojs_define()` to pass pre-computed category-level monthly data from a Python cell to OJS cells.

**Alternatives considered**:
- Hidden `<script>` tag with JSON: works but bypasses Quarto's data-passing idiom and requires manual DOM parsing
- DuckDB-Wasm query at runtime: overkill for pre-aggregated data; adds a heavy dependency

**Rationale**: `ojs_define()` is Quarto's native mechanism for Python→JS data flow. It serializes data as JSON and makes it available as a reactive OJS variable. No extra infrastructure needed.

### 2. Interactivity: OJS reactive cells

**Choice**: Use OJS cells for the interactive UI — `Inputs.checkbox()` for category selection and a reactive cell that recomputes the aggregate and calls `Plotly.react()`.

**Alternatives considered**:
- Vanilla JS in a `{js}` block: possible but requires manual event wiring and DOM management
- Pyodide/Shiny: heavy runtime dependencies, not appropriate for a static site

**Rationale**: OJS cells provide declarative reactivity — when the checkbox selection changes, downstream cells automatically re-execute. This is exactly the interaction pattern needed and is idiomatic Quarto.

### 3. Data shape: per-category monthly totals

**Choice**: A new Python function produces a list of records: `{date, category, value}` for each category-month combination. The same filters as the static chart apply (exclude Savings/Investments, transfers). Event data is passed separately for annotations.

**Rationale**: This flat shape is easy to pivot client-side. When categories are toggled, JS groups by date across selected categories and sums. The rolling average is computed client-side after aggregation.

### 4. Rolling average: client-side computation

**Choice**: Compute the 7-month centered rolling average in JS after re-aggregating.

**Rationale**: The rolling average must be recomputed whenever the category selection changes. A simple sliding-window function in JS is straightforward (~10 lines).

### 5. Category toggle UI: checkbox group

**Choice**: OJS `Inputs.checkbox()` with all categories listed, all selected by default.

**Rationale**: Checkboxes clearly communicate multi-select semantics. OJS `Inputs.checkbox()` returns the selected values reactively, triggering chart updates automatically.

### 6. Chart rendering: Plotly.react() on a static div

**Choice**: Create a `<div>` for the chart in the QMD. The OJS cell calls `Plotly.react()` (not `Plotly.newPlot()`) to efficiently update the chart when selections change.

**Rationale**: `Plotly.react()` is the recommended method for updating an existing chart — it diffs the data and only re-renders what changed, avoiding flicker.

## Risks / Trade-offs

- **Visual mismatch**: The interactive chart is rendered via JS while the static charts are rendered via Python Plotly. The layout config (colors, dimensions, template) must be manually replicated in JS. → Mitigation: Extract the layout constants and match them exactly.
- **OJS learning curve**: OJS is less familiar than vanilla JS. → Mitigation: The OJS code is small (checkbox input + one reactive cell) and well-documented by Quarto.
- **Large JSON payload**: 12 categories × ~170 months ≈ 2,040 records embedded in the page. → Mitigation: This is small (~50-80 KB as JSON), well within acceptable page size.
- **Rolling average edge behavior**: JS implementation must match the Python `min_periods=1, center=True` behavior. → Mitigation: Test against the static chart's values to verify.
