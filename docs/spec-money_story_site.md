# Spec: Personal Spending Portfolio Site (Quarto + GitHub Pages + DuckDB-Wasm)

## 1) Purpose and Goals

Build a public, portfolio-grade website that:

1. Presents a **static data story** (narrative + key charts) highlighting trends like lifestyle creep, income/job transitions, etc.
2. Provides **interactive exploration** of *public-safe* spending aggregates using **DuckDB-Wasm** (SQL in-browser, no backend).
3. Runs entirely as a **static site** hosted on **GitHub Pages** with **GitHub Actions** CI/CD.

Non-goals:

* No authenticated access.
* No server-side API.
* No raw transaction-level public data unless explicitly approved (default is aggregated only).

---

## 2) High-Level Architecture

**Static site generator:** Quarto
**Hosting:** GitHub Pages
**Build/deploy automation:** GitHub Actions
**Public data format:** Parquet (preferred) or CSV (fallback)
**In-browser query engine:** DuckDB-Wasm
**Interactive charts:** Plotly.js (recommended for zoom/toggle/legend interactions)
**Sankey diagram:** Use existing Sankey code (Python or JS) invoked with selected start/end dates.

Two “modes” of charts:

* **Pre-rendered (static story):** Generated during build (Python → Plotly export to HTML or image where appropriate).
* **Live interactive (explore pages):** JS loads Parquet → DuckDB-Wasm queries → Plotly renders.

---

## 3) Data Model and Privacy Requirements

### 3.1 Inputs (Private, not published)

* Raw transactions: date, amount, merchant (optional), category hierarchy, account, income/expense flag, etc.
* Life events metadata (private source) describing event windows (job change, move, etc.) with labels.

### 3.2 Public dataset (Published)

Publish **aggregated** and **de-identified** tables only (default). Suggested:

* `spend_monthly_category.parquet`

  * `month` (YYYY-MM-01)
  * `category_l1`, `category_l2` (optional deeper levels)
  * `amount` (normalized, sign convention: expenses positive; income separate)
* `income_monthly.parquet`

  * `month`
  * `income_amount`
* `events_public.parquet` (optional, if you want annotated lines)

  * `event_id`, `label`, `start_date`, `end_date`, `type` (job/move/etc.)

Privacy constraints:

* No merchant names in public datasets.
* No exact transaction timestamps in public datasets.
* Consider rounding amounts (optional) and suppressing very rare categories.

---

## 4) Repo Layout (Proposed)

```
repo/
  README.md
  .gitignore
  pyproject.toml / pixi.toml (optional)
  data_private/                 # NOT committed (raw)
  data_public/                  # committed OR built artifact
    spend_monthly_category.parquet
    income_monthly.parquet
    events_public.parquet
  analysis/
    build_public_data.py         # produces data_public/*
    sankey_generator.py          # existing (or wrapper)
    story_charts.py              # produces static story charts
  site/
    _quarto.yml
    index.qmd
    story/
      lifestyle-creep.qmd
      job-changes.qmd
    explore/
      categories-over-time.qmd
      sankey.qmd
      sql-playground.qmd
    assets/
      js/
        duckdb_init.js
        explore_charts.js
        sankey_ui.js
        sql_queries.js
      css/
        styles.css
  .github/
    workflows/
      publish.yml
```

Notes:

* You may choose to commit `data_public/` for simplicity, or generate it in CI and publish as site artifacts. Start by committing it unless size becomes a problem.

---

## 5) Pages and Feature Specs

### 5.1 Static Data Story (Narrative)

**Pages:**

* `index.qmd`: overview, methodology, what’s public vs private, how data is normalized, limitations.
* `story/lifestyle-creep.qmd`: narrative + charts showing spending trends (e.g., monthly total spend, spend per category over time, rolling averages).
* `story/job-changes.qmd`: income changes + spending patterns around event windows.

**Requirements:**

* Charts can be static images or embedded Plotly HTML (acceptable on static site).
* Include event annotations (vertical spans/lines) based on `events_public.parquet`.
* Each story page must state what data is used (monthly aggregates) and note privacy approach.

Acceptance criteria:

* Site builds on GitHub Actions and deploys to Pages.
* Story pages render consistently without requiring client-side data fetch.
* Charts display correctly on desktop and mobile.

---

### 5.2 Interactive Categories Over Time

**Page:** `explore/categories-over-time.qmd`

**User-facing interactions:**

* Multi-series time plot of expenses by category (L1 default; optionally drill to L2).
* Users can:

  * Zoom/pan on time axis
  * Zoom on cost axis
  * Toggle categories on/off (legend interaction)
  * Optional: select “Top N categories” + “Other”

**Implementation approach:**

* JS loads `spend_monthly_category.parquet` via DuckDB-Wasm.
* Query produces a pivoted dataset (month × category) or long-form series per category.
* Render via Plotly.js in the browser for interaction (zoom/toggle are native).

Functional requirements:

* Initial view defaults to last 24–36 months (fast load), with option to expand to all time.
* Provide category level selector: L1/L2 (if L2 exists).
* Provide time range quick filters: 1y / 3y / 5y / all.

Acceptance criteria:

* Page loads and becomes interactive within reasonable time for dataset size (target: <3s after initial WASM init on typical broadband for small Parquet).
* Toggling categories updates instantly without reloading the page.
* Zoom persists until reset.

---

### 5.3 Interactive Sankey Diagram (Date Range Selection)

**Page:** `explore/sankey.qmd`

**Goal:**
Users select an arbitrary date range and generate a Sankey diagram using existing Sankey code. The only new work is extracting `start_date` and `end_date` from UI controls and feeding them into the Sankey generator.

**User-facing interactions:**

* Date range picker:

  * Start month/date
  * End month/date
* “Generate Sankey” button
* Optional: category level dropdown (L1 vs L2)
* Display Sankey diagram (embedded Plotly Sankey or existing renderer)

**Implementation approach (two possible paths):**

**Path A (recommended if existing Sankey code is JS/Plotly):**

* DuckDB-Wasm queries aggregated flows for selected period in-browser.
* JS calls existing Sankey function with the filtered dataset.

**Path B (if existing Sankey code is Python-only):**

* Precompute Sankey for fixed periods only (not “arbitrary”).
* This conflicts with the requirement. If the Sankey code truly must remain Python-only, you’ll need a backend or accept limited presets. Default assumption: code can run in JS or can be ported.

Functional requirements:

* Date selection must clamp to dataset bounds.
* Must validate start ≤ end.
* Sankey generation should not require page reload.

Acceptance criteria:

* Sankey updates when the selected range changes and user clicks Generate.
* Diagram matches expected output from the existing Sankey code for equivalent dates.

---

### 5.4 Customizable Queries (Guided SQL Exploration)

**Page:** `explore/sql-playground.qmd`

**User-facing experience:**

* A small set of curated SQL “recipes” with parameters (year, category, threshold).
* Users can edit queries and run them.
* Results display in a table; optionally a simple chart for common query shapes.

**Security/constraints:**

* Because everything is local, there’s no server security risk, but you must still:

  * Restrict accessible files to `data_public/` only.
  * Avoid exposing private data in build output.

**Implementation approach:**

* Provide a dropdown of example queries:

  * “Monthly totals by category for a year”
  * “Top categories for selected period”
  * “YoY change by category”
  * “Income vs spend summary”
* Use DuckDB-Wasm to execute SQL.
* Display results:

  * Table renderer (simple HTML table)
  * Optional quick chart types based on result columns

Acceptance criteria:

* Queries run and display results.
* Example query parameters are easy to modify (either via template variables or UI inputs that rewrite SQL).

---

## 6) DuckDB-Wasm Integration Details

### 6.1 Initialization

* Load DuckDB-Wasm via ESM import in a `type="module"` script or bundled JS.
* Use a Web Worker bundle for performance.

### 6.2 Data loading

* Primary: query Parquet directly by URL (same origin GitHub Pages path).
* Optional: register files via DuckDB file APIs if needed.
* Keep dataset size modest to avoid long downloads.

### 6.3 Query patterns

* Standardize SQL in `site/assets/js/sql_queries.js`:

  * `getMonthlyCategorySeries(level, start, end, topN)`
  * `getSankeyFlows(level, start, end)`
  * `getIncomeVsSpend(start, end)`
* Keep all queries parameterized (string interpolation with careful escaping for dates/identifiers).

---

## 7) Build and Deployment (GitHub Actions → GitHub Pages)

**Workflow requirements:**

* On push to `main`:

  1. Set up Python
  2. Install dependencies (pixi/uv/pip acceptable)
  3. Run `analysis/build_public_data.py` (optional if public data committed)
  4. Run `quarto render site/`
  5. Deploy output to GitHub Pages (commonly `gh-pages` branch)

**Artifacts:**

* Quarto output directory (e.g., `site/_site/`)

Acceptance criteria:

* A fresh clone + push triggers successful build.
* GitHub Pages serves the site without manual steps.

---

## 8) Implementation Tasks for Coding Agent

1. **Quarto scaffold**

* Create `site/_quarto.yml` with navbar linking to Story and Explore sections.
* Implement initial `index.qmd` + stub pages.

2. **Data pipeline**

* Implement `analysis/build_public_data.py`:

  * Read private source(s)
  * Output aggregated Parquet(s) to `data_public/`
  * Ensure deterministic output (sorted, stable schema)

3. **Static story charts**

* Implement `analysis/story_charts.py` or inline Python in `.qmd`:

  * Generate key charts for lifestyle creep, income transitions
  * Embed results in story pages

4. **DuckDB-Wasm loader**

* Implement `site/assets/js/duckdb_init.js`:

  * Async init function
  * Shared connection singleton
  * Helper to run queries and return rows

5. **Interactive categories plot**

* Implement `site/assets/js/explore_charts.js`:

  * UI wiring (level selector, date filters, topN)
  * Query + Plotly render/update

6. **Sankey UI**

* Implement `site/assets/js/sankey_ui.js`:

  * Date range picker wiring
  * Query filtered dataset
  * Call existing Sankey generator with start/end dates

7. **SQL playground**

* Implement `site/assets/js/sql_playground.js` (or reuse patterns):

  * Example query list + editor textarea
  * Run button
  * Render table output

8. **CI/CD**

* Implement `.github/workflows/publish.yml` to build and deploy.

---

## 9) Definition of Done

* Site is publicly accessible on GitHub Pages.
* Story pages contain narrative + charts (no JS required for basic reading).
* Explore pages:

  * Categories time series is interactive (zoom/toggle).
  * Sankey diagram updates based on user-chosen date range.
  * SQL playground runs curated queries and displays results.
* Public dataset is aggregated and contains no private fields.
* Build is reproducible and automated via GitHub Actions.

---

## 10) Open Questions (Agent should resolve without blocking)

* Confirm Sankey implementation environment:

  * If existing Sankey code is Python-only, agent must either (a) port to JS/Plotly, or (b) constrain feature to presets. Default assumption: port or use JS-compatible Sankey.
* Confirm data sizes:

  * If Parquet is large, agent should add pre-aggregation or “year selection loads subset” strategy.

If you want, I can also include concrete interface contracts (function signatures + example schemas) for the JS modules and the Parquet schemas so the agent has fewer degrees of freedom.
