// pm2 start ecosystem.config.js
module.exports = {
  apps: [{
    name: "prod",
    script: "./index.js",
    // Disable PM2 file logging since Pino handles it in production
    out_file: "/dev/null",
    error_file: "/dev/null",
    namespace: "prod",
    combined_logs: true,
    log_type: "json"
  }]
}