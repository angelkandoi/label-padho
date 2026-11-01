# 002. Why SQLite for Local Storage

## Status
Accepted

## Context
The app must support offline viewing of previously scanned products and store scan timestamps. The data is structured, relational, and requires atomic updates.

## Decision
Use `expo-sqlite` as the local persistent storage engine.

## Rationale & Consequences
1. **Relational Structure**: Products and scan history naturally fit a relational model with foreign key references, unique constraints, and indexes.
2. **ACID Guarantees**: SQLite provides durable local writes that do not corrupt if the app process terminates abruptly during scanning.
3. **Structured Migrations**: A dedicated `schema_version` table allows predictable schema upgrades over time.
4. **Performance**: Indexed queries by barcode provide sub-millisecond offline lookup times.
5. **Clean Data Deletion**: Satisfying the DPDP requirement for "Delete all my data" is as simple as running a structured transaction across local tables.
6. **Key-Value Unsuitability**: Key-value stores like AsyncStorage lack indexing, transaction safety, and structured querying for scan histories.

