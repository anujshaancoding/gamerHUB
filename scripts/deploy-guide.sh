#!/bin/bash
# ============================================================
# ggLobby VPS Deployment Guide
# Hostinger VPS (Ubuntu 24.04)
# ============================================================
#
# This file is a REFERENCE GUIDE — run commands one section
# at a time, not the whole file at once.
#
# Infrastructure:
#   - PostgreSQL database (gamerhub)
#   - Nginx reverse proxy with SSL
#   - PM2 process manager
#   - Auth.js with Google OAuth
#   - Self-hosted file uploads at /var/www/gglobby/uploads/
#
# ============================================================


# ============================================================
# DEPLOYING UPDATES
# ============================================================

# cd /var/www/gglobby && git pull && npm install && npm run build && pm2 restart gglobby

# Check logs after deploy:
# pm2 logs gglobby --lines 30


# ============================================================
# RUNNING MIGRATIONS
# ============================================================

# sudo -u postgres psql -d gamerhub -f /var/www/gglobby/scripts/migrations/<migration_file>.sql


# ============================================================
# DAILY BACKUPS
# ============================================================
#
# Cron job runs backup.sh every day at 3:00 AM:
#   0 3 * * * /var/www/gglobby/scripts/backup.sh
#
# The script does a pg_dump to /var/www/gglobby/backups/
# and keeps the last 7 days.


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
# ── Logs ──
# tail -f /var/www/gglobby/logs/out.log     : Live app logs
# tail -f /var/www/gglobby/logs/error.log   : Live error logs
# tail -f /var/log/nginx/access.log         : Nginx access log
# tail -f /var/log/nginx/error.log          : Nginx error log
