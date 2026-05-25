import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import chatRouter from './routes/chat';
import servicesRouter from './routes/services';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

// ─── Request Logging ──────────────────────────────────────────────────────────

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/chat', chatRouter);
app.use('/api/services', servicesRouter);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'AgentHub API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ─── Error Handler ────────────────────────────────────────────────────────────

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
);

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║   🤖 AgentHub API running             ║
║   Port: ${PORT}                          ║
║   Env:  ${process.env.NODE_ENV || 'development'}               ║
╚═══════════════════════════════════════╝
  `);
});

export default app;
