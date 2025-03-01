const mongoose = require('mongoose');
const CourseDrill = require('../models/coursedrillModel');
require('dotenv').config();

const updateCourseDrills = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Update all documents to include videoUrl field if it doesn't exist
    const result = await CourseDrill.updateMany(
      { videoUrl: { $exists: false } }, // Find documents where videoUrl doesn't exist
      { $set: { videoUrl: '' } } // Set default empty string value
    );

    console.log(`Updated ${result.modifiedCount} documents with videoUrl field`);

    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error updating course drills:', error);
    process.exit(1);
  }
};

// Run the update function
updateCourseDrills();
