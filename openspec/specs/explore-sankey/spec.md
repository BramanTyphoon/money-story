## ADDED Requirements

### Requirement: Sankey diagram module
The site SHALL include a `site/assets/js/sankey.js` ES module that queries expense and income data via DuckDB-Wasm for a user-selected date range and renders a Plotly.js Sankey diagram showing money flows from income sources through general funds to expense categories.

#### Scenario: Initial render
- **WHEN** the explore page loads and DuckDB-Wasm initialization completes
- **THEN** the module SHALL render a Sankey diagram for the first calendar year in the dataset

#### Scenario: Sankey trace type
- **WHEN** the diagram is rendered
- **THEN** it SHALL use a Plotly `Sankey` trace with `valueformat: ".0f"` and `valuesuffix: " USD"`

### Requirement: Brush-selectable time series for date range
The Sankey section SHALL display a time series chart above the Sankey diagram showing monthly expenses and income (raw values and 7-month rolling averages). The user selects a date range by click-and-dragging horizontally on this chart.

#### Scenario: Time series traces
- **WHEN** the time series chart is rendered
- **THEN** it SHALL display four traces: raw monthly expenses, expenses 7-month rolling average, raw monthly income, and income 7-month rolling average

#### Scenario: Initial selection
- **WHEN** the page loads
- **THEN** the time series SHALL highlight the first calendar year of data with a shaded rectangle, and the Sankey SHALL render for that period

#### Scenario: Brush selection updates Sankey
- **WHEN** the user clicks and drags horizontally on the time series chart
- **THEN** the module SHALL extract the selected date range, update the highlight rectangle, and re-render the Sankey diagram for the selected period

#### Scenario: Horizontal-only selection
- **WHEN** the user drags on the time series
- **THEN** the selection SHALL be constrained to the horizontal (time) axis only via `selectdirection: "h"`

### Requirement: Category translation
The Sankey module SHALL apply category translation maps that consolidate sub-categories into broader groups, matching the logic of the existing Python implementation.

#### Scenario: Expense category mapping
- **WHEN** expense flows are processed
- **THEN** sub-categories SHALL be mapped to consolidated categories: Housing (Rent/Mortgage, Utilities, Home Maintenance/Improvement, Household Goods), Food (Groceries, Dining Out), Entertainment (Media/Subscriptions, Entertainment, Parent Enrichment/Education, Hobbies, Sports/Outdoors), Transportation (Transportation, Car/Car Maintenance), Healthcare/Insurance, Children (Child Education/Childcare), Travel, Clothing, Gifts/Charity (Charity, Gifts), Miscellaneous, General Funds, Savings/Investments (Savings/Investments, Transfer between accounts)

#### Scenario: Income category mapping
- **WHEN** income flows are processed
- **THEN** sub-categories SHALL be mapped to: Salary/Wages (Salary/Wages, Side Hustle), Miscellaneous Income (Unknown Income, Interest/Dividends, Gift Income), Reimbursements (Refunds/Rebates)

### Requirement: Flow source and destination assignment
The Sankey module SHALL assign source and destination nodes for each flow based on flow type and category.

#### Scenario: Income flow routing
- **WHEN** an income flow is processed
- **THEN** its destination SHALL be "General Funds" (unless it maps to a wealth category, in which case destination is "Savings"), and its source SHALL be the mapped income category (or "Reimbursements" if the sub-category is an expense-type category)

#### Scenario: Expense flow routing
- **WHEN** an expense flow is processed
- **THEN** its source SHALL be "General Funds" (or "Savings" if the original source is "Savings"), and its destination SHALL be the mapped expense category (or "Savings" if the category is a wealth category)

#### Scenario: Self-referential flows excluded
- **WHEN** a flow has the same source and destination after mapping
- **THEN** it SHALL be excluded from the diagram

### Requirement: Carryover nodes
The Sankey diagram SHALL include "General Carryover" and "Savings Carryover" nodes representing accumulated balances from all periods before the selected date range.

#### Scenario: General carryover computation
- **WHEN** the diagram is generated for a date range
- **THEN** the module SHALL query all income and expense flows before the start date (excluding savings flows) and compute the net balance as the "General Carryover" value flowing into "General Funds"

#### Scenario: Savings carryover computation
- **WHEN** the diagram is generated for a date range
- **THEN** the module SHALL query all flows to/from "Savings" before the start date and compute the net balance as the "Savings Carryover" value flowing into "Savings"

#### Scenario: First period selected
- **WHEN** the selected start date is the earliest date in the dataset
- **THEN** carryover values SHALL be zero (no prior data)

### Requirement: Node and link styling
The Sankey diagram SHALL use consistent colors matching the existing Python implementation's color scheme.

#### Scenario: Node colors
- **WHEN** nodes are rendered
- **THEN** each category node SHALL use a color from the standard Plotly categorical palette at 0.8 opacity, carryover nodes SHALL use grey (`rgba(150,150,150,0.8)`)

#### Scenario: Link colors
- **WHEN** links are rendered
- **THEN** each link SHALL use the destination node's color at reduced opacity (0.4 by default)

#### Scenario: Node layout
- **WHEN** the Sankey is rendered
- **THEN** nodes SHALL use `pad: 15`, `thickness: 15`, and a black outline with width 0.5

### Requirement: Diagram title
The Sankey diagram SHALL display a title reflecting the selected date range.

#### Scenario: Title format
- **WHEN** the diagram is rendered for a date range
- **THEN** the title SHALL read "{start_month} {start_year} – {end_month} {end_year} Budget Sankey Diagram (in 2019 USD)"
