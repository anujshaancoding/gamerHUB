#!/bin/bash
# ============================================================
# GamerHub VPS Troubleshooting Guide
# Common errors and how to fix them
# ============================================================


# ============================================================
# ERROR: "relation X does not exist" (code: 42P01)
# ============================================================
#
# CAUSE: The database tables haven't been created yet, or the
#        schema import failed/was incomplete.
#
# FIX: Check which tables exist:
#   sudo -u postgres psql -d gamerhub -c "\dt"
#
# If empty, re-import the schema:
#   sudo -u postgres psql -d gamerhub -f /var/www/gglobby/supabase_schema.sql
#
# If partially imported, check the error output — usually a missing
# extension or a FK reference to auth.users that needs to be changed
# to reference the "users" table instead.


# ============================================================
# ERROR: "UntrustedHost: Host must be trusted"
# ============================================================
#
# CAUSE: Auth.js doesn't trust the domain because Cloudflare proxy
#        changes the request host/protocol.
#
# FIX: Already fixed by adding trustHost: true in auth.config.ts.
#      If it reappears, check .env.local on VPS:
#   nano /var/www/gglobby/.env.local
#
# Make sure these are set:
#   NEXTAUTH_URL=https://gglobby.in
#   NEXT_PUBLIC_APP_URL=https://gglobby.in


# ============================================================
# ERROR: "ECONNREFUSED 127.0.0.1:5432"
# ============================================================
#
# CAUSE: PostgreSQL is not running.
#
# FIX:
#   sudo systemctl start postgresql
#   sudo systemctl enable postgresql   # auto-start on boot
#   sudo systemctl status postgresql   # verify it's running


# ============================================================
# ERROR: "password authentication failed for user gamerhub_app"
# ============================================================
#
# CAUSE: Wrong password in DATABASE_URL.
#
# FIX: Reset the password:
#   sudo -u postgres psql -c "ALTER USER gamerhub_app WITH PASSWORD 'new-password';"
#
# Then update .env.local:
#   nano /var/www/gglobby/.env.local
#   # Change DATABASE_URL to use the new password
#
# Then restart:
#   pm2 restart gglobby


# ============================================================
# ERROR: "npm: command not found" (after SSH reconnect)
# ============================================================
#
# CAUSE: nvm isn't loaded in the new shell session.
#
# FIX: Load nvm first:
#   export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
#
# To make it permanent, add to ~/.bashrc:
#   echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.bashrc
#   echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.bashrc
#   source ~/.bashrc


# ============================================================
# ERROR: PM2 shows "errored" or "stopped" status
# ============================================================
#
# CAUSE: App crashed during startup.
#
# FIX: Check the error logs:
#   pm2 logs gglobby --lines 100 --err
#
# Common causes:
#   - Missing .env.local file → cp scripts/env-template .env.local && nano .env.local
#   - Database not running → sudo systemctl start postgresql
#   - Port 3000 already in use → kill $(lsof -ti:3000) then pm2 restart gglobby
#   - Build is outdated → npm run build && pm2 restart gglobby
#
# To restart cleanly:
#   pm2 delete gglobby
#   pm2 start ecosystem.config.js


# ============================================================
# ERROR: Site not loading / ERR_CONNECTION_TIMED_OUT
# ============================================================
#
# CAUSE: Nginx not running, or firewall blocking, or DNS not pointed.
#
# FIX (check in order):
#
# 1. Is Nginx running?
#   sudo systemctl status nginx
#   sudo systemctl start nginx    # if not running
#
# 2. Is the app running?
#   pm2 status
#   pm2 restart gglobby           # if not running
#
# 3. Is the firewall allowing traffic?
#   sudo ufw status
#   sudo ufw allow 'Nginx Full'  # if not listed
#
# 4. Is DNS pointed correctly?
#   dig gglobby.in                # should show your VPS IP
#   # Or check Cloudflare DNS dashboard


# ============================================================
# ERROR: "502 Bad Gateway" from Nginx
# ============================================================
#
# CAUSE: Nginx is running but the Node.js app isn't, or it's on
#        a different port.
#
# FIX:
#   pm2 status                    # check if app is running
#   pm2 restart gglobby           # restart if needed
#   curl http://localhost:3000    # test directly (bypass Nginx)
#
# If curl works but site doesn't, Nginx config is wrong:
#   nginx -t                      # check config syntax
#   cat /etc/nginx/sites-available/gglobby  # verify proxy_pass port


# ============================================================
# ERROR: SSL certificate expired / not working
# ============================================================
#
# FIX: Renew the certificate:
#   sudo certbot renew
#
# If that fails:
#   sudo certbot --nginx -d gglobby.in -d www.gglobby.in
#
# Set up auto-renewal (should already be configured):
#   sudo certbot renew --dry-run   # test renewal


# ============================================================
# ERROR: Google Sign-In not working
# ============================================================
#
# CAUSE: OAuth redirect URI not updated in Google Cloud Console.
#
# FIX:
# 1. Go to https://console.cloud.google.com/
# 2. APIs & Services → Credentials → your OAuth client
# 3. Add redirect URI: https://gglobby.in/api/auth/callback/google
# 4. Add JS origin: https://gglobby.in
# 5. Remove old Supabase redirect URI
#
# Also check .env.local has correct Google keys:
#   GOOGLE_CLIENT_ID=...
#   GOOGLE_CLIENT_SECRET=...


# ============================================================
# ERROR: Socket.io not connecting / realtime not working
# ============================================================
#
# CAUSE: WebSocket upgrade not reaching the app.
#
# FIX: Check Nginx config has WebSocket headers:
#   cat /etc/nginx/sites-available/gglobby | grep -A5 "socket.io"
#
# Should have:
#   proxy_http_version 1.1;
#   proxy_set_header Upgrade $http_upgrade;
#   proxy_set_header Connection "upgrade";
#
# If using Cloudflare, make sure WebSockets are enabled:
#   Cloudflare Dashboard → Network → WebSockets → ON
#
# Also check the app logs:
#   pm2 logs gglobby --lines 20 | grep -i socket


# ============================================================
# ERROR: File uploads not working
# ============================================================
#
# CAUSE: Upload directory doesn't exist or wrong permissions.
#
# FIX:
#   mkdir -p /var/www/gglobby/uploads
#   chown -R root:root /var/www/gglobby/uploads
#   chmod 755 /var/www/gglobby/uploads
#
# Check .env.local has:
#   UPLOAD_DIR=/var/www/gglobby/uploads
#
# Check Nginx config serves /uploads/:
#   curl -I https://gglobby.in/uploads/test.txt  # should return 404 not 502


# ============================================================
# ERROR: "pg_dump: server version mismatch"
# ============================================================
#
# CAUSE: Your local pg_dump version doesn't match Supabase's PostgreSQL.
# Supabase uses PostgreSQL 15. Your VPS has PostgreSQL 16.
#
# FIX: Install matching pg_dump version locally:
#   # On Mac:
#   brew install postgresql@15
#   /usr/local/opt/postgresql@15/bin/pg_dump ...
#
#   # On Ubuntu/WSL:
#   sudo apt install postgresql-client-15
#   /usr/lib/postgresql/15/bin/pg_dump ...
#
# OR just ignore the warning — minor version mismatches usually work fine.


# ============================================================
# ERROR: Schema import fails with "permission denied"
# ============================================================
#
# CAUSE: gamerhub_app user doesn't have permission to create tables.
#
# FIX: Run schema import as postgres superuser:
#   sudo -u postgres psql -d gamerhub -f supabase_schema.sql
#
# Then grant permissions:
#   sudo -u postgres psql -d gamerhub -c "GRANT ALL ON ALL TABLES IN SCHEMA public TO gamerhub_app;"
#   sudo -u postgres psql -d gamerhub -c "GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO gamerhub_app;"
#   sudo -u postgres psql -d gamerhub -c "GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO gamerhub_app;"
#   sudo -u postgres psql -d gamerhub -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO gamerhub_app;"


# ============================================================
# ERROR: "out of memory" or app keeps restarting
# ============================================================
#
# CAUSE: VPS has 4GB RAM — might run out during build or heavy load.
#
# FIX: Add swap space:
#   sudo fallocate -l 2G /swapfile
#   sudo chmod 600 /swapfile
#   sudo mkswap /swapfile
#   sudo swapon /swapfile
#   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
#
# Check memory usage:
#   free -h
#   pm2 monit   # live memory/CPU monitoring


# ============================================================
# HOW TO COMPLETELY START FRESH
# ============================================================
#
# If everything is broken and you want to start over:
#
# 1. Stop everything:
#   pm2 delete all
#
# 2. Drop and recreate database:
#   sudo -u postgres psql -c "DROP DATABASE gamerhub;"
#   sudo -u postgres psql -c "CREATE DATABASE gamerhub OWNER gamerhub_app;"
#   sudo -u postgres psql -d gamerhub -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
#   sudo -u postgres psql -d gamerhub -c "CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";"
#
# 3. Re-clone the repo:
#   rm -rf /var/www/gglobby/*
#   cd /var/www/gglobby && git clone https://github.com/anujshaancoding/gamerHUB.git .
#
# 4. Set up again:
#   cp scripts/env-template .env.local && nano .env.local
#   export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
#   npm install && npm run build
#   mkdir -p logs
#   pm2 start ecosystem.config.js
#   pm2 save
