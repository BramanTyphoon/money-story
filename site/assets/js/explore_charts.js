/**
 * Query + Plotly rendering for the Categories Over Time page.
 */

import { queryAsObjects } from "./duckdb_init.js";
import { getMonthlyCategorySeries, getEvents } from "./sql_queries.js";

const COLORS = [
  "#636EFA", "#EF553B", "#00CC96", "#AB63FA", "#FFA15A",
  "#19D3F3", "#FF6692", "#B6E880", "#FF97FF", "#FECB52",
];

/**
 * Convert row-oriented query results to Plotly trace arrays.
 * Expects rows with {month, category, amount}.
 */
export function rowsToTraces(rows) {
  const grouped = {};
  for (const row of rows) {
    const cat = row.category;
    if (!grouped[cat]) grouped[cat] = { x: [], y: [] };
    grouped[cat].x.push(row.month);
    grouped[cat].y.push(row.amount);
  }

  return Object.entries(grouped).map(([cat, data], i) => ({
    x: data.x,
    y: data.y,
    type: "scatter",
    mode: "lines",
    name: cat,
    line: { color: COLORS[i % COLORS.length], width: 2 },
  }));
}

/**
 * Render the category time series chart into a target div.
 */
export async function renderCategoryTimeSeries(
  targetId,
  { level = "category_l1", start = null, end = null, topN = 10 } = {}
) {
  const sql = getMonthlyCategorySeries(level, start, end, topN);
  const rows = await queryAsObjects(sql);
  const traces = rowsToTraces(rows);

  // Load events for annotations
  let shapes = [];
  try {
    const events = await queryAsObjects(getEvents());
    shapes = events.map((e) => ({
      type: "rect",
      xref: "x",
      yref: "paper",
      x0: e.start_date,
      x1: e.end_date,
      y0: 0,
      y1: 1,
      fillcolor: "gray",
      opacity: 0.12,
      line: { width: 0 },
    }));
  } catch (_) {
    // events table may not exist; skip
  }

  const layout = {
    title: "Spending by Category Over Time",
    xaxis: {
      title: "Month",
      rangeselector: {
        buttons: [
          { count: 12, label: "1y", step: "month", stepmode: "backward" },
          { count: 36, label: "3y", step: "month", stepmode: "backward" },
          { count: 60, label: "5y", step: "month", stepmode: "backward" },
          { step: "all", label: "All" },
        ],
      },
      rangeslider: { visible: true },
    },
    yaxis: { title: "Amount ($)" },
    hovermode: "x unified",
    template: "plotly_white",
    legend: { orientation: "h", yanchor: "bottom", y: 1.02, xanchor: "right", x: 1 },
    shapes,
    autosize: true,
    margin: { l: 60, r: 20, t: 60, b: 40 },
  };

  const config = {
    responsive: true,
    scrollZoom: true,
    displayModeBar: true,
  };

  Plotly.react(targetId, traces, layout, config);
}
