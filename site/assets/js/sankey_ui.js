/**
 * Build Plotly Sankey trace data from spending aggregates + income.
 */

import { queryAsObjects } from "./duckdb_init.js";
import { getSankeyFlows, getTotalIncome, getDateBounds } from "./sql_queries.js";

/**
 * Build node/link arrays for a Plotly Sankey diagram.
 *
 * @param {Array} rows - spending rows from getSankeyFlows()
 * @param {number} totalIncome - total income for the period
 * @param {"category_l1"|"category_l2"} level
 * @returns {{ nodes: {label: string[], color: string[]}, links: {source: number[], target: number[], value: number[], color: string[]} }}
 */
export function buildSankeyData(rows, totalIncome, level = "category_l1") {
  const nodeLabels = [];
  const nodeColors = [];
  const linkSource = [];
  const linkTarget = [];
  const linkValue = [];
  const linkColors = [];

  const PALETTE = [
    "#636EFA", "#EF553B", "#00CC96", "#AB63FA", "#FFA15A",
    "#19D3F3", "#FF6692", "#B6E880", "#FF97FF", "#FECB52",
  ];

  // Node 0: Income
  nodeLabels.push("Income");
  nodeColors.push("#00CC96");

  let totalSpend = 0;

  if (level === "category_l1") {
    // Income → L1 categories
    rows.forEach((row, i) => {
      const idx = nodeLabels.length;
      nodeLabels.push(row.category_l1);
      nodeColors.push(PALETTE[i % PALETTE.length]);
      linkSource.push(0);
      linkTarget.push(idx);
      linkValue.push(row.amount);
      linkColors.push(PALETTE[i % PALETTE.length] + "88");
      totalSpend += row.amount;
    });
  } else {
    // Income → L1 → L2
    const l1Map = {};
    for (const row of rows) {
      if (!l1Map[row.category_l1]) l1Map[row.category_l1] = [];
      l1Map[row.category_l1].push(row);
    }

    let colorIdx = 0;
    for (const [l1, l2rows] of Object.entries(l1Map)) {
      const l1Idx = nodeLabels.length;
      const color = PALETTE[colorIdx % PALETTE.length];
      nodeLabels.push(l1);
      nodeColors.push(color);

      let l1Total = 0;
      for (const row of l2rows) {
        const l2Idx = nodeLabels.length;
        nodeLabels.push(row.category_l2);
        nodeColors.push(color + "CC");
        linkSource.push(l1Idx);
        linkTarget.push(l2Idx);
        linkValue.push(row.amount);
        linkColors.push(color + "66");
        l1Total += row.amount;
      }

      // Income → L1
      linkSource.push(0);
      linkTarget.push(l1Idx);
      linkValue.push(l1Total);
      linkColors.push(color + "88");
      totalSpend += l1Total;
      colorIdx++;
    }
  }

  // Savings node (if income > spend)
  if (totalIncome > totalSpend) {
    const savingsIdx = nodeLabels.length;
    nodeLabels.push("Savings");
    nodeColors.push("#2ecc71");
    linkSource.push(0);
    linkTarget.push(savingsIdx);
    linkValue.push(totalIncome - totalSpend);
    linkColors.push("#2ecc7188");
  }

  return {
    nodes: { label: nodeLabels, color: nodeColors },
    links: { source: linkSource, target: linkTarget, value: linkValue, color: linkColors },
  };
}

/**
 * Render Sankey diagram into a target div.
 */
export async function renderSankey(targetId, { level = "category_l1", start = null, end = null } = {}) {
  const [rows, incomeRows] = await Promise.all([
    queryAsObjects(getSankeyFlows(level, start, end)),
    queryAsObjects(getTotalIncome(start, end)),
  ]);

  const totalIncome = incomeRows[0]?.total_income ?? 0;
  const { nodes, links } = buildSankeyData(rows, totalIncome, level);

  const trace = {
    type: "sankey",
    orientation: "h",
    node: {
      pad: 15,
      thickness: 20,
      line: { color: "black", width: 0.5 },
      label: nodes.label,
      color: nodes.color,
    },
    link: {
      source: links.source,
      target: links.target,
      value: links.value,
      color: links.color,
    },
  };

  const layout = {
    title: `Income Flow: ${start || "Start"} to ${end || "End"}`,
    font: { size: 12 },
    autosize: true,
    margin: { l: 20, r: 20, t: 50, b: 20 },
  };

  Plotly.react(targetId, [trace], layout, { responsive: true });
}

/**
 * Initialize date inputs with dataset bounds.
 */
export async function initDateBounds(startInput, endInput) {
  const rows = await queryAsObjects(getDateBounds());
  if (rows.length > 0) {
    const { min_date, max_date } = rows[0];
    // Format as YYYY-MM for month inputs
    const fmt = (d) => String(d).slice(0, 7);
    startInput.min = fmt(min_date);
    startInput.max = fmt(max_date);
    endInput.min = fmt(min_date);
    endInput.max = fmt(max_date);
    startInput.value = fmt(min_date);
    endInput.value = fmt(max_date);
  }
}
