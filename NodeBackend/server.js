require('dotenv').config();
const express = require('express');
const cors = require('cors');

const fileUpload = require('express-fileupload');


const connectDB = require('./config/database');
const userRoutes = require('./routes/userRoutes');
const drillRoutes = require('./routes/drillRoutes');
const courseRoutes = require('./routes/courseRoutes');
const challengeRoutes = require('./routes/challengeRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const reportRoutes = require('./routes/reportRoutes');
const premiumRoutes = require('./routes/premiumRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
app.use(cors());
app.use(fileUpload());

// Connect to MongoDb
connectDB();

// Middleware
app.use(express.json());

// Routes
app.use('/users', userRoutes);
app.use('/drills', drillRoutes);
app.use('/courses', courseRoutes);
app.use('/challenges', challengeRoutes);
app.use('/posts', postRoutes);
app.use('/comments', commentRoutes);
app.use('/reports', reportRoutes);
app.use('/premium', premiumRoutes);
app.use('/admin', adminRoutes);

const PORT = process.env.PORT;

app.listen(PORT,() => console.log(`Server running on port ${PORT}`));
