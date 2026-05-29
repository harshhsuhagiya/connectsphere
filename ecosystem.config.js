module.exports = {
  apps: [{
    name: "connectsphere-api",
    script: "./server.js",
    cwd: "./server",
    instances: "max",
    exec_mode: "cluster",
    env: {
      NODE_ENV: "development",
    },
    env_production: {
      NODE_ENV: "production",
      PORT: 5000
    }
  }]
}
