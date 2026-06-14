module.exports = {
  apps: [
    {
      name: 'aisle-backend',
      script: 'server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        DISABLE_SCHEDULERS: 'true'
      },
      env_production: {
        NODE_ENV: 'production',
        DISABLE_SCHEDULERS: 'true'
      },
      watch: false,
      max_memory_restart: '1G',
      error_file: 'logs/err.log',
      out_file: 'logs/out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'aisle-worker',
      script: 'worker.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      watch: false,
      max_memory_restart: '1G',
      error_file: 'logs/worker-err.log',
      out_file: 'logs/worker-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
