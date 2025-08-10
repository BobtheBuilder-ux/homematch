module.exports = {
  apps: [
    {
      name: "HomeMatch Server",
      script: "npm",
      args: "run dev",
      env: {
        NODE_ENV: "development",
      },
    },
  ],
};
