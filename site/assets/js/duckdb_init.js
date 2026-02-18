/**
 * DuckDB-Wasm lazy singleton.
 *
 * Usage:
 *   import { getDB, queryAsObjects } from './duckdb_init.js';
 *   const rows = await queryAsObjects("SELECT * FROM 'data_public/spend.parquet' LIMIT 10");
 */

const DUCKDB_VERSION = "1.29.0";
const CDN = `https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@${DUCKDB_VERSION}/dist`;

let _dbPromise = null;

/**
 * Returns a shared AsyncDuckDB instance (creates on first call).
 */
export async function getDB() {
  if (_dbPromise) return _dbPromise;

  _dbPromise = (async () => {
    const duckdb = await import(`${CDN}/duckdb-eh.js`);

    const BUNDLES = {
      mvp: {
        mainModule: `${CDN}/duckdb-mvp.wasm`,
        mainWorker: `${CDN}/duckdb-browser-mvp.worker.js`,
      },
      eh: {
        mainModule: `${CDN}/duckdb-eh.wasm`,
        mainWorker: `${CDN}/duckdb-browser-eh.worker.js`,
      },
    };

    const bundle = await duckdb.selectBundle(BUNDLES);
    const worker = new Worker(bundle.mainWorker);
    const logger = new duckdb.ConsoleLogger();
    const db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule);
    return db;
  })();

  return _dbPromise;
}

/**
 * Run a SQL query and return results as an array of plain JS objects.
 */
export async function queryAsObjects(sql) {
  const db = await getDB();
  const conn = await db.connect();
  try {
    const result = await conn.query(sql);
    return result.toArray().map((row) => row.toJSON());
  } finally {
    await conn.close();
  }
}
