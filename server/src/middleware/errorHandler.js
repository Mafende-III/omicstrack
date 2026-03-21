import { env } from '../config/env.js';

export function errorHandler(err, req, res, _next) {
  console.error(`[${new Date().toISOString()}] ${err.stack || err.message}`);

  const status = err.status || 500;
  const response = {
    error: err.message || 'Internal server error',
  };

  if (env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(status).json(response);
}
