// Import routes
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes');
const videoRoutes = require('./routes/videoRoutes');
const trainingRoutes = require('./routes/trainingRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const challengeRoutes = require('./routes/challengeRoutes');
const challengeAttemptRoutes = require('./routes/challengeAttemptRoutes');
const achievementRoutes = require('./routes/achievementRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const reportRoutes = require('./routes/reportRoutes');

// Import cron jobs
const challengeExpirationCron = require('./cron/challengeExpiration');

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/attempts', challengeAttemptRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/reports', reportRoutes);

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Start cron jobs
challengeExpirationCron.startCronJob(); 