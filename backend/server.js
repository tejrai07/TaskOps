const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const habitRoutes = require('./routes/habitRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS — allow Vercel frontend + localhost for dev
const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (curl, mobile, server-to-server)
    if (!origin) return callback(null, true);
    
    const allowed = [
      process.env.FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:3000'
    ].filter(Boolean);

    // Check if origin matches any allowed origin (strip trailing slashes)
    const normalizedOrigin = origin.replace(/\/+$/, '');
    const isAllowed = allowed.some(url => normalizedOrigin === url.replace(/\/+$/, ''));
    
    if (isAllowed) {
      return callback(null, true);
    }
    
    // Also allow any *.vercel.app subdomain for preview deployments
    if (normalizedOrigin.endsWith('.vercel.app')) {
      return callback(null, true);
    }

    console.log('CORS blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lastminutelifesaver';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB successfully!'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/habits', habitRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
