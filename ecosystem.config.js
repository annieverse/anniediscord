// pm2 start ecosystem.config.js
module.exports = {
  apps: [{
    name: "prod",
    script: "./index.js",
    error_file: "~/.pm2/logs/prod-error.log",
    out_file: "~/.pm2/logs/prod-out.log",
    namespace: "prod"
  }]
}