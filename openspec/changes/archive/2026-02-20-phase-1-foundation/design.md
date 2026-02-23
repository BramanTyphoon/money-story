## Context

The repo currently has:
- `data_public/` with 3 Parquet files (expenses_monthly, income_monthly, events_public) plus the script that generated them (`private_to_public.py`)
- `site/` containing only a `data_public` symlink pointing to `../../data_public`
- `analysis/` with only stale `__pycache__/` — no `.py` source files
- No `pyproject.toml`, no `_quarto.yml`, no CI workflow

The existing data uses a Sankey-style flow model: both expenses and income share a 7-column schema (`date`, `flow_type`, `source`, `destination`, `sub_category`, `category`, `value`) representing money flows between accounts/categories. Values are scaled by a random factor for privacy. The data spans 2009-10 to 2023-10 with real life events (career, moves, family, education).

This phase rebuilds the Python analysis package, creates the Quarto site skeleton, and wires up CI/CD. Subsequent phases add narrative content (Phase 2) and interactive explore pages (Phase 3).

## Goals / Non-Goals

**Goals:**
- Deployable Quarto site on GitHub Pages with working navbar and stub pages
- Python `analysis` package that encapsulates the data pipeline (currently `data_public/private_to_public.py`)
- Automated CI/CD: push to `main` → build → deploy
- Clean foundation for phases 2 and 3 to build on without restructuring

**Non-Goals:**
- Story page content or charts (Phase 2)
- DuckDB-Wasm integration or interactive explore pages (Phase 3)
- Changing the data schema — the existing Sankey-style flow model is preserved as-is
- Custom theme or advanced styling — minimal CSS only

## Decisions

### 1. Build backend: hatchling

Use `hatchling` as the PEP 517 build backend with `[tool.hatch.build.targets.wheel] packages = ["analysis"]`. This is already the established convention for this repo (per project notes). The `pyproject.toml` declares the analysis package and all Python dependencies.

**Alternative considered:** setuptools — more common but hatchling is simpler for a pure-Python package with no compiled extensions.

### 2. Dependency management: uv

Use `uv sync` for local development and `uv pip install` in CI. The project already uses a `.venv` managed by uv.

**Alternative considered:** pip/pixi — uv is faster and already in use.

### 3. Quarto site structure

```
site/
  _quarto.yml          # project config, navbar, freeze: auto
  _pre-render.py       # ensures data_public symlink exists
  index.qmd            # landing page (static markdown, no Python)
  story/
    index.qmd          # stub — "Coming soon" placeholder
  explore/
    index.qmd          # stub — "Coming soon" placeholder
  assets/
    css/
      styles.css       # minimal global styles
```

The navbar has three top-level entries: Home, Story, Explore. Story and Explore are stubs in Phase 1 — just placeholder pages indicating content is coming. The `_pre-render.py` script runs before render to ensure the `site/data_public` symlink exists (for portability across clones).

**Decision: Single story page vs. multiple.** The proposal says one narrative page. The site spec mentions `story/lifestyle-creep.qmd` and `story/job-changes.qmd`. We'll stub `story/index.qmd` as the single entry point for now; Phase 2 decides the final page structure.

**Decision: `freeze: auto`.** Quarto's freeze feature caches Python cell outputs so CI doesn't need to re-execute them unless the `.qmd` changes. This is critical since Phase 1 stubs have no Python, and Phase 2 will add Python-rendered charts that should only re-render when their source changes.

### 4. Analysis package structure

```
analysis/
  __init__.py
  schemas.py            # Polars schema definitions for 3 tables
  build_public_data.py  # reads private → scales → aggregates → writes public
  story_charts.py       # stub for Phase 2
```

**`schemas.py`** defines column names, types, and valid values as Python constants. This includes the shared 7-column flow schema (date, flow_type, source, destination, sub_category, category, value), the category/sub_category hierarchies for expenses and income, and the event types. Single source of truth for both the builder and downstream consumers.

**`build_public_data.py`** is a refactored version of the existing `data_public/private_to_public.py`. It reads `data_private/categorized_budget_items_formatted.parquet`, applies a random scale factor (0.5–2.0) for privacy, filters to ≤ 2023-12-31, groups by month + flow dimensions, and writes the 3 output Parquet files. Also hardcodes the 11 life events. Invoked as `python -m analysis.build_public_data`.

**`story_charts.py`** is a stub file — Phase 2 fills it in.

### 5. Data schema contracts

Matching the existing Parquet files exactly:

**expenses_monthly.parquet** (2345 rows, ~27KB)
| Column | Type | Notes |
|---|---|---|
| date | Date | First of month (YYYY-MM-01), range 2009-10 to 2023-10 |
| flow_type | String | Always "Expense" |
| source | String | "General Funds" or "Savings" |
| destination | String | 12 values: Children, Clothing, Entertainment, Food, Gifts/Charity, Healthcare/Insurance, Housing, Miscellaneous, Savings, Transportation, Travel, Unknown |
| sub_category | String | 23 values (nested under destination/category) |
| category | String | 12 values (matches destination except Savings→"Savings/Investments") |
| value | Float64 | Positive = expense (scaled by random factor for privacy) |

**income_monthly.parquet** (370 rows, ~7KB)
| Column | Type | Notes |
|---|---|---|
| date | Date | First of month, range 2009-10 to 2023-10 |
| flow_type | String | Always "Income" |
| source | String | "Miscellaneous Income", "Reimbursements", "Salary/Wages" |
| destination | String | "General Funds" or "Savings" |
| sub_category | String | 7 values: Gift Income, Interest/Dividends, Refunds/Rebates, Salary/Wages, Side Hustle, Transfer between accounts, Unknown Income |
| category | String | 4 values: Miscellaneous Income, Reimbursements, Salary/Wages, Transfer between accounts |
| value | Float64 | Negative = income (scaled) |

**events_public.parquet** (11 rows, ~2KB)
| Column | Type | Notes |
|---|---|---|
| date_start | Date | Event window start |
| date_end | Date | Event window end |
| event | String | Human-readable label (e.g., "Moved to Singapore", "Birth of child #1") |
| type | String | 4 values: career, move, family, education |

Note: The flow schema is designed for Sankey diagrams — source/destination represent money flow directions, making it natural to visualize as a Sankey without transformation.

### 6. CI/CD workflow

```yaml
# .github/workflows/publish.yml
on:
  push:
    branches: [main]

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    steps:
      - Checkout
      - Setup Python 3.13
      - Install uv
      - uv sync
      - Quarto render site/
      - Deploy to GitHub Pages (actions/deploy-pages)
```

**Decision: Don't regenerate data in CI.** The Parquet files are committed to `data_public/` and small (~36KB total). Regenerating them in CI requires private data and a random scale factor, adding complexity for no benefit. CI just renders the Quarto site.

**Decision: Use `actions/deploy-pages` (not gh-pages branch).** The modern GitHub Pages deployment uses artifacts + the Pages API directly, avoiding the need for a `gh-pages` branch and force pushes.

### 7. Pre-render symlink script

`site/_pre-render.py` creates the `site/data_public → ../../data_public` symlink if it doesn't already exist. Quarto runs this automatically via the `pre-render` config in `_quarto.yml`. This ensures the symlink is present on fresh clones and in CI without requiring manual setup.

## Risks / Trade-offs

**Non-deterministic scaling** — The existing pipeline uses `rng.uniform(0.5, 2.0)` without a fixed seed, so each run produces different values. The committed Parquet files are the canonical output; re-running the pipeline overwrites them with new scaled values.
→ Mitigation: Only re-run the pipeline intentionally when updating data. Don't regenerate in CI.

**Quarto not installed locally** — Developers can't preview the site locally without installing Quarto. CI handles rendering.
→ Mitigation: Document in README. Quarto install is straightforward if someone wants local preview.

**`freeze: auto` and stale caches** — If a `.qmd` with Python cells is edited but the freeze cache isn't updated, CI may serve stale output.
→ Mitigation: Phase 1 stubs have no Python cells, so no risk yet. Phase 2 will need to address this (likely by running `quarto render` in CI without freeze, or by committing `_freeze/` directory).

**Symlink portability** — Git symlinks work on Linux/macOS but can be problematic on Windows.
→ Mitigation: The pre-render script recreates the symlink, so even if git doesn't preserve it, the build still works. Windows development is not a priority.
