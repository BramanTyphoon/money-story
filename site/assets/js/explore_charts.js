/**
 * Categories-over-time interactive chart.
 * Renders a multi-series expense line chart with category checkboxes,
 * adjustable moving average window, and life-event annotations.
 */

import { runQuery } from "./duckdb_init.js";

const EVENT_COLORS = {
  career: "rgba(31, 119, 180, 0.15)",
  move: "rgba(255, 127, 14, 0.15)",
  family: "rgba(44, 160, 44, 0.15)",
  education: "rgba(148, 103, 189, 0.15)",
};
const EVENT_LINE_COLORS = {
  career: "rgba(31, 119, 180, 0.4)",
  move: "rgba(255, 127, 14, 0.4)",
  family: "rgba(44, 160, 44, 0.4)",
  education: "rgba(148, 103, 189, 0.4)",
};

let expenseData = [];
let eventData = [];
let allCategories = [];
let shapes = [];
let annotations = [];

function getSelectedCategories() {
  const container = document.getElementById("category-checkboxes");
  return new Set(
    [...container.querySelectorAll("input:checked")].map((cb) => cb.value)
  );
}

function getMaWindow() {
  const input = document.getElementById("ma-window-input");
  return input ? parseInt(input.value, 10) || 7 : 7;
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

function updateChart() {
  const selected = getSelectedCategories();
  const window = getMaWindow();

  // Aggregate selected categories by date
  const byDate = new Map();
  for (const d of expenseData) {
    if (!selected.has(d.category)) continue;
    byDate.set(d.date, (byDate.get(d.date) || 0) + d.value);
  }
  const dates = [...byDate.keys()].sort();
  const values = dates.map((d) => byDate.get(d) || 0);
  const rolling = computeRollingAverage(values, window);

  const traces = [
    {
      x: dates,
      y: values,
      mode: "lines",
      name: "Monthly Expenses",
      line: { color: "rgba(214, 39, 40, 0.4)", width: 1 },
    },
    {
      x: dates,
      y: rolling,
      mode: "lines",
      name: `${window}-Month Average`,
      line: { color: "rgba(214, 39, 40, 1)", width: 3 },
    },
  ];

  const layout = {
    title: "Expenses by Category Over Time",
    xaxis: { title: "Date" },
    yaxis: { title: "Monthly Expenses (USD, scaled)" },
    hovermode: "x unified",
    template: "plotly_white",
    width: 1100,
    height: 500,
    shapes,
    annotations,
  };

  Plotly.react(document.getElementById("categories-chart"), traces, layout);
}

export async function initCategoriesChart() {
  // Query expense data (filtered)
  expenseData = await runQuery(`
    SELECT date, category, SUM(value) as value
    FROM expenses_monthly
    WHERE sub_category NOT IN ('Savings/Investments', 'Transfer between accounts')
      AND destination != 'Savings'
    GROUP BY date, category
    ORDER BY date
  `);

  // Convert dates to ISO strings
  expenseData = expenseData.map((row) => ({
    ...row,
    date: typeof row.date === "object" && row.date.toISOString
      ? row.date.toISOString().slice(0, 10)
      : String(row.date).slice(0, 10),
  }));

  allCategories = [...new Set(expenseData.map((d) => d.category))].sort();

  // Query events
  const events = await runQuery(`SELECT * FROM events_public`);
  eventData = events.map((e) => ({
    ...e,
    date_start: typeof e.date_start === "object" && e.date_start.toISOString
      ? e.date_start.toISOString().slice(0, 10)
      : String(e.date_start).slice(0, 10),
    date_end: typeof e.date_end === "object" && e.date_end.toISOString
      ? e.date_end.toISOString().slice(0, 10)
      : String(e.date_end).slice(0, 10),
  }));

  shapes = eventData.map((e) => ({
    type: "rect",
    xref: "x",
    yref: "paper",
    x0: e.date_start,
    x1: e.date_end,
    y0: 0,
    y1: 1,
    fillcolor: EVENT_COLORS[e.type] || "rgba(128,128,128,0.15)",
    line: {
      color: EVENT_LINE_COLORS[e.type] || "rgba(128,128,128,0.4)",
      width: 1,
    },
  }));
  annotations = eventData.map((e) => ({
    x: e.date_start,
    y: 1,
    xref: "x",
    yref: "paper",
    text: e.event,
    showarrow: false,
    textangle: -90,
    font: { size: 9 },
    xanchor: "left",
    yanchor: "top",
  }));

  // Build checkbox UI
  const cbContainer = document.getElementById("category-checkboxes");
  const label = document.createElement("label");
  label.textContent = "Expense categories";
  label.style.fontWeight = "bold";
  label.style.display = "block";
  label.style.marginBottom = "0.5em";
  cbContainer.appendChild(label);

  const checkboxDiv = document.createElement("div");
  checkboxDiv.className = "explore-checkboxes";
  cbContainer.appendChild(checkboxDiv);

  allCategories.forEach((cat) => {
    const lbl = document.createElement("label");
    lbl.style.cursor = "pointer";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = true;
    cb.value = cat;
    cb.addEventListener("change", updateChart);
    lbl.appendChild(cb);
    lbl.appendChild(document.createTextNode(" " + cat));
    checkboxDiv.appendChild(lbl);
  });

  // Build moving average control
  const maContainer = document.getElementById("ma-control");
  const maLabel = document.createElement("label");
  maLabel.textContent = "Moving average window: ";
  maLabel.style.fontWeight = "bold";
  const maInput = document.createElement("input");
  maInput.type = "range";
  maInput.id = "ma-window-input";
  maInput.min = "1";
  maInput.max = "12";
  maInput.value = "7";
  maInput.style.verticalAlign = "middle";
  const maValue = document.createElement("span");
  maValue.id = "ma-window-value";
  maValue.textContent = "7 months";
  maInput.addEventListener("input", () => {
    maValue.textContent = maInput.value + " month" + (maInput.value === "1" ? "" : "s");
    updateChart();
  });
  maLabel.appendChild(maInput);
  maLabel.appendChild(document.createTextNode(" "));
  maLabel.appendChild(maValue);
  maContainer.appendChild(maLabel);

  updateChart();
}
