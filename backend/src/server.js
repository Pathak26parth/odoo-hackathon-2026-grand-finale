const app = require('./app');
const env = require('./config/env');
const { testConnection } = require('./config/db');

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err.message, err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection]', reason);
});

async function startServer() {
  console.log('================================================================');
  console.log('  PEOPLEPAY360 HR & PAYROLL PLATFORM - BACKEND SERVER          ');
  console.log('================================================================');

  // Verify MySQL Connection
  const isDbConnected = await testConnection();
  if (!isDbConnected) {
    console.error('[Fatal Error] MySQL database connection could not be established. Exiting.');
    process.exit(1);
  }

  const server = app.listen(env.PORT, () => {
    console.log(`[Server] PeoplePay360 REST API running on http://localhost:${env.PORT}`);
    console.log(`[Server] Health Check available at http://localhost:${env.PORT}/api/health`);
    console.log(`[Server] Environment: ${env.NODE_ENV}`);
    console.log('================================================================\n');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[Server Error] Port ${env.PORT} is already in use by another process.`);
    } else {
      console.error('[Server Error]', err.message);
    }
  });

  // Graceful shutdown handling
  const shutdown = () => {
    console.log('\n[Server] Shutting down gracefully...');
    server.close(() => {
      console.log('[Server] Closed remaining connections. Exited.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

if (require.main === module) {
  startServer();
}

module.exports = startServer;
