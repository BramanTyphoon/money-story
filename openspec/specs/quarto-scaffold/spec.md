## ADDED Requirements

### Requirement: Quarto project configuration
The site SHALL have a `site/_quarto.yml` that configures the Quarto project with type `website`, sets the output directory to `_site`, and enables `freeze: auto`.

#### Scenario: Quarto recognizes the project
- **WHEN** `quarto render` is run from the `site/` directory
- **THEN** Quarto SHALL process all `.qmd` files and output to `site/_site/`

#### Scenario: Freeze caching is active
- **WHEN** a `.qmd` file with Python cells has not changed since last render
- **THEN** Quarto SHALL use cached output instead of re-executing Python cells

### Requirement: Navbar with three sections
The site SHALL have a top navigation bar with three entries: Home, Story, and Explore.

#### Scenario: Home link
- **WHEN** a user clicks "Home" in the navbar
- **THEN** the browser SHALL navigate to `index.html`

#### Scenario: Story link
- **WHEN** a user clicks "Story" in the navbar
- **THEN** the browser SHALL navigate to `story/index.html`

#### Scenario: Explore link
- **WHEN** a user clicks "Explore" in the navbar
- **THEN** the browser SHALL navigate to `explore/index.html`

### Requirement: Landing page
The site SHALL have a `site/index.qmd` landing page that introduces the project, explains what data is public vs private, and describes the methodology.

#### Scenario: Landing page renders without Python
- **WHEN** `quarto render` processes `index.qmd`
- **THEN** the page SHALL render using only static Markdown content (no Python cells)

#### Scenario: Landing page content
- **WHEN** a user visits the site root
- **THEN** the page SHALL display a project overview, a note on privacy approach (aggregated data only, values scaled), and links to Story and Explore sections

### Requirement: Stub pages for Story and Explore
The site SHALL include `site/explore/index.qmd` as a full interactive exploration page with three sections (Categories Over Time, Sankey Diagram, SQL Playground) backed by DuckDB-Wasm. The `site/story/index.qmd` SHALL be a rough-draft narrative page containing Python code cells that render charts from `analysis.story_charts` and placeholder prose for the author to personalize.

#### Scenario: Story page renders with charts
- **WHEN** `quarto render` processes `story/index.qmd`
- **THEN** the page SHALL execute Python code cells that call `plot_income_over_time()`, `plot_expenses_over_time()`, and `plot_expenses_over_time(exclude_categories=["Housing", "Children"])` and embed the resulting Plotly figures

#### Scenario: Story page structure
- **WHEN** a user navigates to the Story section
- **THEN** the page SHALL display a title, introductory prose, an income chart with narrative, an expenses chart with narrative, an expenses-excluding-housing-and-childcare chart with narrative, and each chart SHALL have a figure caption (e.g., "Figure 1. ...")

#### Scenario: Python cells are hidden
- **WHEN** the story page is rendered
- **THEN** Python code cells SHALL use `#| echo: false` so source code is not visible to readers

#### Scenario: Explore page structure
- **WHEN** a user navigates to the Explore section
- **THEN** the page SHALL display three interactive sections: Categories Over Time, Sankey Diagram, and SQL Playground, each with its own heading and controls

#### Scenario: Explore page loads DuckDB-Wasm
- **WHEN** the explore page loads in a browser
- **THEN** it SHALL initialize DuckDB-Wasm via `duckdb_init.js` and display a loading indicator until initialization completes

#### Scenario: Explore page loads JS modules
- **WHEN** DuckDB-Wasm initialization completes
- **THEN** the page SHALL activate the three interactive sections by loading `explore_charts.js`, `sankey.js`, and `sql_playground.js` as ES modules

#### Scenario: Explore page loads Plotly.js
- **WHEN** the explore page is rendered
- **THEN** it SHALL load Plotly.js from CDN for chart rendering

#### Scenario: Freeze caching of story page
- **WHEN** `story/index.qmd` has been rendered once and has not changed
- **THEN** subsequent renders SHALL use the cached output from `_freeze/` without re-executing Python cells

#### Scenario: Explore page has no Python cells
- **WHEN** `quarto render` processes `explore/index.qmd`
- **THEN** the page SHALL render without executing any Python code (all interactivity is client-side JS)

### Requirement: Global CSS
The site SHALL include a `site/assets/css/styles.css` stylesheet referenced in `_quarto.yml`.

#### Scenario: Stylesheet is loaded
- **WHEN** any page on the site is rendered
- **THEN** the output HTML SHALL include a link to the custom stylesheet

### Requirement: Quarto resource declaration
The `_quarto.yml` SHALL declare `assets/js/**` under `project.resources` so that JS modules are copied to `_site/` during render.

#### Scenario: JS modules available in output
- **WHEN** `quarto render` completes
- **THEN** all files under `site/assets/js/` SHALL be copied to `site/_site/assets/js/`

### Requirement: Pre-render symlink and data copy script
The site SHALL include a `site/_pre-render.py` script configured in `_quarto.yml` as a pre-render step. The script SHALL create the `site/data_public` symlink pointing to `../../data_public` if it does not already exist, and SHALL copy Parquet files from `data_public/` to `_site/data_public/` for browser fetch.

#### Scenario: Symlink does not exist
- **WHEN** the pre-render script runs and `site/data_public` does not exist
- **THEN** the script SHALL create a symbolic link `site/data_public → ../data_public`

#### Scenario: Symlink already exists
- **WHEN** the pre-render script runs and `site/data_public` already exists
- **THEN** the script SHALL take no action on the symlink

#### Scenario: Parquet files copied to _site
- **WHEN** the pre-render script runs
- **THEN** it SHALL copy all `.parquet` files from the resolved `data_public/` directory to `_site/data_public/`, creating the directory if needed, and only copy files that are newer than the destination

#### Scenario: Script runs before render
- **WHEN** `quarto render` is invoked
- **THEN** the pre-render script SHALL execute before any `.qmd` files are processed
