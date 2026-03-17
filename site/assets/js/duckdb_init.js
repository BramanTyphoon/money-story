/**
 * DuckDB-Wasm initialization module.
 * Provides a shared connection singleton and query helper.
 */

import * as duckdb from "https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.29.0/+esm";

const PARQUET_FILES = [
  { name: "expenses_monthly", path: "data_public/expenses_monthly.parquet" },
  { name: "income_monthly", path: "data_public/income_monthly.parquet" },
  { name: "events_public", path: "data_public/events_public.parquet" },
];

let connectionPromise = null;

async function initConnection() {
  const bundles = duckdb.getJsDelivrBundles();
  const bundle = await duckdb.selectBundle(bundles);

  const worker = await duckdb.createWorker(bundle.mainWorker);
  const logger = new duckdb.ConsoleLogger();
  const db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

  const conn = await db.connect();

  // Register Parquet files
  for (const { name, path } of PARQUET_FILES) {
    const response = await fetch(path);
    const buffer = new Uint8Array(await response.arrayBuffer());
    await db.registerFileBuffer(`${name}.parquet`, buffer);
    await conn.query(
      `CREATE TABLE ${name} AS SELECT * FROM '${name}.parquet'`
    );
  }

  return conn;
}

/**
 * Returns a Promise that resolves to a shared DuckDB connection.
 * Initializes on first call; subsequent calls return the cached connection.
 */
export function getConnection() {
  if (!connectionPromise) {
    connectionPromise = initConnection();
  }
  return connectionPromise;
}

/**
 * Execute a SQL query and return results as an array of plain objects.
 * Implicitly awaits initialization if not yet complete.
 */
export async function runQuery(sql) {
  const conn = await getConnection();
  const result = await conn.query(sql);
  return result.toArray().map((row) => row.toJSON());
}
