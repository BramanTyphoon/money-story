## ADDED Requirements

### Requirement: Per-category expense data function
The `analysis/story_charts.py` module SHALL provide a `get_expenses_by_category` function that accepts an optional file path for expenses data and returns a list of dictionaries with keys `date`, `category`, and `value`, representing monthly expense totals per category.

#### Scenario: Expense filtering
- **WHEN** the function reads `expenses_monthly.parquet`
- **THEN** it SHALL exclude rows where `sub_category` is "Savings/Investments" or "Transfer between accounts", or where `destination` is "Savings"

#### Scenario: Category grouping
- **WHEN** the filtered data is processed
- **THEN** it SHALL group by `date` and `category` (using the `category` column), sum the `value` column, and return one record per date-category combination

#### Scenario: Output format
- **WHEN** the function returns data
- **THEN** each record SHALL be a dictionary with `date` (ISO date string), `category` (string), and `value` (number), suitable for JSON serialization via `ojs_define()`

#### Scenario: Default file path
- **WHEN** the function is called with no arguments from a Python cell in a `.qmd` file rendered from `site/`
- **THEN** it SHALL find `expenses_monthly.parquet` via the `data_public/` symlink without error

### Requirement: Event data function
The `analysis/story_charts.py` module SHALL provide a `get_events` function that accepts an optional file path for events data and returns a list of dictionaries with keys `date_start`, `date_end`, `event`, and `type`, suitable for JSON serialization via `ojs_define()`.

#### Scenario: Output format
- **WHEN** the function returns data
- **THEN** each record SHALL be a dictionary with `date_start` (ISO date string), `date_end` (ISO date string), `event` (string), and `type` (string)

#### Scenario: Default file path
- **WHEN** the function is called with no arguments from a Python cell in a `.qmd` file rendered from `site/`
- **THEN** it SHALL find `events_public.parquet` via the `data_public/` symlink without error

### Requirement: Category checkbox input
The Story page SHALL display an OJS `Inputs.checkbox()` control listing all expense categories present in the data.

#### Scenario: Initial state
- **WHEN** the page loads
- **THEN** all categories SHALL be selected by default

#### Scenario: Category list
- **WHEN** the checkbox input is rendered
- **THEN** it SHALL list every distinct `category` value from the embedded expense data

### Requirement: Dynamic aggregate computation
When the user toggles categories, the chart SHALL recompute the aggregate monthly expense total by summing only the selected categories for each month.

#### Scenario: All categories selected
- **WHEN** all categories are selected
- **THEN** the aggregate line SHALL match the shape of the existing static expense chart

#### Scenario: Category deselected
- **WHEN** a user deselects one or more categories
- **THEN** the aggregate monthly totals SHALL decrease by the deselected categories' contributions and the chart SHALL update immediately

#### Scenario: No categories selected
- **WHEN** no categories are selected
- **THEN** the chart SHALL display flat zero values

### Requirement: Dynamic rolling average
The chart SHALL display a 7-month centered rolling average that recomputes when the category selection changes.

#### Scenario: Rolling average computation
- **WHEN** the aggregate monthly totals are recomputed
- **THEN** the rolling average SHALL use a 7-month centered window with `min_periods=1` behavior (partial windows at edges produce averages of available data)

#### Scenario: Rolling average trace styling
- **WHEN** the rolling average is rendered
- **THEN** it SHALL appear as a thicker, fully opaque line matching the color scheme of the existing static expense chart's rolling average

### Requirement: Life-event annotations
The interactive chart SHALL display life-event vertical region annotations matching the existing static expense chart.

#### Scenario: Event rendering
- **WHEN** the chart is rendered
- **THEN** it SHALL display a `vrect`-style shaded region for each life event, colored by event type (career=blue, move=orange, family=green, education=purple) with semi-transparent fill and the event name as a label

#### Scenario: Annotations persist across toggles
- **WHEN** the user toggles categories
- **THEN** the event annotations SHALL remain visible and unchanged

### Requirement: Visual consistency with static chart
The interactive chart SHALL match the visual style of the existing static expense chart.

#### Scenario: Layout parameters
- **WHEN** the chart is rendered
- **THEN** it SHALL use the `plotly_white` template, the same axis labels ("Date", "Monthly Expenses (USD, scaled)"), and the same chart dimensions (1100x500)

#### Scenario: Trace colors
- **WHEN** the monthly and rolling average traces are rendered
- **THEN** the monthly trace SHALL use `rgba(214, 39, 40, 0.4)` with width 1, and the rolling average SHALL use `rgba(214, 39, 40, 1)` with width 3

### Requirement: Chart rendering via Plotly.react()
The OJS cell SHALL use `Plotly.react()` to update the chart div when the category selection changes.

#### Scenario: Efficient updates
- **WHEN** the user toggles a category
- **THEN** the chart SHALL update via `Plotly.react()` (not `Plotly.newPlot()`) to avoid flicker and unnecessary re-rendering
