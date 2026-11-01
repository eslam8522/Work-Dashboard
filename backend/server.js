import 'dotenv/config';
import http from 'http';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import studyRoutes from './routes/studyRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import { initializeSocket } from './socket.js';

const { MONGO_DB_URI, JWT_SECRET } = process.env;
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

if (!MONGO_DB_URI || !JWT_SECRET) {
  console.error('Missing MONGO_DB_URI or JWT_SECRET. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const app = express();
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/studies', studyRoutes);
app.use('/api/messages', messageRoutes);

app.use('/api', (req, res) => res.status(404).json({ error: 'Route not found' }));

// Express 5 forwards async errors here.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

const server = http.createServer(app);
initializeSocket(server, CLIENT_URL);

mongoose
  .connect(MONGO_DB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  });
