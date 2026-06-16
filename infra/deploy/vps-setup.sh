#!/bin/bash
# ============================================================
# GamerHub VPS Setup Script
# Target: Hostinger VPS KVM 1 (Ubuntu 22.04, 4GB RAM, 1 vCPU)
# ============================================================

set -euo pipefail

echo "========================================="
echo "  GamerHub VPS Setup"
echo "========================================="

# ── 1. System Updates ──────────────────────────
echo "[1/7] Updating system packages..."
apt update && apt upgrade -y
apt install -y curl git build-essential nginx certbot python3-certbot-nginx ufw

# ── 2. Node.js 20 via nvm ─────────────────────
echo "[2/7] Installing Node.js 20..."
if ! command -v node &> /dev/null; then
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  nvm install 20
  nvm use 20
  nvm alias default 20
fi
npm install -g pm2

# ── 3. PostgreSQL 16 ──────────────────────────
echo "[3/7] Installing PostgreSQL 16..."
if ! command -v psql &> /dev/null; then
  sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
  wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
  apt update
  apt install -y postgresql-16 postgresql-contrib-16
fi

# Create database and user
echo "[3/7] Configuring PostgreSQL..."
sudo -u postgres psql -c "CREATE USER gamerhub_app WITH PASSWORD 'CHANGE_ME_PASSWORD';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE gamerhub OWNER gamerhub_app;" 2>/dev/null || true
sudo -u postgres psql -d gamerhub -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
sudo -u postgres psql -d gamerhub -c "CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";"

echo ""
echo "  !! IMPORTANT: Change the database password !!"
echo "  Run: sudo -u postgres psql -c \"ALTER USER gamerhub_app WITH PASSWORD 'your-secure-password';\""
echo ""

# ── 4. Firewall ───────────────────────────────
echo "[4/7] Configuring firewall..."
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable

# ── 5. Create app directory ───────────────────
echo "[5/7] Creating app directory..."
mkdir -p /var/www/gglobby
mkdir -p /var/www/gglobby/uploads
mkdir -p /var/www/gglobby/backups
chown -R $USER:$USER /var/www/gglobby

# ── 6. Nginx Configuration ───────────────────
echo "[6/7] Configuring Nginx..."
cat > /etc/nginx/sites-available/gglobby << 'NGINX_CONF'
server {
    listen 80;
    server_name gglobby.in www.gglobby.in;

    # Uploads directory - served directly by Nginx
    location /uploads/ {
        alias /var/www/gglobby/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin "*";

        # Security: prevent executing scripts from uploads
        location ~* \.(php|py|pl|sh|cgi)$ {
            deny all;
        }
    }

    # Next.js + Socket.io
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Increase timeouts for Socket.io
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # Socket.io specific path
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400s;
    }

    # Max upload size (50MB for media)
    client_max_body_size 50M;
}
NGINX_CONF

ln -sf /etc/nginx/sites-available/gglobby /etc/nginx/sites-enabled/gglobby
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# ── 7. SSL Certificate ───────────────────────
echo "[7/7] Setting up SSL..."
echo ""
echo "  After DNS is pointed to this server, run:"
echo "  certbot --nginx -d gglobby.in -d www.gglobby.in"
echo ""

# ── Summary ───────────────────────────────────
echo "========================================="
echo "  Setup Complete!"
echo "========================================="
echo ""
echo "  Next steps:"
echo "  1. Change PostgreSQL password (see above)"
echo "  2. Point DNS to this server's IP"
echo "  3. Run certbot for SSL"
echo "  4. Clone repo: cd /var/www/gglobby && git clone <repo> ."
echo "  5. Copy .env file (see scripts/env-template)"
echo "  6. npm install && npm run build"
echo "  7. pm2 start ecosystem.config.js"
echo ""
