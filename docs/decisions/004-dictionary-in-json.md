# 004. Dictionary in JSON Only

## Status
Accepted

## Context
The initial PRD suggested loading `src/data/ingredients.json` into an `ingredient_reference` SQLite table on first run.

## Decision
Keep the ingredient dictionary in `src/data/ingredients.json` only. Do not create an `ingredient_reference` table in SQLite. The SQLite database will only maintain three tables: `schema_version`, `products`, and `scan_history`.

## Rationale & Consequences
1. **YAGNI & Simplicity**: The dictionary contains static reference data (~40 entries) verified at build time. Loading it into SQLite adds unnecessary first-run seeding logic, schema complexity, and migration overhead.
2. **Performance**: Bundled JSON can be imported directly into memory, enabling instant synchronous lookups without SQLite query overhead.
3. **Purity**: Pasted ingredients are analysed on screen and not saved to the database. Only scanned products from Open Food Facts and scan timestamps need SQLite persistence.
4. **Maintenance**: Updating or adding reference entries only requires updating `src/data/ingredients.json`.

