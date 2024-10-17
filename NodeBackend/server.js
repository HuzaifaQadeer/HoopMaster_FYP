require('dotenv').config();
const express = require('express');
const cors = require('cors');

const fileUpload = require('express-fileupload');


const connectDB = require('./config/database');
const userRoutes = require('./routes/userRoutes');
const drillRoutes = require('./routes/drillRoutes');

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

const PORT = process.env.PORT;

app.listen(PORT,() => console.log(`Server running on port ${PORT}`));
