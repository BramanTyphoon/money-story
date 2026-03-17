/**
 * SQL Playground with curated recipes, editable textarea, and result rendering.
 */

import { runQuery } from "./duckdb_init.js";

const MAX_DISPLAY_ROWS = 100;

const RECIPES = [
  {
    name: "Monthly totals by category (year)",
    sql: `SELECT
  strftime(date, '%Y-%m') AS month,
  category,
  ROUND(SUM(value), 2) AS total
FROM expenses_monthly
WHERE YEAR(date) = 2022
  AND sub_category NOT IN ('Savings/Investments', 'Transfer between accounts')
  AND destination != 'Savings'
GROUP BY month, category
ORDER BY month, category`,
  },
  {
    name: "Top N categories (date range)",
    sql: `SELECT
  category,
  ROUND(SUM(value), 2) AS total
FROM expenses_monthly
WHERE date >= '2020-01-01' AND date <= '2022-12-31'
  AND sub_category NOT IN ('Savings/Investments', 'Transfer between accounts')
  AND destination != 'Savings'
GROUP BY category
ORDER BY total DESC
LIMIT 10`,
  },
  {
    name: "Year-over-year change by category",
    sql: `WITH yearly AS (
  SELECT
    YEAR(date) AS year,
    category,
    SUM(value) AS total
  FROM expenses_monthly
  WHERE sub_category NOT IN ('Savings/Investments', 'Transfer between accounts')
    AND destination != 'Savings'
  GROUP BY year, category
)
SELECT
  a.category,
  a.year AS year_1,
  ROUND(a.total, 2) AS total_1,
  b.year AS year_2,
  ROUND(b.total, 2) AS total_2,
  ROUND(b.total - a.total, 2) AS change,
  ROUND((b.total - a.total) / a.total * 100, 1) AS pct_change
FROM yearly a
JOIN yearly b ON a.category = b.category AND b.year = a.year + 1
WHERE a.year = 2021
ORDER BY pct_change DESC`,
  },
  {
    name: "Income vs expenses by year",
    sql: `SELECT
  year,
  ROUND(income, 2) AS income,
  ROUND(expenses, 2) AS expenses,
  ROUND(income - expenses, 2) AS net
FROM (
  SELECT YEAR(date) AS year, SUM(ABS(value)) AS income
  FROM income_monthly
  GROUP BY year
) i
JOIN (
  SELECT YEAR(date) AS year, SUM(value) AS expenses
  FROM expenses_monthly
  WHERE sub_category NOT IN ('Savings/Investments', 'Transfer between accounts')
    AND destination != 'Savings'
  GROUP BY year
) e USING (year)
ORDER BY year`,
  },
  {
    name: "Monthly savings rate",
    sql: `SELECT
  strftime(i.month, '%Y-%m') AS month,
  ROUND(i.income, 2) AS income,
  ROUND(e.expenses, 2) AS expenses,
  ROUND((i.income - e.expenses) / i.income * 100, 1) AS savings_rate_pct
FROM (
  SELECT date AS month, SUM(ABS(value)) AS income
  FROM income_monthly
  GROUP BY month
) i
JOIN (
  SELECT date AS month, SUM(value) AS expenses
  FROM expenses_monthly
  WHERE sub_category NOT IN ('Savings/Investments', 'Transfer between accounts')
    AND destination != 'Savings'
  GROUP BY month
) e ON i.month = e.month
ORDER BY month`,
  },
];

const TABLE_REFERENCE = `
<details class="sql-table-ref">
  <summary><strong>Available Tables</strong></summary>
  <ul>
    <li><code>expenses_monthly</code> — date, flow_type, source, destination, sub_category, category, value</li>
    <li><code>income_monthly</code> — date, flow_type, source, destination, sub_category, category, value</li>
    <li><code>events_public</code> — date_start, date_end, event, type</li>
  </ul>
</details>
`;

function renderTable(rows) {
  if (!rows || rows.length === 0) {
    return '<p class="sql-no-results">No results returned.</p>';
  }

  const totalRows = rows.length;
  const displayRows = rows.slice(0, MAX_DISPLAY_ROWS);
  const columns = Object.keys(displayRows[0]);

  let html = '<table class="sql-results-table"><thead><tr>';
  for (const col of columns) {
    html += `<th>${col}</th>`;
  }
  html += "</tr></thead><tbody>";

  for (const row of displayRows) {
    html += "<tr>";
    for (const col of columns) {
      const val = row[col];
      const display = val === null || val === undefined ? "" : String(val);
      html += `<td>${display}</td>`;
    }
    html += "</tr>";
  }
  html += "</tbody></table>";

  if (totalRows > MAX_DISPLAY_ROWS) {
    html += `<p class="sql-truncation-note">Showing ${MAX_DISPLAY_ROWS} of ${totalRows} rows.</p>`;
  }

  return html;
}

export async function initSqlPlayground() {
  const controlsContainer = document.getElementById("sql-controls");
  const resultsContainer = document.getElementById("sql-results");

  controlsContainer.innerHTML = `
    ${TABLE_REFERENCE}
    <div class="sql-recipe-row">
      <label>Recipe: <select id="sql-recipe-select"></select></label>
    </div>
    <textarea id="sql-textarea" rows="12" spellcheck="false"></textarea>
    <div class="sql-button-row">
      <button id="sql-run-btn">Run</button>
    </div>
  `;

  const select = document.getElementById("sql-recipe-select");
  const textarea = document.getElementById("sql-textarea");
  const runBtn = document.getElementById("sql-run-btn");

  // Populate recipe dropdown
  RECIPES.forEach((recipe, i) => {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = recipe.name;
    select.appendChild(option);
  });

  // Select recipe → populate textarea
  select.addEventListener("change", () => {
    textarea.value = RECIPES[select.value].sql;
    resultsContainer.innerHTML = "";
  });

  // Set default
  textarea.value = RECIPES[0].sql;

  // Run button
  runBtn.addEventListener("click", async () => {
    const sql = textarea.value.trim();
    if (!sql) return;

    runBtn.disabled = true;
    runBtn.textContent = "Running…";
    resultsContainer.innerHTML = "";

    try {
      const rows = await runQuery(sql);
      resultsContainer.innerHTML = renderTable(rows);
    } catch (err) {
      resultsContainer.innerHTML = `<div class="sql-error"><strong>Error:</strong> ${err.message}</div>`;
    } finally {
      runBtn.disabled = false;
      runBtn.textContent = "Run";
    }
  });
}
