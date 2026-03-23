## MODIFIED Requirements

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
