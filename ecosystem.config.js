// pm2 start ecosystem.config.js
module.exports = {
    apps : [{
      name   : "production",
      script : "./index.js",
      error_file : "./.logs/<app name>-error.log",
      out_file : "./.logs/<app name>-out.log",
    }]
  }