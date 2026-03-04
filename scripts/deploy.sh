#!/bin/bash
# ============================================================
# GamerHub Quick Deploy Script
# Run on VPS: bash /var/www/gglobby/scripts/deploy.sh
# ============================================================

set -e

APP_DIR="/var/www/gglobby"
DB_NAME="gamerhub"
MIGRATIONS_DIR="$APP_DIR/scripts/migrations"

cd "$APP_DIR"

echo "==============================="
echo "  GamerHub Deploy"
echo "==============================="

# Step 1: Pull latest code
echo ""
echo "[1/4] Pulling latest code..."
git pull origin main

# Step 2: Install dependencies (only if package-lock changed)
if git diff HEAD~1 --name-only | grep -q "package-lock.json"; then
  echo ""
  echo "[2/4] Installing new dependencies..."
  npm install --production=false
else
  echo ""
  echo "[2/4] No new dependencies, skipping npm install"
fi

# Step 3: Run pending SQL migrations
echo ""
echo "[3/4] Checking for pending migrations..."

# Create migrations tracking table if it doesn't exist
sudo -u postgres psql -d "$DB_NAME" -q -c "
  CREATE TABLE IF NOT EXISTS _migrations (
    filename TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
" 2>/dev/null

# Run any .sql files in scripts/migrations/ that haven't been applied yet
if [ -d "$MIGRATIONS_DIR" ]; then
  PENDING=0
  for sql_file in "$MIGRATIONS_DIR"/*.sql; do
    [ -f "$sql_file" ] || continue
    FILENAME=$(basename "$sql_file")

    # Check if already applied
    APPLIED=$(sudo -u postgres psql -d "$DB_NAME" -tAc "
      SELECT 1 FROM _migrations WHERE filename = '$FILENAME';
    " 2>/dev/null)

    if [ -z "$APPLIED" ]; then
      echo "  Running migration: $FILENAME"
      sudo -u postgres psql -d "$DB_NAME" -f "$sql_file"

      # Record as applied
      sudo -u postgres psql -d "$DB_NAME" -q -c "
        INSERT INTO _migrations (filename) VALUES ('$FILENAME');
      "
      PENDING=$((PENDING + 1))
    fi
  done

  if [ "$PENDING" -eq 0 ]; then
    echo "  No pending migrations"
  else
    echo "  Applied $PENDING migration(s)"
  fi
else
  echo "  No migrations directory found, creating it..."
  mkdir -p "$MIGRATIONS_DIR"
  echo "  No pending migrations"
fi

# Step 4: Build and restart
echo ""
echo "[4/4] Building and restarting..."
npm run build
pm2 restart gglobby

echo ""
echo "==============================="
echo "  Deploy complete!"
echo "==============================="
echo ""
pm2 status
echo ""
echo "Check logs: pm2 logs gglobby --lines 20"
