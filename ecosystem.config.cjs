module.exports = {
  apps: [
    {
      name: 'ai-review-api',
      script: 'npm',
      args: 'run dev',
      interpreter: 'none',
      env: {
        NODE_ENV: 'development',
      },
      watch: false,
      max_memory_restart: '1G',
    },
    {
      name: 'ai-review-worker',
      script: 'npm',
      args: 'run dev:worker',
      interpreter: 'none',
      env: {
        NODE_ENV: 'development',
      },
      watch: false,
      max_memory_restart: '1G',
    },
  ],
};
