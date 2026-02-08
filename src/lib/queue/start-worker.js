/**
 * @file start-worker.js
 * @description Start the BullMQ worker for background job processing
 */

// Register TypeScript support
require('tsx/cjs');

// Load the worker
require('./worker.ts');

console.log('✅ Workflow worker started');
console.log('📊 Listening for jobs on queue: workflow-execution');
console.log('🔄 Press Ctrl+C to stop');

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down worker...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down worker...');
  process.exit(0);
});
