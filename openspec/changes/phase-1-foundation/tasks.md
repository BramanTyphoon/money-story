## 1. Project Setup

- [x] 1.1 Create `pyproject.toml` with hatchling build backend, `[tool.hatch.build.targets.wheel] packages = ["analysis"]`, and dependencies (polars, numpy, plotly, kaleido)
- [x] 1.2 Create `analysis/__init__.py`
- [x] 1.3 Remove stale `analysis/__pycache__/` directory

## 2. Data Pipeline

- [x] 2.1 Create `analysis/schemas.py` with Polars schema definitions for expenses_monthly (7-col flow schema), income_monthly (same schema), and events_public (4-col event schema), including all valid categorical values
- [x] 2.2 Create `analysis/build_public_data.py` by refactoring `data_public/private_to_public.py` into the analysis package — read private parquet, filter dates, apply random scale factor, aggregate expenses and income by month+flow dimensions, write 11 hardcoded life events, output all 3 parquet files to `data_public/`
- [x] 2.3 Make `build_public_data.py` runnable via `python -m analysis.build_public_data` with clear error message if private data is missing
- [x] 2.4 Remove `data_public/private_to_public.py` after migration

## 3. Quarto Site Scaffold

- [x] 3.1 Create `site/_quarto.yml` with project type website, output-dir `_site`, `freeze: auto`, navbar (Home, Story, Explore), custom CSS reference, and pre-render script config
- [x] 3.2 Create `site/_pre-render.py` that creates the `site/data_public → ../../data_public` symlink if it doesn't exist
- [x] 3.3 Create `site/index.qmd` landing page with project overview, privacy/methodology notes, and links to Story and Explore sections (static markdown only, no Python cells)
- [x] 3.4 Create `site/story/index.qmd` stub placeholder page
- [x] 3.5 Create `site/explore/index.qmd` stub placeholder page
- [x] 3.6 Create `site/assets/css/styles.css` with minimal global styles

## 4. Stub Files for Phase 2

- [x] 4.1 Create `analysis/story_charts.py` as an empty stub for Phase 2

## 5. CI/CD

- [x] 5.1 Create `.github/workflows/publish.yml` — trigger on push to main, set up Python 3.13, install uv, run `uv sync`, install Quarto, run `quarto render site/`, deploy to GitHub Pages via `actions/deploy-pages` with `pages: write` and `id-token: write` permissions
