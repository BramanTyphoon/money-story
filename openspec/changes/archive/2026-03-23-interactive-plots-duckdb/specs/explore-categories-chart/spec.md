## ADDED Requirements

### Requirement: Categories-over-time chart module
The site SHALL include a `site/assets/js/explore_charts.js` ES module that queries expense data via DuckDB-Wasm and renders a multi-series Plotly.js line chart showing monthly expense totals per category over time.

#### Scenario: Initial render
- **WHEN** the explore page loads and DuckDB-Wasm initialization completes
- **THEN** the module SHALL query `expenses_monthly` for monthly totals grouped by `category` and `date`, and render a Plotly line chart with one trace per category

#### Scenario: Expense filtering
- **WHEN** the module queries expense data
- **THEN** it SHALL exclude rows where `sub_category` is "Savings/Investments" or "Transfer between accounts", or where `destination` is "Savings"

### Requirement: Category checkbox controls
The chart section SHALL display checkbox controls listing all expense categories, allowing users to toggle individual categories on and off.

#### Scenario: Initial state
- **WHEN** the chart first renders
- **THEN** all category checkboxes SHALL be checked and all category traces SHALL be visible

#### Scenario: Category deselected
- **WHEN** a user unchecks a category
- **THEN** the chart SHALL immediately remove that category's trace and recompute any aggregate or moving average based only on the remaining selected categories

#### Scenario: Category reselected
- **WHEN** a user re-checks a previously unchecked category
- **THEN** the chart SHALL immediately restore that category's trace and recompute aggregates

#### Scenario: No categories selected
- **WHEN** all categories are unchecked
- **THEN** the chart SHALL display an empty plot area with axes but no traces

### Requirement: Adjustable moving average window
The chart section SHALL display a control (e.g., slider or number input) that lets users set the moving average window from 1 to 12 months.

#### Scenario: Default window
- **WHEN** the chart first renders
- **THEN** the moving average window SHALL default to 7 months

#### Scenario: Window adjusted
- **WHEN** the user changes the moving average window value
- **THEN** the chart SHALL recompute and display the rolling average for the aggregate of selected categories using the new window size, with centered windowing and partial windows at edges

#### Scenario: Window set to 1
- **WHEN** the user sets the moving average window to 1
- **THEN** the rolling average trace SHALL match the raw monthly values exactly (no smoothing)

### Requirement: Aggregate trace with rolling average
The chart SHALL display both a raw aggregate trace (sum of selected categories per month) and a rolling average trace.

#### Scenario: Aggregate computation
- **WHEN** categories are selected
- **THEN** the chart SHALL show a raw monthly aggregate trace summing all selected categories for each month

#### Scenario: Rolling average trace
- **WHEN** the chart renders
- **THEN** it SHALL display a rolling average trace computed over the aggregate, using a centered window of the user-specified size with `min_periods=1` behavior

#### Scenario: Trace styling
- **WHEN** the aggregate and rolling average traces are rendered
- **THEN** the raw aggregate trace SHALL use a semi-transparent line and the rolling average SHALL use a thicker, fully opaque line

### Requirement: Life-event annotations
The chart SHALL display life-event annotations matching the style of the static story charts.

#### Scenario: Event rendering
- **WHEN** the chart is rendered
- **THEN** it SHALL query `events_public` and display a shaded vertical region for each life event, colored by event type (career=blue, move=orange, family=green, education=purple) with semi-transparent fill and the event name as a label

#### Scenario: Annotations persist across interactions
- **WHEN** the user toggles categories or adjusts the moving average window
- **THEN** the event annotations SHALL remain visible and unchanged

### Requirement: Zoom and pan
The chart SHALL support Plotly's native zoom and pan interactions on both axes.

#### Scenario: Zoom persists across updates
- **WHEN** the user has zoomed into a time range and then toggles a category or adjusts the moving average
- **THEN** the chart SHALL maintain the current zoom level and axis ranges via `Plotly.react()`

### Requirement: Chart rendering via Plotly.react()
The chart SHALL use `Plotly.react()` for all updates after the initial render.

#### Scenario: Efficient updates
- **WHEN** the user toggles a category or changes the moving average window
- **THEN** the chart SHALL update via `Plotly.react()` to preserve zoom state and avoid flicker
