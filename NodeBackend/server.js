require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fileUpload = require('express-fileupload');


const connectDB = require('./config/database');
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

// Import the cron jobs
const challengeExpirationCron = require('./cron/challengeExpiration');
const postCleanupCron = require('./cron/postCleanup');

const app = express();
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(fileUpload());

// Connect to MongoDb
connectDB();

// Middleware
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
