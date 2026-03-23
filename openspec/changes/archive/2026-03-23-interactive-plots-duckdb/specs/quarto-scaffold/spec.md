## MODIFIED Requirements

### Requirement: Stub pages for Story and Explore
The site SHALL include `site/explore/index.qmd` as a full interactive exploration page with three sections (Categories Over Time, Sankey Diagram, SQL Playground) backed by DuckDB-Wasm. The `site/story/index.qmd` SHALL be a rough-draft narrative page containing Python code cells that render charts from `analysis.story_charts` and placeholder prose for the author to personalize.

#### Scenario: Story page renders with charts
- **WHEN** `quarto render` processes `story/index.qmd`
- **THEN** the page SHALL execute Python code cells that call `plot_income_over_time()` and `plot_expenses_over_time()` and embed the resulting Plotly figures

#### Scenario: Story page structure
- **WHEN** a user navigates to the Story section
- **THEN** the page SHALL display a title, introductory prose, an income chart with surrounding narrative, an expenses chart with surrounding narrative, and closing prose

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
