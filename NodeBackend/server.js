require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const connectDB = require('./config/database');
const { protect } = require('./middleware/authMiddleware');
const userRoutes = require('./routes/userRoutes');
const challengeRoutes = require('./routes/challengeRoutes');
const challengeAttemptRoutes = require('./routes/challengeAttemptRoutes');
const achievementRoutes = require('./routes/achievementRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const reportRoutes = require('./routes/reportRoutes');
const userProfileRoutes = require('./routes/userProfileRoutes');
const premiumRoutes = require('./routes/premiumRoutes');
const adminRoutes = require('./routes/adminRoutes');
const revenueRoutes = require('./routes/revenueRoutes');
const drillRoutes = require('./routes/drillRoutes');
const courseRoutes = require('./routes/courseRoutes');

// Import the cron jobs
const challengeExpirationCron = require('./cron/challengeExpiration');
const postCleanupCron = require('./cron/postCleanup');

const app = express();

// Enhanced CORS configuration with debugging
app.use((req, res, next) => {
  console.log('[Debug Backend] CORS Pre-flight check:');
  console.log(`[Debug Backend] Request origin: ${req.headers.origin}`);
  console.log(`[Debug Backend] Request method: ${req.method}`);
  next();
});

app.use(cors({
  origin: '*', // Allow all origins for debugging - change this in production
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

console.log('[Debug Backend] CORS configuration enabled with origin: *');

// Connect to MongoDb
connectDB();

// Middleware
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Enhanced logging middleware
app.use((req, res, next) => {
  console.log(`[Debug Backend] [${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log('[Debug Backend] Request headers:', JSON.stringify(req.headers));
  
  // Log response for debugging
  const originalSend = res.send;
  res.send = function(data) {
    console.log(`[Debug Backend] Response status: ${res.statusCode}`);
    return originalSend.call(this, data);
  };
  
  next();
});

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log('[Debug Backend] Serving static files from:', path.join(__dirname, 'uploads'), 'at path /uploads');

// Serve public uploads (including challenge videos)
app.use('/public/uploads', express.static(path.join(__dirname, 'public/uploads')));
console.log('[Debug Backend] Serving static files from:', path.join(__dirname, 'public/uploads'), 'at path /public/uploads');

// Serve challenge videos from Server/challenges without authentication
app.use('/challenges', express.static(path.join(__dirname, '../Server/challenges')));
console.log('[Debug Backend] Serving static files from:', path.join(__dirname, '../Server/challenges'), 'at path /challenges');

// Serve post media from Server/posts
app.use('/posts', express.static(path.join(__dirname, '../Server/posts')));
console.log('[Debug Backend] Serving static files from:', path.join(__dirname, '../Server/posts'), 'at path /posts');

// Add a test route to check if static file serving is working
app.get('/test-static', (req, res) => {
  res.send({
    message: 'Static file serving test',
    paths: {
      uploads: path.join(__dirname, 'uploads'),
      publicUploads: path.join(__dirname, 'public/uploads'),
      challenges: path.join(__dirname, '../Server/challenges'),
      posts: path.join(__dirname, '../Server/posts')
    },
    exists: {
      uploads: fs.existsSync(path.join(__dirname, 'uploads')),
      publicUploads: fs.existsSync(path.join(__dirname, 'public/uploads')),
      challenges: fs.existsSync(path.join(__dirname, '../Server/challenges')),
      posts: fs.existsSync(path.join(__dirname, '../Server/posts'))
    }
  });
});

// Routes
app.use('/users', userRoutes);
app.use('/challenges', challengeRoutes);
app.use('/challenge-attempts', challengeAttemptRoutes);
app.use('/achievements', achievementRoutes);
app.use('/posts', postRoutes);
app.use('/comments', commentRoutes);
app.use('/reports', reportRoutes);
app.use('/user-profiles', userProfileRoutes);
app.use('/premium', premiumRoutes);
app.use('/admin', adminRoutes);
app.use('/revenue', revenueRoutes);
app.use('/drills', drillRoutes);
app.use('/courses', courseRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  
  // Handle SyntaxError (like JSON parsing errors)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).send({ message: 'Invalid JSON in request body' });
  }
  
  // Handle other errors
  res.status(500).send({ 
    message: 'An unexpected error occurred',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message
  });
});

const PORT = process.env.PORT;

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Start the cron jobs
  console.log('Starting cron jobs...');
  
  // Start challenge expiration cron job
  console.log('Starting challenge expiration cron job...');
  challengeExpirationCron.startCronJob();
  console.log('Challenge expiration cron job started');
  
  // Start post cleanup cron job
  console.log('Starting post cleanup cron job...');
  postCleanupCron.startCronJob();
  console.log('Post cleanup cron job started');
});
