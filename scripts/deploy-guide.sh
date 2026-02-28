#!/bin/bash
# ============================================================
# GamerHub VPS Deployment Guide
# Run these commands on your Hostinger VPS (Ubuntu 24.04)
# ============================================================
#
# This file is a REFERENCE GUIDE — run commands one section
# at a time, not the whole file at once.
#
# Current status:
#   [DONE] VPS setup (vps-setup.sh)
#   [DONE] PostgreSQL installed
#   [DONE] Nginx configured
#   [DONE] SSL certificate
#   [DONE] App cloned, built, running with PM2
#   [TODO] Database schema migration (tables don't exist yet)
#   [TODO] Data migration from Supabase
#   [TODO] Google OAuth redirect URI update
#
# ============================================================


# ============================================================
# STEP 1: EXPORT SCHEMA FROM SUPABASE
# ============================================================
#
# Run this from your LOCAL machine (not VPS).
# You need the Supabase database connection string.
# Find it in: Supabase Dashboard → Settings → Database → Connection string (URI)
#
# It looks like: postgresql://postgres:[PASSWORD]@db.trbmdbvnydxdmvnddort.supabase.co:5432/postgres
#
# This dumps ONLY the table structure (no data yet):

# pg_dump \
#   --schema-only \
#   --schema=public \
#   --no-owner \
#   --no-privileges \
#   "postgresql://postgres:[YOUR_SUPABASE_PASSWORD]@db.trbmdbvnydxdmvnddort.supabase.co:5432/postgres" \
#   > supabase_schema.sql

# ── What this does ──
# --schema-only     : Only table definitions, indexes, constraints — no row data
# --schema=public   : Only the public schema (skips auth, storage, etc.)
# --no-owner        : Removes "ALTER TABLE ... OWNER TO" lines (different user on VPS)
# --no-privileges   : Removes GRANT/REVOKE (we'll set our own permissions)


# ============================================================
# STEP 2: CLEAN THE SCHEMA DUMP
# ============================================================
#
# The dump will contain Supabase-specific things that need removing.
# Run these on your LOCAL machine after Step 1:

# Remove references to Supabase internal schemas
# sed -i '/auth\./d' supabase_schema.sql
# sed -i '/supabase_realtime/d' supabase_schema.sql
# sed -i '/supabase_functions/d' supabase_schema.sql
# sed -i '/extensions\./d' supabase_schema.sql
# sed -i '/ALTER PUBLICATION/d' supabase_schema.sql

# ── What this does ──
# Removes lines referencing auth.users foreign keys, Supabase realtime
# publication settings, and extension schema references that don't exist
# on your VPS PostgreSQL.
#
# IMPORTANT: After running these, open supabase_schema.sql in a text editor
# and manually check for any remaining "auth." or "supabase" references.
# Also look for FOREIGN KEY constraints referencing auth.users — those need
# to reference our new "users" table instead.


# ============================================================
# STEP 3: CREATE THE USERS TABLE ON VPS
# ============================================================
#
# Supabase had auth.users — we need our own users table.
# This was already prepared in scripts/migration-schema.sql.
# Run on VPS:

# sudo -u postgres psql -d gamerhub -f /var/www/gglobby/scripts/migration-schema.sql

# ── What this does ──
# Creates the "users" table with columns:
#   - id (UUID, primary key)
#   - email (unique)
#   - encrypted_password (bcrypt hash)
#   - provider (google/email)
#   - provider_account_id
#   - created_at, updated_at
# This table replaces Supabase's auth.users.


# ============================================================
# STEP 4: IMPORT SCHEMA INTO VPS DATABASE
# ============================================================
#
# First, copy the cleaned schema file to VPS:

# scp supabase_schema.sql root@187.77.191.134:/var/www/gglobby/

# Then on VPS, import it:

# sudo -u postgres psql -d gamerhub -f /var/www/gglobby/supabase_schema.sql

# ── What this does ──
# Creates all tables (profiles, conversations, messages, clans, tournaments,
# friend_requests, notifications, etc.) in the gamerhub database.
#
# If you see errors about "relation already exists" — that's OK, it means
# the table was already created (e.g., the users table from Step 3).
#
# If you see errors about "type does not exist" — you may need to create
# missing extensions:
#   sudo -u postgres psql -d gamerhub -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
#   sudo -u postgres psql -d gamerhub -c "CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";"


# ============================================================
# STEP 5: EXPORT DATA FROM SUPABASE
# ============================================================
#
# Run this from your LOCAL machine.
# This dumps all row data (users, profiles, messages, etc.):

# pg_dump \
#   --data-only \
#   --schema=public \
#   --no-owner \
#   --no-privileges \
#   "postgresql://postgres:[YOUR_SUPABASE_PASSWORD]@db.trbmdbvnydxdmvnddort.supabase.co:5432/postgres" \
#   > supabase_data.sql

# ── What this does ──
# --data-only : Only INSERT statements — no CREATE TABLE
# Exports all rows from every table in the public schema.


# ============================================================
# STEP 6: IMPORT DATA INTO VPS DATABASE
# ============================================================
#
# Copy data file to VPS:

# scp supabase_data.sql root@187.77.191.134:/var/www/gglobby/

# Import on VPS:

# sudo -u postgres psql -d gamerhub -f /var/www/gglobby/supabase_data.sql

# ── What this does ──
# Inserts all your existing data (users, profiles, messages, clans, etc.)
# into the VPS database.
#
# If you see FK constraint errors, it means some data references tables
# that don't exist yet. Try importing the schema again, or check which
# table is missing.


# ============================================================
# STEP 7: MIGRATE USER PASSWORDS
# ============================================================
#
# Supabase stores passwords in auth.users (not public schema).
# You need to export them separately.
#
# Option A: Via Supabase Dashboard SQL Editor, run:
#
#   SELECT id, email, encrypted_password, raw_app_meta_data->>'provider' as provider
#   FROM auth.users;
#
# Then insert into your VPS users table:
#
#   INSERT INTO users (id, email, encrypted_password, provider)
#   VALUES ('uuid-here', 'email@example.com', '$2a$...hash...', 'email');
#
# Option B: Use Supabase Management API to export users.
#
# ── What this does ──
# Migrates user accounts so existing users can log in with their
# same email/password on the new VPS. The password hashes are bcrypt
# so they work directly with Auth.js Credentials provider.


# ============================================================
# STEP 8: UPDATE STORAGE URLs IN DATABASE
# ============================================================
#
# Old URLs: https://trbmdbvnydxdmvnddort.supabase.co/storage/v1/object/public/media/...
# New URLs: https://gglobby.in/uploads/...
#
# Run on VPS:

# sudo -u postgres psql -d gamerhub -c "
# UPDATE profiles SET avatar_url = REPLACE(avatar_url,
#   'trbmdbvnydxdmvnddort.supabase.co/storage/v1/object/public/media/',
#   'gglobby.in/uploads/')
# WHERE avatar_url LIKE '%supabase%';
# "

# sudo -u postgres psql -d gamerhub -c "
# UPDATE profiles SET banner_url = REPLACE(banner_url,
#   'trbmdbvnydxdmvnddort.supabase.co/storage/v1/object/public/media/',
#   'gglobby.in/uploads/')
# WHERE banner_url LIKE '%supabase%';
# "

# sudo -u postgres psql -d gamerhub -c "
# UPDATE clans SET avatar_url = REPLACE(avatar_url,
#   'trbmdbvnydxdmvnddort.supabase.co/storage/v1/object/public/media/',
#   'gglobby.in/uploads/')
# WHERE avatar_url LIKE '%supabase%';
# "

# sudo -u postgres psql -d gamerhub -c "
# UPDATE clans SET banner_url = REPLACE(banner_url,
#   'trbmdbvnydxdmvnddort.supabase.co/storage/v1/object/public/media/',
#   'gglobby.in/uploads/')
# WHERE banner_url LIKE '%supabase%';
# "

# ── What this does ──
# Rewrites all image URLs stored in the database from old Supabase Storage
# URLs to new self-hosted URLs. This ensures avatars, banners, and uploaded
# media display correctly.


# ============================================================
# STEP 9: MIGRATE STORAGE FILES
# ============================================================
#
# Download all files from Supabase Storage and upload to VPS.
#
# Option A: Supabase Dashboard → Storage → media → Download files manually
#
# Option B: Use Supabase CLI:
#   npx supabase storage ls --recursive gs://media/ > file_list.txt
#   # Then download each file
#
# Option C: Use the Supabase Storage API:
#   curl -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
#     "https://trbmdbvnydxdmvnddort.supabase.co/storage/v1/object/list/media" \
#     | jq -r '.[].name'
#
# After downloading, copy to VPS:
#   scp -r media/* root@187.77.191.134:/var/www/gglobby/uploads/
#
# ── What this does ──
# Moves all uploaded files (avatars, banners, post images) from
# Supabase Storage to the VPS local disk. Nginx serves these directly
# from /var/www/gglobby/uploads/ with cache headers.


# ============================================================
# STEP 10: UPDATE GOOGLE OAUTH
# ============================================================
#
# Go to: https://console.cloud.google.com/
# Navigate to: APIs & Services → Credentials → Your OAuth 2.0 Client
#
# Under "Authorized redirect URIs", ADD:
#   https://gglobby.in/api/auth/callback/google
#
# You can REMOVE the old Supabase one:
#   https://trbmdbvnydxdmvnddort.supabase.co/auth/v1/callback
#
# Also update "Authorized JavaScript origins":
#   https://gglobby.in
#
# ── What this does ──
# Google OAuth now redirects to YOUR VPS instead of Supabase.
# Since gglobby.in is not blocked by ISPs (unlike supabase.co),
# Google Sign-In will work for all Indian users!


# ============================================================
# STEP 11: VERIFY & RESTART
# ============================================================
#
# After all migrations, restart the app:

# cd /var/www/gglobby && git pull && npm run build && pm2 restart gglobby

# Check logs:
# pm2 logs gglobby --lines 30

# Verify in browser:
# 1. Open https://gglobby.in — should load the community page
# 2. Try Google Sign-In — should work without ISP blocking
# 3. Check if profiles/avatars load
# 4. Send a test message — verify Socket.io works
# 5. Try on Jio/Airtel network — verify NO DNS blocking!


# ============================================================
# STEP 12: SET UP DAILY BACKUPS
# ============================================================
#
# Add a cron job for daily database backups:

# crontab -e
# Add this line:
# 0 3 * * * /var/www/gglobby/scripts/backup.sh

# ── What this does ──
# Runs backup.sh every day at 3:00 AM. The script does a pg_dump
# to /var/www/gglobby/backups/ and keeps the last 7 days.


# ============================================================
# USEFUL COMMANDS REFERENCE
# ============================================================
#
# ── App Management ──
# pm2 status                    : Check if app is running
# pm2 logs gglobby --lines 50   : View recent logs
# pm2 restart gglobby           : Restart the app
# pm2 stop gglobby              : Stop the app
# pm2 delete gglobby            : Remove from PM2
#
# ── Database ──
# sudo -u postgres psql -d gamerhub              : Connect to database
# sudo -u postgres psql -d gamerhub -c "\dt"     : List all tables
# sudo -u postgres psql -d gamerhub -c "SELECT count(*) FROM profiles;"  : Count rows
#
# ── Nginx ──
# nginx -t                      : Test config syntax
# systemctl reload nginx        : Reload config
# systemctl status nginx        : Check status
#
# ── SSL ──
# certbot renew --dry-run       : Test SSL renewal
# certbot certificates          : List certificates
#
# ── Deploying Updates ──
# cd /var/www/gglobby && git pull && npm install && npm run build && pm2 restart gglobby
#
# ── Logs ──
# tail -f /var/www/gglobby/logs/out.log     : Live app logs
# tail -f /var/www/gglobby/logs/error.log   : Live error logs
# tail -f /var/log/nginx/access.log         : Nginx access log
# tail -f /var/log/nginx/error.log          : Nginx error log
