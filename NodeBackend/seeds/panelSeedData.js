const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Import all models
const Admin = require('./models/adminModel');
const User = require('./models/userModel');
const Course = require('./models/courseModel');
const Drill = require('./models/drillModel');
const Challenge = require('./models/challengeModel');
const Post = require('./models/postModel');
const Premium = require('./models/premiumModel');
const Report = require('./models/reportModel');
const Comment = require('./models/commentModel');

mongoose.connect('mongodb://localhost:27017/hoopmaster')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

async function seedDatabase() {
  try {
    // Clear existing data
    await Course.deleteMany({});
    await Drill.deleteMany({});
    await Challenge.deleteMany({});
    await Post.deleteMany({});
    await Premium.deleteMany({});
    await Report.deleteMany({});
    await Comment.deleteMany({});

    // 1. First create admin (needed for reports)
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await Admin.create({
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User'
    });

    // 2. Create users (needed for posts, comments, reports)
    const mainUser = await User.create({
      email: 'john.smith@example.com',
      password: await bcrypt.hash('password123', 10),
      displayName: 'John Smith',
      userName: '@jsmith_baller',
      profilePicture: 'https://example.com/profile.jpg',
      height: { value: 188, unit: 'cm' },
      weight: { value: 84, unit: 'kg' },
      wingspan: { value: 196, unit: 'cm' },
      verticalJump: { value: 81, unit: 'cm' },
      isPremium: true,
      highlightVideo: 'https://example.com/highlight.mp4'
    });

    const moderatorUser = await User.create({
      email: 'mike.wilson@example.com',
      password: await bcrypt.hash('password123', 10),
      displayName: 'Mike Wilson',
      userName: '@mike_moderator',
      profilePicture: 'https://example.com/mike.jpg'
    });

    // 3. Create posts (needed for comments and reports)
    const post = await Post.create({
      user: mainUser._id,
      content: "I hate player who are alwsy take up space in the gynm doing sma edirll for hours on th ehoop like give some space for a game",
      media: {
        type: 'image',
        url: 'https://example.com/post-image.jpg'
      },
      status: 'Reported'
    });

    // 4. Create comments
    const comment = await Comment.create({
      user: mainUser._id,
      post: post._id,
      content: "This is a sample comment"
    });

    // 5. Create report (using existing users and post)
    const report = await Report.create({
      reporter: moderatorUser._id,
      reported: mainUser._id,
      contentType: 'post',
      contentId: post._id,
      reason: "This user is creating a hostile environment",
      comment: "This user is creating a hostile environment and targeting specific players at the gym. This kind of aggressive behavior could lead to conflicts on the court.",
      status: 'pending',
      adminAction: {
        admin: admin._id,
        action: 'reviewing',
        date: new Date(),
        notes: 'Under review'
      }
    });

    // 6. Create courses
    const courses = await Course.create([
      {
        title: "Shooting Fundamentals 101",
        description: "Master the basics of shooting",
        level: "beginner",
        duration: "1 month",
        frequency: "daily",
        price: 99,
        isPremium: true,
        enrolledUsers: [mainUser._id],
        participants: 1234
      },
      {
        title: "Advanced Dribbling Techniques",
        description: "Advanced ball handling skills",
        level: "expert",
        duration: "2 months",
        frequency: "weekly",
        price: 149,
        isPremium: true,
        enrolledUsers: [mainUser._id],
        participants: 982
      },
      {
        title: "Basketball IQ Masterclass",
        description: "Learn the mental game",
        level: "intermediate",
        duration: "1 month",
        frequency: "weekly",
        price: 129,
        isPremium: true,
        participants: 876
      },
      {
        title: "Pro-Level Defense Training",
        description: "Elite defensive techniques",
        level: "expert",
        duration: "2 months",
        frequency: "daily",
        price: 199,
        isPremium: true,
        participants: 654
      }
    ]);

    // 7. Create drills
    const drills = await Drill.create([
      {
        title: "Mikan Drill",
        description: "Classic basketball drill for layups",
        instructions: "Alternate layups on each side",
        difficulty: "beginner",
        totalAttempts: 3214,
        category: "Layups",
        attempts: [{
          user: mainUser._id,
          score: 85,
          date: new Date("2024-03-15")
        }]
      },
      {
        title: "Figure-8 Dribbling",
        description: "Ball handling drill",
        instructions: "Dribble in figure-8 pattern",
        difficulty: "intermediate",
        totalAttempts: 2876,
        category: "Dribbling",
        attempts: [{
          user: mainUser._id,
          score: 78,
          date: new Date("2024-03-18")
        }]
      },
      {
        title: "Spot Shooting Drill",
        description: "Improve shooting accuracy",
        instructions: "Shoot from marked spots",
        difficulty: "intermediate",
        totalAttempts: 2654,
        category: "Shooting",
        attempts: [{
          user: mainUser._id,
          score: 92,
          date: new Date("2024-03-20")
        }]
      },
      {
        title: "Box-Out Practice",
        description: "Master rebounding position",
        instructions: "Practice boxing out opponent",
        difficulty: "beginner",
        totalAttempts: 2143,
        category: "Defense"
      }
    ]);

    // 8. Create challenges
    const challenges = await Challenge.create([
      {
        title: "100 Free Throws Challenge",
        description: "Make 100 free throws",
        instructions: "Complete 100 free throws, record your makes",
        isActive: true,
        participants: [mainUser._id],
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        topScores: [{
          user: mainUser._id,
          score: 95,
          rank: 1
        }]
      },
      {
        title: "3-Point Shootout",
        description: "Make as many 3-pointers as possible",
        instructions: "1 minute shooting challenge",
        isActive: true,
        participants: [mainUser._id],
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        topScores: [{
          user: mainUser._id,
          score: 88,
          rank: 3
        }]
      }
    ]);

    // 9. Create premium config
    await Premium.create({
      premiumPrice: 9.99,
      currentDiscount: {
        percentage: 20,
        validUntil: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
      }
    });

    // 10. Update user with all relationships
    await User.findByIdAndUpdate(mainUser._id, {
      courses: courses.map(course => course._id),
      drills: drills.map(drill => drill._id),
      posts: [post._id],
      comments: [comment._id]
    });

    // 11. Update post with comment
    await Post.findByIdAndUpdate(post._id, {
      comments: [comment._id]
    });

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase(); 