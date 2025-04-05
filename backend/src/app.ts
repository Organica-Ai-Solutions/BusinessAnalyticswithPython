import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDb } from './db';
import salesRoutes from './routes/sales';
import analyticsRoutes from './routes/analytics';

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.use('/api/sales', salesRoutes);
app.use('/api/analytics', analyticsRoutes);

const start = async () => {
  try {
    await initializeDb();
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start(); 