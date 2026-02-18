/**
 * SQL Playground — curated query presets + editable SQL + tabular results.
 */

import { queryAsObjects } from "./duckdb_init.js";

const SPEND_TABLE = "'data_public/spend_monthly_category.parquet'";
const INCOME_TABLE = "'data_public/income_monthly.parquet'";

/** Preset query map */
export const PRESETS = {
  "Monthly Totals by Category": `SELECT month, category_l1, SUM(amount) AS total
FROM ${SPEND_TABLE}
GROUP BY month, category_l1
ORDER BY month DESC, total DESC
LIMIT 100`,

  "Top Categories (All Time)": `SELECT category_l1, category_l2,
       ROUND(SUM(amount), 2) AS total,
       ROUND(AVG(amount), 2) AS avg_monthly
FROM ${SPEND_TABLE}
GROUP BY category_l1, category_l2
ORDER BY total DESC`,

  "Year-over-Year Change": `WITH yearly AS (
  SELECT EXTRACT(YEAR FROM month) AS year,
         category_l1,
         SUM(amount) AS total
  FROM ${SPEND_TABLE}
  GROUP BY year, category_l1
)
SELECT a.year, a.category_l1,
       ROUND(a.total, 2) AS total,
       ROUND(a.total - b.total, 2) AS yoy_change,
       ROUND((a.total - b.total) / b.total * 100, 1) AS yoy_pct
FROM yearly a
LEFT JOIN yearly b ON a.category_l1 = b.category_l1
                   AND a.year = b.year + 1
WHERE b.total IS NOT NULL
ORDER BY a.year DESC, yoy_change DESC`,

  "Income vs Spend Summary": `SELECT EXTRACT(YEAR FROM i.month) AS year,
       ROUND(SUM(i.income_amount), 2) AS total_income,
       ROUND(SUM(s.total_spend), 2) AS total_spend,
       ROUND(SUM(i.income_amount) - SUM(s.total_spend), 2) AS savings
FROM ${INCOME_TABLE} i
LEFT JOIN (
  SELECT month, SUM(amount) AS total_spend
  FROM ${SPEND_TABLE}
  GROUP BY month
) s ON i.month = s.month
GROUP BY year
ORDER BY year`,
};

const ROW_LIMIT = 500;

/**
 * Execute a SQL query and render results as an HTML table.
 * @returns {{ html: string, rowCount: number, elapsed: number }}
 */
export async function executeQuery(sql) {
  const t0 = performance.now();
  const rows = await queryAsObjects(sql);
  const elapsed = Math.round(performance.now() - t0);

  if (rows.length === 0) {
    return { html: "<p>No results.</p>", rowCount: 0, elapsed };
  }

  const columns = Object.keys(rows[0]);
  const displayRows = rows.slice(0, ROW_LIMIT);
  const truncated = rows.length > ROW_LIMIT;

  let html = "<table><thead><tr>";
  for (const col of columns) {
    html += `<th>${escapeHtml(col)}</th>`;
  }
  html += "</tr></thead><tbody>";

  for (const row of displayRows) {
    html += "<tr>";
    for (const col of columns) {
      const val = row[col];
      html += `<td>${escapeHtml(String(val ?? ""))}</td>`;
    }
    html += "</tr>";
  }
  html += "</tbody></table>";

  if (truncated) {
    html += `<p class="query-info">Showing first ${ROW_LIMIT} of ${rows.length} rows.</p>`;
  }

  return { html, rowCount: rows.length, elapsed };
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Initialize the playground UI.
 */
export function initPlayground({ presetSelect, textarea, runBtn, resultsDiv, infoDiv }) {
  // Populate presets
  for (const name of Object.keys(PRESETS)) {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    presetSelect.appendChild(opt);
  }

  // Load first preset
  textarea.value = PRESETS[presetSelect.value];

  presetSelect.addEventListener("change", () => {
    textarea.value = PRESETS[presetSelect.value];
  });

  async function run() {
    const sql = textarea.value.trim();
    if (!sql) return;

    resultsDiv.innerHTML = '<div class="loading-spinner">Running query…</div>';
    infoDiv.textContent = "";

    try {
      const { html, rowCount, elapsed } = await executeQuery(sql);
      resultsDiv.innerHTML = html;
      infoDiv.textContent = `${rowCount} rows in ${elapsed}ms`;
    } catch (err) {
      resultsDiv.innerHTML = `<p style="color:#dc3545;"><strong>Error:</strong> ${escapeHtml(err.message)}</p>`;
      infoDiv.textContent = "";
    }
  }

  runBtn.addEventListener("click", run);

  // Ctrl+Enter to run
  textarea.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      run();
    }
  });
}
