import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import './db.js';
import authRoutes from './routes/auth.js';
import bookRoutes from './routes/books.js';
import orderRoutes from './routes/orders.js';
import demoRoutes from './routes/demo.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/demo', demoRoutes);
app.get('/api/health', (req, res) => res.json({ ok: true }));

const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Bindery & Co. running on http://localhost:${PORT}`);
  console.log(
    `Seeded accounts -> admin: admin@bookstore.com / admin123  |  user: user@bookstore.com / user123`
  );
});
