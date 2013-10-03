module.exports = process.env.COVERAGE
  ? require('./lib-cov/redis-scripts')
  : require('./lib/redis-scripts');
