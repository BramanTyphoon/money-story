## ADDED Requirements

### Requirement: Workflow trigger
The GitHub Actions workflow at `.github/workflows/publish.yml` SHALL trigger on pushes to the `main` branch.

#### Scenario: Push to main triggers build
- **WHEN** a commit is pushed to the `main` branch
- **THEN** the workflow SHALL start automatically

#### Scenario: Push to other branches does not trigger
- **WHEN** a commit is pushed to a branch other than `main`
- **THEN** the workflow SHALL NOT trigger

### Requirement: Python environment setup
The workflow SHALL set up Python 3.13 and install project dependencies using `uv`.

#### Scenario: Python and dependencies installed
- **WHEN** the setup steps run
- **THEN** Python 3.13 SHALL be available and `uv sync` SHALL install all dependencies from `pyproject.toml`

### Requirement: Quarto site rendering
The workflow SHALL install Quarto and render the site from the `site/` directory.

#### Scenario: Quarto renders successfully
- **WHEN** the render step runs
- **THEN** `quarto render site/` SHALL produce output in `site/_site/`

#### Scenario: Pre-render script executes
- **WHEN** Quarto renders the site
- **THEN** the `_pre-render.py` script SHALL run first, ensuring the `data_public` symlink exists

### Requirement: GitHub Pages deployment
The workflow SHALL deploy the rendered site to GitHub Pages using the `actions/deploy-pages` action (artifact-based deployment, not gh-pages branch).

#### Scenario: Site is deployed
- **WHEN** the render step succeeds
- **THEN** the workflow SHALL upload `site/_site/` as a Pages artifact and deploy it

#### Scenario: Required permissions
- **WHEN** the workflow runs
- **THEN** it SHALL have `pages: write` and `id-token: write` permissions

### Requirement: No data regeneration in CI
The workflow SHALL NOT run the data pipeline (`analysis/build_public_data.py`). It SHALL use the committed Parquet files in `data_public/` as-is.

#### Scenario: Data files used directly
- **WHEN** the workflow renders the site
- **THEN** the Parquet files in `data_public/` SHALL be available via the `site/data_public` symlink without regeneration
