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
- **THEN** it SHALL contain a 7-month centered rolling average trace as a secondary line (lighter, thicker) using `min_periods=1` to avoid gaps at the start

#### Scenario: Income event annotations
- **WHEN** the function reads `events_public.parquet`
- **THEN** it SHALL add a `vrect` annotation for each life event spanning its date range, colored by event type (career=blue, move=orange, family=green, education=purple) with semi-transparent fill and the event name as a label

### Requirement: Expenses over time chart function
The `analysis/story_charts.py` module SHALL provide a `plot_expenses_over_time` function that accepts optional file paths for expenses data and events data, an optional `exclude_categories` list to remove specific categories from the aggregation, an optional `title` string, and returns a `plotly.graph_objects.Figure` showing total monthly expenditures over time.

#### Scenario: Category exclusion
- **WHEN** the function is called with `exclude_categories=["Housing", "Children"]`
- **THEN** it SHALL exclude rows where the `category` column matches any value in the list, after applying the standard savings/transfer filter

#### Scenario: Custom title
- **WHEN** the function is called with a non-empty `title` string
- **THEN** the figure layout SHALL include that string as the chart title
- **WHEN** the function is called without a `title` or with an empty string
- **THEN** the figure SHALL have no title

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

### Requirement: Savings accumulation chart function
The `analysis/story_charts.py` module SHALL provide a `plot_savings_over_time` function that accepts optional file paths for expenses data, income data, and events data, and returns a `plotly.graph_objects.Figure` showing cumulative savings accumulation over time.

#### Scenario: Data loading
- **WHEN** the function is called
- **THEN** it SHALL read both `expenses_monthly.parquet` and `income_monthly.parquet` and concatenate them into a single DataFrame before computing signed values

#### Scenario: Signed value calculation
The function assigns a signed value to every row (no rows are filtered out):
- **WHEN** a row has `source == "Savings"` AND `sub_category` is not `"Savings/Investments"` or `"Transfer between accounts"`
- **THEN** its signed value SHALL be `-value` (a withdrawal from savings, reducing the total)
- **WHEN** a row has `destination == "Savings"` (and does not match the above condition)
- **THEN** its signed value SHALL be `+value` (a deposit into savings, increasing the total)
- **WHEN** a row matches neither of the above conditions (includes all regular expense rows and all income rows)
- **THEN** its signed value SHALL be `-value` (income rows carry negative values in the parquet, so negation makes them positive contributions; expense rows carry positive values, so negation subtracts them)

#### Scenario: Monthly aggregation
- **WHEN** the signed values are computed
- **THEN** it SHALL group by `date` and sum the signed values to produce one net savings amount per month

#### Scenario: Bounded cumulative sum
- **WHEN** the monthly net totals are computed
- **THEN** it SHALL sort by `date` ascending and apply a cumulative sum floored at `0`, so the running total never goes below zero

#### Scenario: Single cumulative line trace
- **WHEN** the figure is generated
- **THEN** it SHALL contain exactly one line trace showing the cumulative savings series, colored `rgba(31, 119, 180, 1)` with `width=2`
- **THEN** it SHALL NOT contain a rolling average trace

#### Scenario: Event annotations
- **WHEN** the function reads `events_public.parquet`
- **THEN** it SHALL add a `vrect` annotation for each life event spanning its date range, colored by event type (career=blue, move=orange, family=green, education=purple) with semi-transparent fill and the event name as a label, identical in style to the existing chart functions

#### Scenario: Y-axis label
- **WHEN** the figure layout is configured
- **THEN** the y-axis title SHALL be `"Cumulative Savings (USD, scaled)"`

#### Scenario: Default file paths
- **WHEN** the function is called with no arguments from a Python cell in a `.qmd` file rendered from `site/`
- **THEN** it SHALL read from `data_public/expenses_monthly.parquet`, `data_public/income_monthly.parquet`, and `data_public/events_public.parquet` via the symlink, without error

#### Scenario: Figure return
- **WHEN** the function is called and the result is the last expression in a Quarto Python cell
- **THEN** Quarto SHALL render the figure as an interactive Plotly HTML widget in the page output
