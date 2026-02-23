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
The site SHALL include `site/story/index.qmd` and `site/explore/index.qmd` as placeholder pages.

#### Scenario: Story stub content
- **WHEN** a user navigates to the Story section
- **THEN** the page SHALL display a placeholder indicating narrative content is coming in a future phase

#### Scenario: Explore stub content
- **WHEN** a user navigates to the Explore section
- **THEN** the page SHALL display a placeholder indicating interactive exploration is coming in a future phase

### Requirement: Global CSS
The site SHALL include a `site/assets/css/styles.css` stylesheet referenced in `_quarto.yml`.

#### Scenario: Stylesheet is loaded
- **WHEN** any page on the site is rendered
- **THEN** the output HTML SHALL include a link to the custom stylesheet

### Requirement: Pre-render symlink script
The site SHALL include a `site/_pre-render.py` script configured in `_quarto.yml` as a pre-render step. The script SHALL create the `site/data_public` symlink pointing to `../../data_public` if it does not already exist.

#### Scenario: Symlink does not exist
- **WHEN** the pre-render script runs and `site/data_public` does not exist
- **THEN** the script SHALL create a symbolic link `site/data_public → ../../data_public`

#### Scenario: Symlink already exists
- **WHEN** the pre-render script runs and `site/data_public` already exists
- **THEN** the script SHALL take no action and exit successfully

#### Scenario: Script runs before render
- **WHEN** `quarto render` is invoked
- **THEN** the pre-render script SHALL execute before any `.qmd` files are processed
