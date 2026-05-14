#!/usr/bin/env bash
# Apply the Tools + Forum + Pick'em deploy bundle.
#
# Usage:
#   ./apply.sh
#   DB=mydb ROLE=admin ./apply.sh

set -euo pipefail

DB="${DB:-gamerhub}"
ROLE="${ROLE:-postgres}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Tools + Forum deploy → db=$DB, role=$ROLE"
echo "Folder: $DIR"
echo

for f in "$DIR"/[0-9][0-9]_*.sql; do
  name="$(basename "$f")"
  echo "→ Applying $name"
  sudo -u "$ROLE" psql -d "$DB" -v ON_ERROR_STOP=1 -f "$f"
  echo "  ✓ $name done"
  echo
done

echo "All migrations applied."
echo
echo "Sanity check:"
echo "  sudo -u $ROLE psql -d $DB -c 'SELECT slug, name, post_count FROM forum_categories ORDER BY display_order;'"
