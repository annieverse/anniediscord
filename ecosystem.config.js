// pm2 start ecosystem.config.js
module.exports = {
    apps : [{
      name   : "prod",
      script : "./index.js",
    }]
  }