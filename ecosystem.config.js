module.exports = {
  apps: [
    {
      name: "gglobby",
      script: "node_modules/.bin/ts-node",
      args: "--transpile-only server.ts",
      cwd: "/var/www/gglobby",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "3G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "/var/www/gglobby/logs/error.log",
      out_file: "/var/www/gglobby/logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
    },
  ],
};
