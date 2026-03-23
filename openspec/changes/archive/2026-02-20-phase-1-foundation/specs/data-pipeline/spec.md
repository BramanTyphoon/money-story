## ADDED Requirements

### Requirement: Python package structure
The `analysis/` directory SHALL be a proper Python package with an `__init__.py`, installable via `pyproject.toml` using hatchling as the build backend. The `pyproject.toml` SHALL declare dependencies on polars, numpy, plotly, and kaleido.

#### Scenario: Package is installable
- **WHEN** a developer runs `uv sync` in the repo root
- **THEN** the `analysis` package SHALL be installed in the virtual environment as an editable package

#### Scenario: Hatchling build config
- **WHEN** the `pyproject.toml` is read by hatchling
- **THEN** it SHALL include `[tool.hatch.build.targets.wheel] packages = ["analysis"]`

### Requirement: Schema definitions
The `analysis/schemas.py` module SHALL define the Polars schema for all 3 public Parquet tables as Python constants, including column names, types, and valid categorical values.

#### Scenario: Flow schema definition
- **WHEN** the schemas module is imported
- **THEN** it SHALL expose a schema with columns: `date` (Date), `flow_type` (String), `source` (String), `destination` (String), `sub_category` (String), `category` (String), `value` (Float64)

#### Scenario: Expense category values
- **WHEN** the schemas module is imported
- **THEN** it SHALL expose the 12 expense destination/category values (Children, Clothing, Entertainment, Food, Gifts/Charity, Healthcare/Insurance, Housing, Miscellaneous, Savings, Transportation, Travel, Unknown) and 23 sub_category values

#### Scenario: Income category values
- **WHEN** the schemas module is imported
- **THEN** it SHALL expose the income source values (Miscellaneous Income, Reimbursements, Salary/Wages), destination values (General Funds, Savings), and sub_category values (Gift Income, Interest/Dividends, Refunds/Rebates, Salary/Wages, Side Hustle, Transfer between accounts, Unknown Income)

#### Scenario: Event schema definition
- **WHEN** the schemas module is imported
- **THEN** it SHALL expose an event schema with columns: `date_start` (Date), `date_end` (Date), `event` (String), `type` (String), and valid type values: career, move, family, education

### Requirement: Build public data pipeline
The `analysis/build_public_data.py` module SHALL read private transaction data, apply privacy scaling, aggregate by month, and output 3 Parquet files to `data_public/`.

#### Scenario: Read private source
- **WHEN** the pipeline runs
- **THEN** it SHALL read `data_private/categorized_budget_items_formatted.parquet` using Polars

#### Scenario: Date filtering
- **WHEN** the pipeline processes raw data
- **THEN** it SHALL filter to records with date ≤ 2023-12-31

#### Scenario: Privacy scaling
- **WHEN** the pipeline processes raw data
- **THEN** it SHALL multiply all `value` columns by a random scale factor drawn from uniform(0.5, 2.0) using numpy's default_rng

#### Scenario: Expense aggregation
- **WHEN** the pipeline processes expense records (flow_type == "Expense")
- **THEN** it SHALL group by (date, flow_type, source, destination, sub_category, category), sum the value column, and write the result to `data_public/expenses_monthly.parquet`

#### Scenario: Income aggregation
- **WHEN** the pipeline processes income records (flow_type == "Income")
- **THEN** it SHALL group by (date, flow_type, source, destination, sub_category, category), sum the value column, and write the result to `data_public/income_monthly.parquet`

#### Scenario: Life events output
- **WHEN** the pipeline runs
- **THEN** it SHALL write 11 hardcoded life events to `data_public/events_public.parquet` with columns date_start, date_end, event, type

#### Scenario: Module invocation
- **WHEN** a user runs `python -m analysis.build_public_data`
- **THEN** the pipeline SHALL execute end-to-end

#### Scenario: Private data not found
- **WHEN** the private source file does not exist
- **THEN** the pipeline SHALL exit with a clear error message indicating the missing file path

### Requirement: Output schema conformance
The output Parquet files SHALL match the schemas defined in `analysis/schemas.py`.

#### Scenario: Expenses schema match
- **WHEN** `expenses_monthly.parquet` is written
- **THEN** it SHALL have exactly the 7 columns defined in the flow schema, with `flow_type` always "Expense" and `value` always positive or zero

#### Scenario: Income schema match
- **WHEN** `income_monthly.parquet` is written
- **THEN** it SHALL have exactly the 7 columns defined in the flow schema, with `flow_type` always "Income" and `value` always negative or zero

#### Scenario: Events schema match
- **WHEN** `events_public.parquet` is written
- **THEN** it SHALL have exactly the 4 columns defined in the event schema, with `type` values only from the valid set
