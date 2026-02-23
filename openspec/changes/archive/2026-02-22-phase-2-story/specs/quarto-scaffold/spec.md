## MODIFIED Requirements

### Requirement: Stub pages for Story and Explore
The site SHALL include `site/explore/index.qmd` as a placeholder page. The `site/story/index.qmd` SHALL be a rough-draft narrative page containing Python code cells that render charts from `analysis.story_charts` and placeholder prose for the author to personalize.

#### Scenario: Story page renders with charts
- **WHEN** `quarto render` processes `story/index.qmd`
- **THEN** the page SHALL execute Python code cells that call `plot_income_over_time()` and `plot_expenses_over_time()` and embed the resulting Plotly figures

#### Scenario: Story page structure
- **WHEN** a user navigates to the Story section
- **THEN** the page SHALL display a title, introductory prose, an income chart with surrounding narrative, an expenses chart with surrounding narrative, and closing prose

#### Scenario: Python cells are hidden
- **WHEN** the story page is rendered
- **THEN** Python code cells SHALL use `#| echo: false` so source code is not visible to readers

#### Scenario: Explore stub unchanged
- **WHEN** a user navigates to the Explore section
- **THEN** the page SHALL still display a placeholder indicating interactive exploration is coming in a future phase

#### Scenario: Freeze caching of story page
- **WHEN** `story/index.qmd` has been rendered once and has not changed
- **THEN** subsequent renders SHALL use the cached output from `_freeze/` without re-executing Python cells
