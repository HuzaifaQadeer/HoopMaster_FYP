require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const fileUpload = require('express-fileupload');

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
const subscriptionRoutes = require('./routes/subscriptionRoutes');

// Import the cron jobs
const challengeExpirationCron = require('./cron/challengeExpiration');
const postCleanupCron = require('./cron/postCleanup');
const subscriptionRenewalJob = require('./cron/subscriptionRenewalJob');

const app = express();

// Enhanced CORS configuration with debugging
app.use((req, res, next) => {
  console.log('[Debug Backend] CORS Pre-flight check:');
  console.log(`[Debug Backend] Request origin: ${req.headers.origin}`);
  console.log(`[Debug Backend] Request method: ${req.method}`);
  next();
});

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://nodeapp.loca.lt'], // Added nodeapp.loca.lt
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

console.log('[Debug Backend] CORS configuration enabled for http://localhost:3000');

// Connect to MongoDb
connectDB();

// File upload middleware
app.use(fileUpload({
  createParentPath: true,
  limits: { 
    fileSize: 100 * 1024 * 1024 // 100MB max file size
  },
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

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
app.use('/challenges', (req, res, next) => {
  // Add CORS headers specifically for video files
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Accept-Ranges', 'bytes');
  res.header('Cache-Control', 'no-cache');
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Log video request for debugging
  console.log(`[Debug Backend] Video request: ${req.path}`);
  
  // Continue to static middleware
  next();
}, express.static(path.join(__dirname, '../Server/challenges'), {
  // Set proper content type for videos
  setHeaders: (res, path) => {
    if (path.endsWith('.mp4')) {
      res.set('Content-Type', 'video/mp4');
    } else if (path.endsWith('.mov')) {
      res.set('Content-Type', 'video/quicktime');
    } else if (path.endsWith('.webm')) {
      res.set('Content-Type', 'video/webm');
    }
  }
}));

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
app.use('/subscriptions', subscriptionRoutes);

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
  
  // Start subscription renewal job
  console.log('Starting subscription renewal job...');
  subscriptionRenewalJob.scheduleSubscriptionRenewalJob();
  console.log('Subscription renewal job started');
});
