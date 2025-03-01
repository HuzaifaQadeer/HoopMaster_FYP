const mongoose = require('mongoose');
const Drill = require('../models/drillModel');
require('dotenv').config();

const drills = [
  {
    title: "Basic Dribbling",
    description: "Master the fundamental basketball dribbling technique",
    instructions: "1. Keep your fingers spread\n2. Push the ball with your fingertips, not your palm\n3. Keep the ball at waist height\n4. Use your body to protect the ball\n5. Keep your eyes up",
    category: "Dribbling",
    imageUrl: "https://www.wikihow.com/images/thumb/4/4e/Dribble-a-Basketball-Step-3-Version-3.jpg/550px-nowatermark-Dribble-a-Basketball-Step-3-Version-3.jpg",
    difficulty: "beginner",
    totalAttempts: 0,
    averageScore: 0
  },
  {
    title: "Crossover Dribble",
    description: "Learn how to perform the crossover dribble to change direction quickly",
    instructions: "1. Start with basic dribbling\n2. Push the ball across your body low and quick\n3. Switch hands while dribbling\n4. Keep the ball low during the crossover\n5. Practice both directions",
    category: "Dribbling",
    imageUrl: "https://static.owayo-cdn.com/newhp/img/magazin/basketballdribblingEN/dribbling-crossover-basketball.jpg",
    difficulty: "intermediate",
    totalAttempts: 0,
    averageScore: 0
  },
  {
    title: "Behind the Back Dribble",
    description: "Master the behind the back dribble to protect the ball from defenders",
    instructions: "1. Start with regular dribbling\n2. Wrap your dribbling hand behind your back\n3. Push the ball around your back\n4. Catch with your other hand\n5. Keep the ball close to your body",
    category: "Dribbling",
    imageUrl: "https://i.ytimg.com/vi/9G-TF0_5m8c/maxresdefault.jpg",
    difficulty: "advanced",
    totalAttempts: 0,
    averageScore: 0
  },
  {
    title: "Between the Legs",
    description: "Learn to dribble between your legs to protect the ball and change direction",
    instructions: "1. Spread your legs shoulder-width apart\n2. Bounce the ball through your legs\n3. Catch with your other hand\n4. Keep your knees bent\n5. Start slow and build speed",
    category: "Dribbling",
    imageUrl: "https://static.owayo-cdn.com/newhp/img/magazin/basketballdribblingEN/dribbling-basketball-exercises-670px.jpg",
    difficulty: "intermediate",
    totalAttempts: 0,
    averageScore: 0
  },
  {
    title: "Tween Dribble",
    description: "Perfect the in-and-out dribble move to fake out defenders",
    instructions: "1. Start with regular dribbling\n2. Move the ball to the outside\n3. Quickly bring it back in\n4. Keep the same hand dribbling\n5. Add head and shoulder fakes",
    category: "Dribbling",
    imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSpBBtuuEX6LO8QLBouwJE8P0gD-sheO6os_A&s",
    difficulty: "intermediate",
    totalAttempts: 0,
    averageScore: 0
  }
];

const seedDrills = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Clear existing drills
    await Drill.deleteMany({});
    
    // Insert new drills
    await Drill.insertMany(drills);
    
    console.log('Drills seeded successfully');

    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error seeding drills:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDrills();

module.exports = seedDrills;
