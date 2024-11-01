module.exports = {
  apps: [
    {
      name: 'learn2earn',
      script: 'dist/app.js',
      ignore_watch: ['node_modules'],
      instances: 1,
      autorestart: true,
    },
  ],
};
