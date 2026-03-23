## ADDED Requirements

### Requirement: DuckDB-Wasm initialization module
The site SHALL include a `site/assets/js/duckdb_init.js` ES module that initializes DuckDB-Wasm v1.29.0, creates a shared database instance with a Web Worker, and exports a `getConnection()` function that returns a Promise resolving to a ready-to-query connection.

#### Scenario: First call to getConnection
- **WHEN** `getConnection()` is called for the first time
- **THEN** the module SHALL initialize DuckDB-Wasm, instantiate a database, open a connection, register all Parquet files, and return the connection

#### Scenario: Subsequent calls to getConnection
- **WHEN** `getConnection()` is called after initialization has completed
- **THEN** the module SHALL return the same cached connection without re-initializing

#### Scenario: Concurrent calls during initialization
- **WHEN** multiple callers invoke `getConnection()` before initialization completes
- **THEN** all callers SHALL receive the same Promise that resolves to a single shared connection

### Requirement: Parquet file registration
The initialization module SHALL register all three public Parquet files so they are queryable by name.

#### Scenario: Parquet files registered
- **WHEN** initialization completes
- **THEN** the connection SHALL be able to query `expenses_monthly`, `income_monthly`, and `events_public` as table names

#### Scenario: File paths
- **WHEN** the module fetches Parquet files
- **THEN** it SHALL resolve paths relative to the site root (e.g., `/data_public/expenses_monthly.parquet`) using `new URL("/", window.location.href)`, so paths work regardless of which page loads the module

#### Scenario: Fetch error handling
- **WHEN** a Parquet file fetch returns a non-OK response
- **THEN** the module SHALL throw an error including the URL and HTTP status code

### Requirement: Query helper function
The module SHALL export a `runQuery(sql)` function that accepts a SQL string, executes it against the shared connection, and returns the result as an array of plain JavaScript objects.

#### Scenario: Successful query
- **WHEN** `runQuery("SELECT * FROM expenses_monthly LIMIT 5")` is called
- **THEN** the function SHALL return an array of 5 objects, each with keys matching the Parquet column names (`date`, `flow_type`, `source`, `destination`, `sub_category`, `category`, `value`)

#### Scenario: Query before initialization
- **WHEN** `runQuery()` is called before `getConnection()` has been explicitly called
- **THEN** the function SHALL implicitly await initialization before executing the query

#### Scenario: Query error
- **WHEN** an invalid SQL string is passed to `runQuery()`
- **THEN** the function SHALL throw an error with the DuckDB error message

### Requirement: CDN loading
The module SHALL load DuckDB-Wasm from a CDN using ES module imports, pinned to v1.29.0.

#### Scenario: No local bundling required
- **WHEN** the explore page loads `duckdb_init.js`
- **THEN** the DuckDB-Wasm library SHALL be fetched from a CDN (e.g., jsdelivr or unpkg) without requiring any build step
