#!/usr/bin/env bash
# Apply the Pro Hub deploy bundle to the local Postgres database.
#
# Usage:
#   ./apply.sh                 # uses defaults: db=gamerhub, role=postgres
#   DB=mydb ROLE=admin ./apply.sh
#
# Stops at the first failure (set -e).

set -euo pipefail

DB="${DB:-gamerhub}"
ROLE="${ROLE:-postgres}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Pro Hub deploy → db=$DB, role=$ROLE"
echo "Folder: $DIR"
echo

# Apply every .sql file matching NN_*.sql in numeric order. Skip verify.sql.
for f in "$DIR"/[0-9][0-9]_*.sql; do
  name="$(basename "$f")"
  echo "→ Applying $name"
  sudo -u "$ROLE" psql -d "$DB" -v ON_ERROR_STOP=1 -f "$f"
  echo "  ✓ $name done"
  echo
done

echo "All migrations applied."
echo
echo "Run sanity checks with:"
echo "  sudo -u $ROLE psql -d $DB -f $DIR/verify.sql"
