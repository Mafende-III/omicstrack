import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import patientsRoutes from './routes/patients.routes.js';
import stepsRoutes from './routes/steps.routes.js';
import shipmentsRoutes from './routes/shipments.routes.js';
import auditRoutes from './routes/audit.routes.js';
import filesRoutes from './routes/files.routes.js';
import preferencesRoutes from './routes/preferences.routes.js';

const app = express();

// Security
app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Trust proxy for rate limiter behind nginx
app.set('trust proxy', 1);

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/patients', patientsRoutes);
app.use('/api/v1/steps', stepsRoutes);
app.use('/api/v1/shipments', shipmentsRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/files', filesRoutes);
app.use('/api/v1/preferences', preferencesRoutes);

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`[OmicsTrack API] Listening on port ${env.PORT} (${env.NODE_ENV})`);
});
