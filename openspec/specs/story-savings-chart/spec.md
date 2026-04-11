## ADDED Requirements

### Requirement: Savings section in Story page
The `site/story/index.qmd` file SHALL include a `## Savings` section appended after the Expenditures section, containing a narrative paragraph, a Python cell that calls `plot_savings_over_time()`, and a `Figure 4.` caption paragraph.

#### Scenario: Section ordering
- **WHEN** the Story page is rendered
- **THEN** the Savings section SHALL appear after the Expenditures section and after all Figure 3 content

#### Scenario: Narrative context
- **WHEN** the Savings section is rendered
- **THEN** it SHALL include a prose paragraph that explains the chart shows cumulative savings flows (explicit transfers to Savings accounts), that the total starts from the beginning of the tracked period (not from absolute zero wealth), and how life events correlate with saving behavior

#### Scenario: Figure 4 chart cell
- **WHEN** the Python cell in the Savings section is executed
- **THEN** it SHALL call `plot_savings_over_time()` with no arguments (relying on default paths for expenses, income, and events) and display the returned figure

#### Scenario: Figure 4 caption
- **WHEN** the Savings section is rendered
- **THEN** a `<p class="figure-caption">` element SHALL appear immediately below the chart output with the label **Figure 4.** and a description noting that the chart shows cumulative savings accumulation and that the starting point reflects the beginning of the tracked period
