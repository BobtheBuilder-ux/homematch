module.exports = {
  apps: [
    {
      name: "HomeMatch Server",
      script: "npx",
      args: "ts-node src/index.ts",
      env: {
        NODE_ENV: "development",
      },
    },
  ],
};
