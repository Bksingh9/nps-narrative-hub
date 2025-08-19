import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crawlerRoutes from './routes/crawlerRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Crawler backend is running' });
});

// Routes
app.use('/api/crawler', crawlerRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Crawler backend server running on http://localhost:${PORT}`);
  console.log(`📊 Ready to crawl NPS data from various sources`);
}); 