import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';

import authRoutes from './routes/auth.js';
import reviewRoutes from './routes/reviews.js';
import userRoutes from './routes/users.js';
import instructorRoutes from './routes/instructors.js';

const app = express();

app.use(morgan('dev'));
app.use(cors({ origin: 'http://localhost:5175', credentials: false }));
app.use(express.json());

// Protect against NoSQL injection.
// Use dryRun because Express 5 request query properties can be read-only.
// Reject suspicious requests rather than silently modifying them.
app.use((req, res, next) => {
  const check = (value) => {
    if (value === null || typeof value !== 'object') return false;

    return Object.keys(value).some(
      (key) =>
        key.startsWith('$') ||
        key.includes('.') ||
        check(value[key])
    );
  };

  if (check(req.body) || check(req.query) || check(req.params)) {
    return res.status(400).json({
      message: 'Invalid request: prohibited MongoDB operators'
    });
  }

  next();
});

// express-mongo-sanitize is also used to inspect unsafe input.
// dryRun avoids modifying read-only request properties.
app.use(mongoSanitize({ dryRun: true }));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/instructors', instructorRoutes);

// Not found
app.use((req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || 'Server Error'
  });
});

export default app;