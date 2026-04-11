## ADDED Requirements

### Requirement: Savings accumulation chart function
The `analysis/story_charts.py` module SHALL provide a `plot_savings_over_time` function that accepts optional file paths for expenses data and events data, and returns a `plotly.graph_objects.Figure` showing cumulative savings accumulation over time.

#### Scenario: Savings filter
- **WHEN** the function reads `expenses_monthly.parquet`
- **THEN** it SHALL select all rows where `destination == "Savings"` OR `sub_category == "Savings/Investments"` (inflows) OR `source == "Savings"` (outflows/withdrawals)

#### Scenario: Signed value calculation
- **WHEN** a savings-related row has `source == "Savings"` AND `sub_category != "Savings/Investments"`
- **THEN** its contribution SHALL be negated (subtracted), representing a spending withdrawal from savings
- **WHEN** a row has `source == "Savings"` AND `sub_category == "Savings/Investments"`
- **THEN** its contribution SHALL be positive (not subtracted), as it represents a transfer between savings/investment accounts that remains within savings
- **WHEN** a row has `destination == "Savings"` or `sub_category == "Savings/Investments"`
- **THEN** its contribution SHALL be positive (added), representing a deposit into savings

#### Scenario: Monthly aggregation
- **WHEN** the signed values are computed
- **THEN** it SHALL group by `date` and sum the signed values to produce one net savings amount per month

#### Scenario: Cumulative sum
- **WHEN** the monthly net totals are computed
- **THEN** it SHALL sort by `date` ascending and apply a cumulative sum, so each data point represents net savings accumulated from the start of the dataset through that month

#### Scenario: Single cumulative line trace
- **WHEN** the figure is generated
- **THEN** it SHALL contain exactly one line trace showing the cumulative savings series, colored blue (`rgba(31, 119, 180, ...)`)
- **THEN** it SHALL NOT contain a rolling average trace

#### Scenario: Event annotations
- **WHEN** the function reads `events_public.parquet`
- **THEN** it SHALL add a `vrect` annotation for each life event spanning its date range, colored by event type (career=blue, move=orange, family=green, education=purple) with semi-transparent fill and the event name as a label, identical in style to the existing chart functions

#### Scenario: Y-axis label
- **WHEN** the figure layout is configured
- **THEN** the y-axis title SHALL be `"Cumulative Savings (USD, scaled)"`

#### Scenario: Default file paths
- **WHEN** the function is called with no arguments from a Python cell in a `.qmd` file rendered from `site/`
- **THEN** it SHALL read from `data_public/expenses_monthly.parquet` and `data_public/events_public.parquet` via the symlink, without error

#### Scenario: Figure return
- **WHEN** the function is called and the result is the last expression in a Quarto Python cell
- **THEN** Quarto SHALL render the figure as an interactive Plotly HTML widget in the page output
