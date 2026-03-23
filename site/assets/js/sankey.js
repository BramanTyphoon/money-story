/**
 * Interactive Sankey diagram with brush-selectable time series.
 * User selects a date range by dragging a box on the income/expense time series,
 * and the Sankey diagram updates to show flows for that period.
 * Ported from BudgetTracker/budgettrack/plot.py.
 */

import { runQuery } from "./duckdb_init.js";

// Category translation maps matching the Python implementation
const EXPENSE_CATEGORY_MAP = {
  "General Funds": "General Funds",
  "Unknown": "Unknown",
  "Rent/Mortgage": "Housing",
  "Utilities": "Housing",
  "Media/Subscriptions": "Entertainment",
  "Healthcare/Insurance": "Healthcare/Insurance",
  "Savings/Investments": "Savings/Investments",
  "Transfer between accounts": "Savings/Investments",
  "Groceries": "Food",
  "Dining Out": "Food",
  "Transportation": "Transportation",
  "Child Education/Childcare": "Children",
  "Parent Enrichment/Education": "Entertainment",
  "Travel": "Travel",
  "Entertainment": "Entertainment",
  "Home Maintenance/Improvement": "Housing",
  "Car/Car Maintenance": "Transportation",
  "Household Goods": "Housing",
  "Clothing": "Clothing",
  "Charity": "Gifts/Charity",
  "Hobbies": "Entertainment",
  "Sports/Outdoors": "Entertainment",
  "Miscellaneous": "Miscellaneous",
  "Gifts": "Gifts/Charity",
};

const INCOME_CATEGORY_MAP = {
  "Unknown Income": "Miscellaneous Income",
  "Salary/Wages": "Salary/Wages",
  "Side Hustle (e.g. Juku)": "Salary/Wages",
  "Interest/Dividends": "Miscellaneous Income",
  "Gift Income": "Miscellaneous Income",
  "Refunds/Rebates": "Reimbursements",
};

const WEALTH_CATEGORIES = new Set([
  "Savings/Investments",
  "Transfer between accounts",
]);

const CATEGORY_COLORS = [
  "rgba(31, 119, 180, 0.8)",
  "rgba(255, 127, 14, 0.8)",
  "rgba(44, 160, 44, 0.8)",
  "rgba(214, 39, 40, 0.8)",
  "rgba(148, 103, 189, 0.8)",
  "rgba(140, 86, 75, 0.8)",
  "rgba(227, 119, 194, 0.8)",
  "rgba(127, 127, 127, 0.8)",
  "rgba(188, 189, 34, 0.8)",
  "rgba(23, 190, 207, 0.8)",
];

const ALL_EXPENSE_SUBCATS = new Set(Object.keys(EXPENSE_CATEGORY_MAP));
const ALL_INCOME_SUBCATS = new Set(Object.keys(INCOME_CATEGORY_MAP));
const ALL_SUBCATS = new Set([...ALL_EXPENSE_SUBCATS, ...ALL_INCOME_SUBCATS]);

// Build color map for all unique categories
const allCategories = new Set([
  ...Object.values(EXPENSE_CATEGORY_MAP),
  ...Object.values(INCOME_CATEGORY_MAP),
]);
const COLOR_BY_CATEGORY = {};
let ci = 0;
for (const cat of allCategories) {
  COLOR_BY_CATEGORY[cat] = CATEGORY_COLORS[ci % CATEGORY_COLORS.length];
  ci++;
}

function computeRollingAverage(values, window) {
  const half = Math.floor(window / 2);
  return values.map((_, i) => {
    const start = Math.max(0, i - half);
    const end = Math.min(values.length - 1, i + half);
    let sum = 0;
    for (let j = start; j <= end; j++) sum += values[j];
    return sum / (end - start + 1);
  });
}

function processRow(row) {
  let subCategory = row.sub_category;

  if (row.flow_type === "Income" && subCategory === "Unknown") {
    subCategory = "Unknown Income";
  }
  if (row.flow_type === "Income" && subCategory === "Gifts") {
    subCategory = "Gift Income";
  }

  if (!ALL_SUBCATS.has(subCategory)) return null;

  const category =
    row.flow_type === "Expense"
      ? EXPENSE_CATEGORY_MAP[subCategory]
      : INCOME_CATEGORY_MAP[subCategory];

  if (!category) return null;

  let destination;
  if (WEALTH_CATEGORIES.has(subCategory)) {
    destination = "Savings";
  } else if (row.flow_type === "Income") {
    destination = "General Funds";
  } else {
    destination = category;
  }

  let source;
  if (row.flow_type === "Income") {
    if (ALL_EXPENSE_SUBCATS.has(subCategory)) {
      source = "Reimbursements";
    } else {
      source = category;
    }
  } else {
    source = row.source === "Savings" ? "Savings" : "General Funds";
  }

  return { subCategory, category, source, destination, value: Math.abs(row.value) };
}

async function buildSankey(startDate, endDate) {
  const periodRows = await runQuery(`
    SELECT sub_category, flow_type, source, destination, SUM(value) as value
    FROM (
      SELECT * FROM expenses_monthly
      UNION ALL
      SELECT * FROM income_monthly
    )
    WHERE date >= '${startDate}' AND date <= '${endDate}'
    GROUP BY sub_category, flow_type, source, destination
  `);

  const flows = new Map();
  for (const row of periodRows) {
    const processed = processRow(row);
    if (!processed) continue;
    if (processed.source === processed.destination) continue;
    const key = `${processed.source}|${processed.destination}|${processed.subCategory}`;
    flows.set(key, (flows.get(key) || 0) + processed.value);
  }

  const preSavingsResult = await runQuery(`
    SELECT
      COALESCE(SUM(CASE WHEN destination = 'Savings' THEN ABS(value) ELSE 0 END), 0) -
      COALESCE(SUM(CASE WHEN source = 'Savings' THEN ABS(value) ELSE 0 END), 0) as balance
    FROM (
      SELECT * FROM expenses_monthly WHERE date < '${startDate}'
      UNION ALL
      SELECT * FROM income_monthly WHERE date < '${startDate}'
    )
    WHERE destination = 'Savings' OR source = 'Savings'
  `);
  const preSavings = preSavingsResult[0]?.balance || 0;

  const preGeneralResult = await runQuery(`
    SELECT
      COALESCE(SUM(CASE WHEN flow_type = 'Income' AND source != 'Savings' AND destination != 'Savings' THEN ABS(value) ELSE 0 END), 0) -
      COALESCE(SUM(CASE WHEN flow_type = 'Expense' AND source != 'Savings' AND destination != 'Savings' THEN value ELSE 0 END), 0) as balance
    FROM (
      SELECT * FROM expenses_monthly WHERE date < '${startDate}'
      UNION ALL
      SELECT * FROM income_monthly WHERE date < '${startDate}'
    )
  `);
  const preGeneral = preGeneralResult[0]?.balance || 0;

  const labels = ["General Carryover", "Savings Carryover", "General Funds", "Savings"];
  const labelSet = new Set(labels);

  for (const key of flows.keys()) {
    const [source, destination] = key.split("|");
    if (!labelSet.has(source)) { labels.push(source); labelSet.add(source); }
    if (!labelSet.has(destination)) { labels.push(destination); labelSet.add(destination); }
  }

  const labelToIndex = {};
  labels.forEach((l, i) => { labelToIndex[l] = i; });

  const nodeColors = [
    "rgba(150,150,150,0.8)",
    COLOR_BY_CATEGORY["Savings"] || COLOR_BY_CATEGORY["Savings/Investments"] || "rgba(150,150,150,0.8)",
    ...labels.slice(2).map((l) => COLOR_BY_CATEGORY[l] || "rgba(150,150,150,0.8)"),
  ];

  const linkSource = [0, 1];
  const linkTarget = [2, 3];
  const linkValue = [Math.max(0, preGeneral), Math.max(0, preSavings)];
  const linkLabel = ["", ""];
  const linkColor = [
    (COLOR_BY_CATEGORY["General Funds"] || "rgba(150,150,150,0.8)").replace("0.8", "0.40"),
    (COLOR_BY_CATEGORY["Savings"] || COLOR_BY_CATEGORY["Savings/Investments"] || "rgba(150,150,150,0.8)").replace("0.8", "0.40"),
  ];

  for (const [key, value] of flows) {
    const [source, destination, subCategory] = key.split("|");
    linkSource.push(labelToIndex[source]);
    linkTarget.push(labelToIndex[destination]);
    linkValue.push(value);
    linkLabel.push(subCategory);
    linkColor.push(
      (COLOR_BY_CATEGORY[destination] || "rgba(150,150,150,0.8)").replace("0.8", "0.40")
    );
  }

  const startObj = new Date(startDate + "T00:00:00");
  const endObj = new Date(endDate + "T00:00:00");
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const title = `${monthNames[startObj.getMonth()]} ${startObj.getFullYear()} – ${monthNames[endObj.getMonth()]} ${endObj.getFullYear()} Budget Sankey Diagram (in 2019 USD)`;

  Plotly.newPlot("sankey-chart", [{
    type: "sankey",
    valueformat: ".0f",
    valuesuffix: " USD",
    node: {
      pad: 15,
      thickness: 15,
      line: { color: "black", width: 0.5 },
      label: labels,
      color: nodeColors,
    },
    link: {
      source: linkSource,
      target: linkTarget,
      value: linkValue,
      label: linkLabel,
      color: linkColor,
    },
  }], {
    title: { text: title },
    font: { size: 10 },
    width: 1100,
    height: 600,
  });
}

export async function initSankey() {
  // Query monthly totals for expenses and income
  const expenseRows = await runQuery(`
    SELECT CAST(date AS VARCHAR) as date, SUM(value) as value
    FROM expenses_monthly
    WHERE sub_category NOT IN ('Savings/Investments', 'Transfer between accounts')
      AND destination != 'Savings'
    GROUP BY date
    ORDER BY date
  `);
  const incomeRows = await runQuery(`
    SELECT CAST(date AS VARCHAR) as date, SUM(ABS(value)) as value
    FROM income_monthly
    GROUP BY date
    ORDER BY date
  `);

  const expenseDates = expenseRows.map((r) => r.date);
  const expenseValues = expenseRows.map((r) => r.value);
  const incomeDates = incomeRows.map((r) => r.date);
  const incomeValues = incomeRows.map((r) => r.value);

  const expenseMA = computeRollingAverage(expenseValues, 7);
  const incomeMA = computeRollingAverage(incomeValues, 7);

  // Default selection: first year of data
  const minDate = expenseDates[0];
  const minYear = new Date(minDate + "T00:00:00").getFullYear();
  let defaultStart = `${minYear}-01-01`;
  let defaultEnd = `${minYear}-12-01`;
  // Clamp to actual data range
  if (defaultStart < minDate) defaultStart = minDate;

  const container = document.getElementById("sankey-controls");
  container.innerHTML = `
    <p style="color: #666; margin-bottom: 0.5em;">
      Click and drag on the chart below to select a time period for the Sankey diagram.
    </p>
    <div id="sankey-timeseries"></div>
  `;

  // Render the time series with initial selection box
  const traces = [
    {
      x: expenseDates, y: expenseValues, mode: "lines",
      name: "Monthly Expenses",
      line: { color: "rgba(214, 39, 40, 0.3)", width: 1 },
    },
    {
      x: expenseDates, y: expenseMA, mode: "lines",
      name: "Expenses (7-mo avg)",
      line: { color: "rgba(214, 39, 40, 1)", width: 2.5 },
    },
    {
      x: incomeDates, y: incomeValues, mode: "lines",
      name: "Monthly Income",
      line: { color: "rgba(44, 160, 44, 0.3)", width: 1 },
    },
    {
      x: incomeDates, y: incomeMA, mode: "lines",
      name: "Income (7-mo avg)",
      line: { color: "rgba(44, 160, 44, 1)", width: 2.5 },
    },
  ];

  const layout = {
    title: "Select a time period for the Sankey diagram",
    xaxis: { title: "Date" },
    yaxis: { title: "Monthly Amount (USD, scaled)" },
    hovermode: "x unified",
    template: "plotly_white",
    width: 1100,
    height: 300,
    margin: { t: 40, b: 50 },
    dragmode: "select",
    selectdirection: "h",
    // Highlight the initial selection
    shapes: [{
      type: "rect",
      xref: "x", yref: "paper",
      x0: defaultStart, x1: defaultEnd,
      y0: 0, y1: 1,
      fillcolor: "rgba(100, 100, 200, 0.15)",
      line: { color: "rgba(100, 100, 200, 0.5)", width: 1 },
    }],
  };

  const tsDiv = document.getElementById("sankey-timeseries");
  await Plotly.newPlot(tsDiv, traces, layout, { displayModeBar: true });

  // Listen for box/lasso selection events
  let generating = false;
  tsDiv.on("plotly_selected", async (eventData) => {
    if (generating) return;
    if (!eventData || !eventData.range) return;

    const x0 = eventData.range.x[0];
    const x1 = eventData.range.x[1];

    // Convert Plotly's date axis values to date strings
    const startDate = x0.slice(0, 10);
    const endDate = x1.slice(0, 10);

    // Update the highlight rectangle
    Plotly.relayout(tsDiv, {
      "shapes[0].x0": startDate,
      "shapes[0].x1": endDate,
    });

    generating = true;
    try {
      await buildSankey(startDate, endDate);
    } finally {
      generating = false;
    }
  });

  // Initial Sankey for first year
  await buildSankey(defaultStart, defaultEnd);
}
