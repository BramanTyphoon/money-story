## ADDED Requirements

### Requirement: SQL playground module
The site SHALL include a `site/assets/js/sql_playground.js` ES module that provides a curated SQL query interface backed by DuckDB-Wasm.

#### Scenario: Module initialization
- **WHEN** the explore page loads and DuckDB-Wasm initialization completes
- **THEN** the SQL playground section SHALL become interactive with a recipe dropdown, query textarea, and Run button

### Requirement: Curated SQL recipes
The playground SHALL provide a dropdown of pre-written SQL queries that users can select as starting points.

#### Scenario: Recipe list
- **WHEN** the user opens the recipe dropdown
- **THEN** it SHALL list at least these recipes: "Monthly totals by category (year)", "Top N categories (date range)", "Year-over-year change by category", "Income vs expenses by year", "Monthly savings rate"

#### Scenario: Recipe selection
- **WHEN** the user selects a recipe from the dropdown
- **THEN** the textarea SHALL be populated with the recipe's SQL, including placeholder parameter values (e.g., a specific year) that the user can modify

#### Scenario: Default state
- **WHEN** the playground first loads
- **THEN** the first recipe SHALL be selected and its SQL displayed in the textarea

### Requirement: Editable query textarea
The playground SHALL display a textarea containing the current SQL query that users can freely edit.

#### Scenario: User edits query
- **WHEN** the user modifies the SQL text in the textarea
- **THEN** the modified query SHALL be used when the Run button is clicked

#### Scenario: Recipe resets edits
- **WHEN** the user selects a different recipe after editing
- **THEN** the textarea SHALL be replaced with the new recipe's SQL

### Requirement: Run button and query execution
The playground SHALL include a "Run" button that executes the current SQL against DuckDB-Wasm.

#### Scenario: Successful query execution
- **WHEN** the user clicks "Run" with valid SQL
- **THEN** the module SHALL execute the query via `runQuery()` and display results in a table below the textarea

#### Scenario: Query error
- **WHEN** the user clicks "Run" with invalid SQL
- **THEN** the module SHALL display the error message in a styled error block below the textarea

#### Scenario: Empty result
- **WHEN** a query returns zero rows
- **THEN** the module SHALL display a message indicating no results were returned

### Requirement: Result table rendering
Query results SHALL be rendered as an HTML table.

#### Scenario: Table structure
- **WHEN** results are displayed
- **THEN** the table SHALL have a header row with column names and one data row per result row

#### Scenario: Large result sets
- **WHEN** a query returns more than 100 rows
- **THEN** the table SHALL display the first 100 rows with a note indicating the total row count and that results are truncated

### Requirement: Available tables reference
The playground section SHALL display a reference listing the available tables and their columns.

#### Scenario: Table reference display
- **WHEN** the playground section is visible
- **THEN** it SHALL show a collapsible or always-visible reference listing: `expenses_monthly` (date, flow_type, source, destination, sub_category, category, value), `income_monthly` (same columns), and `events_public` (date_start, date_end, event, type)
