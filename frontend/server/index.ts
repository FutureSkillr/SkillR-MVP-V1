import express from 'express';
import cors from 'cors';
import { seedDefaultAdmin } from './seed.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import sessionRoutes from './routes/sessions.js';
import promptLogRoutes from './routes/promptLogs.js';
import analyticsRoutes from './routes/analytics.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/prompt-logs', promptLogRoutes);
app.use('/api/analytics', analyticsRoutes);

// Redirect root to Vite dev server so "Cannot GET /" doesn't confuse users
app.get('/', (_req, res) => {
  res.redirect('http://localhost:3000');
});

seedDefaultAdmin();

app.listen(PORT, () => {
  console.log(`[dev-server] API running at http://localhost:${PORT}`);
});
