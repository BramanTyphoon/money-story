## Why

The repo has public-safe spending data (3 Parquet files) but no site infrastructure to present it. Before building narrative pages or interactive exploration, we need a deployable Quarto site skeleton, a working Python data pipeline, and CI/CD that builds and deploys to GitHub Pages. This is Phase 1 of 3 (see `docs/spec-money_story_site.md` for the full vision).

## What Changes

- Create a Quarto static site with navbar, landing page, and stub sections for Story and Explore
- Rebuild the Python `analysis` package from scratch: schemas, sample data generation, and the build-public-data pipeline
- Set up GitHub Actions CI/CD to render the Quarto site and deploy to GitHub Pages
- Establish the `pyproject.toml` with hatchling build config and Python dependencies

## Capabilities

### New Capabilities

- `quarto-scaffold`: Quarto site configuration (`_quarto.yml`), navbar with Story + Explore sections, `index.qmd` landing page, stub `.qmd` pages for future content, global CSS, and pre-render script that ensures the `site/data_public` symlink exists
- `data-pipeline`: Python package (`analysis/`) with `schemas.py` (column definitions for 3 Parquet tables) and `build_public_data.py` (reads private data, scales values by a random factor, aggregates monthly by flow/category hierarchy, outputs to `data_public/`). Replaces existing `data_public/private_to_public.py` with a proper package structure. The 3 tables are: `expenses_monthly.parquet` (2345 rows, Sankey-style source→destination flows with category/sub_category), `income_monthly.parquet` (370 rows, same schema), and `events_public.parquet` (11 life events with date ranges and types: career/move/family/education)
- `ci-cd`: GitHub Actions workflow (`.github/workflows/publish.yml`) that installs Python deps via `uv`, optionally regenerates public data, renders the Quarto site with `freeze: auto`, and deploys to GitHub Pages

### Modified Capabilities

(none — no existing specs)

## Impact

- **New files**: `pyproject.toml`, `analysis/__init__.py`, `analysis/schemas.py`, `analysis/build_public_data.py`, `site/_quarto.yml`, `site/index.qmd`, stub `.qmd` pages, `site/assets/css/styles.css`, `.github/workflows/publish.yml`
- **Dependencies**: Python (polars, numpy, plotly, kaleido), Quarto (CI-only), hatchling (build backend)
- **Data**: Existing `data_public/*.parquet` (expenses_monthly, income_monthly, events_public) consumed as-is; pipeline can regenerate from private data
- **Moves**: `data_public/private_to_public.py` → `analysis/build_public_data.py` (properly packaged)
- **Cleans up**: Stale `analysis/__pycache__/` from deleted source files
