#!/usr/bin/env python3
"""
Import city records into the `locations` table in a SQLite database.

- Reads from CSV
- Creates `locations` table if it does not exist
- Defaults type = "City"
- Prevents duplicates via UNIQUE(city, state, country)

Usage:
python3 import_locations.py \
  --db backend/instance/site.db \
  --csv city_reference_with_state_code_and_type.csv
"""

import argparse
import csv
import sqlite3
from pathlib import Path

TABLE_NAME = "locations"


def ensure_table(conn: sqlite3.Connection) -> None:
    conn.execute(f"""
        CREATE TABLE IF NOT EXISTS {TABLE_NAME} (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            city TEXT NOT NULL,
            state TEXT,
            state_code TEXT,
            country TEXT NOT NULL,
            region TEXT,
            type TEXT NOT NULL DEFAULT 'City',
            UNIQUE(city, state, country)
        );
    """)
    conn.commit()


def import_csv(conn: sqlite3.Connection, csv_path: Path) -> tuple[int, int]:
    inserted = 0
    skipped = 0

    with csv_path.open(encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)

        required_cols = {"City", "State", "state_code", "Country", "Region", "Type"}
        missing = required_cols - set(reader.fieldnames or [])
        if missing:
            raise RuntimeError(f"CSV missing columns: {missing}")

        cursor = conn.cursor()

        for row in reader:
            city = (row["City"] or "").strip()
            state = (row["State"] or "").strip() or None
            state_code = (row["state_code"] or "").strip() or None
            country = (row["Country"] or "").strip()
            region = (row["Region"] or "").strip() or None
            record_type = (row["Type"] or "City").strip()

            if not city or not country:
                skipped += 1
                continue

            cursor.execute(
                f"""
                INSERT OR IGNORE INTO {TABLE_NAME}
                (city, state, state_code, country, region, type)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (city, state, state_code, country, region, record_type),
            )

            if cursor.rowcount == 1:
                inserted += 1
            else:
                skipped += 1

        conn.commit()

    return inserted, skipped


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--db", required=True, help="Path to site.db")
    parser.add_argument("--csv", required=True, help="Path to CSV file")
    args = parser.parse_args()

    db_path = Path(args.db).resolve()
    csv_path = Path(args.csv).resolve()

    if not db_path.exists():
        raise FileNotFoundError(f"Database not found: {db_path}")
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV not found: {csv_path}")

    conn = sqlite3.connect(db_path)
    try:
        conn.execute("PRAGMA foreign_keys = ON;")
        ensure_table(conn)
        inserted, skipped = import_csv(conn, csv_path)
        print(f"Import complete. Inserted: {inserted}, Skipped: {skipped}")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
