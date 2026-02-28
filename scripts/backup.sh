#!/bin/bash
# Daily database backup script
# Add to crontab: 0 3 * * * /var/www/gglobby/scripts/backup.sh

BACKUP_DIR="/var/www/gglobby/backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="gamerhub_${DATE}.sql.gz"

# Create backup
pg_dump -U gamerhub_app gamerhub | gzip > "${BACKUP_DIR}/${FILENAME}"

# Keep only last 7 daily backups
find "${BACKUP_DIR}" -name "gamerhub_*.sql.gz" -mtime +7 -delete

echo "Backup created: ${FILENAME}"
