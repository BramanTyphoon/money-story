/**
 * Parameterized query builders for DuckDB-Wasm.
 *
 * All queries reference data_public/*.parquet via relative URLs.
 */

const SPEND_TABLE = "'data_public/spend_monthly_category.parquet'";
const INCOME_TABLE = "'data_public/income_monthly.parquet'";
const EVENTS_TABLE = "'data_public/events_public.parquet'";

/**
 * Monthly category time series.
 * @param {"category_l1"|"category_l2"} level
 * @param {string|null} start - YYYY-MM-DD or null for no lower bound
 * @param {string|null} end - YYYY-MM-DD or null for no upper bound
 * @param {number} topN - limit to top N categories by total
 */
export function getMonthlyCategorySeries(level = "category_l1", start = null, end = null, topN = 10) {
  const dateFilter = _dateClause(start, end);
  return `
    WITH ranked AS (
      SELECT ${level} AS category,
             SUM(amount) AS total
      FROM ${SPEND_TABLE}
      ${dateFilter ? "WHERE " + dateFilter : ""}
      GROUP BY ${level}
      ORDER BY total DESC
      LIMIT ${topN}
    )
    SELECT s.month,
           s.${level} AS category,
           SUM(s.amount) AS amount
    FROM ${SPEND_TABLE} s
    INNER JOIN ranked r ON s.${level} = r.category
    ${dateFilter ? "WHERE " + dateFilter.replace(/month/g, "s.month") : ""}
    GROUP BY s.month, s.${level}
    ORDER BY s.month, category
  `;
}

/**
 * Aggregated flows for Sankey diagram.
 */
export function getSankeyFlows(level = "category_l1", start = null, end = null) {
  const dateFilter = _dateClause(start, end);
  if (level === "category_l2") {
    return `
      SELECT category_l1, category_l2, SUM(amount) AS amount
      FROM ${SPEND_TABLE}
      ${dateFilter ? "WHERE " + dateFilter : ""}
      GROUP BY category_l1, category_l2
      ORDER BY amount DESC
    `;
  }
  return `
    SELECT category_l1, SUM(amount) AS amount
    FROM ${SPEND_TABLE}
    ${dateFilter ? "WHERE " + dateFilter : ""}
    GROUP BY category_l1
    ORDER BY amount DESC
  `;
}

/**
 * Income vs total spend per month.
 */
export function getIncomeVsSpend(start = null, end = null) {
  const dateFilter = _dateClause(start, end);
  return `
    SELECT i.month,
           i.income_amount,
           COALESCE(s.total_spend, 0) AS total_spend
    FROM ${INCOME_TABLE} i
    LEFT JOIN (
      SELECT month, SUM(amount) AS total_spend
      FROM ${SPEND_TABLE}
      GROUP BY month
    ) s ON i.month = s.month
    ${dateFilter ? "WHERE " + dateFilter.replace(/month/g, "i.month") : ""}
    ORDER BY i.month
  `;
}

/**
 * Get the min/max dates in the dataset.
 */
export function getDateBounds() {
  return `
    SELECT MIN(month) AS min_date, MAX(month) AS max_date
    FROM ${SPEND_TABLE}
  `;
}

/**
 * Get all life events.
 */
export function getEvents() {
  return `SELECT * FROM ${EVENTS_TABLE} ORDER BY start_date`;
}

/**
 * Total income for a date range.
 */
export function getTotalIncome(start = null, end = null) {
  const dateFilter = _dateClause(start, end, "month");
  return `
    SELECT SUM(income_amount) AS total_income
    FROM ${INCOME_TABLE}
    ${dateFilter ? "WHERE " + dateFilter : ""}
  `;
}

// --- helpers ---

function _dateClause(start, end, col = "month") {
  const parts = [];
  if (start) parts.push(`${col} >= '${start}'`);
  if (end) parts.push(`${col} <= '${end}'`);
  return parts.join(" AND ");
}
