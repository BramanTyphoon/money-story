## ADDED Requirements

### Requirement: Income over time chart function
The `analysis/story_charts.py` module SHALL provide a `plot_income_over_time` function that accepts optional file paths for income data and events data, and returns a `plotly.graph_objects.Figure` showing total monthly income over time.

#### Scenario: Income aggregation
- **WHEN** the function reads `income_monthly.parquet`
- **THEN** it SHALL group by `date`, sum the `value` column, and take the absolute value (raw values are negative)

#### Scenario: Income line trace
- **WHEN** the figure is generated
- **THEN** it SHALL contain a line trace of raw monthly income totals

#### Scenario: Income rolling average
- **WHEN** the figure is generated
- **THEN** it SHALL contain a 6-month rolling average trace as a secondary line (lighter, thicker) using `min_periods=1` to avoid gaps at the start

#### Scenario: Income event annotations
- **WHEN** the function reads `events_public.parquet`
- **THEN** it SHALL add a `vrect` annotation for each life event spanning its date range, colored by event type (career=blue, move=orange, family=green, education=purple) with semi-transparent fill and the event name as a label

### Requirement: Expenses over time chart function
The `analysis/story_charts.py` module SHALL provide a `plot_expenses_over_time` function that accepts optional file paths for expenses data and events data, and returns a `plotly.graph_objects.Figure` showing total monthly expenditures over time.

#### Scenario: Expense filtering
- **WHEN** the function reads `expenses_monthly.parquet`
- **THEN** it SHALL exclude rows where `sub_category` is "Savings/Investments" or "Transfer between accounts" and where `destination` is "Savings"

#### Scenario: Expense aggregation
- **WHEN** the filtered data is processed
- **THEN** it SHALL group by `date` and sum the `value` column

#### Scenario: Expense line trace
- **WHEN** the figure is generated
- **THEN** it SHALL contain a line trace of raw monthly expense totals

#### Scenario: Expense rolling average
- **WHEN** the figure is generated
- **THEN** it SHALL contain a 7-month rolling average trace as a secondary line (lighter, thicker) using `min_periods=1`

#### Scenario: Expense event annotations
- **WHEN** the function reads `events_public.parquet`
- **THEN** it SHALL add a `vrect` annotation for each life event spanning its date range, colored by event type (career=blue, move=orange, family=green, education=purple) with semi-transparent fill and the event name as a label

### Requirement: Default file paths
Both chart functions SHALL default to reading from `data_public/income_monthly.parquet`, `data_public/expenses_monthly.parquet`, and `data_public/events_public.parquet` respectively, so they work when called from a Quarto render in the `site/` directory.

#### Scenario: Functions called without arguments
- **WHEN** a chart function is called with no arguments from a Python cell in a `.qmd` file rendered from `site/`
- **THEN** it SHALL find the Parquet files via the `data_public/` symlink without error

### Requirement: Figure returns
Both chart functions SHALL return a `plotly.graph_objects.Figure` that can be displayed directly by Quarto's Python cell rendering.

#### Scenario: Figure display in Quarto
- **WHEN** a Python cell calls a chart function and the result is the last expression
- **THEN** Quarto SHALL render the figure as an interactive Plotly HTML widget in the page output
