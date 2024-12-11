import axios from 'axios';
import API_BASE_URL, { API_ROUTES } from '../app/config/api-endpoints';

describe('Database Seeding', () => {
  // Dummy data generators
  const generateUsers = (count: number) => {
    const positions = ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'];
    const heights = [
      { value: 185, unit: 'cm' }, { value: 6.2, unit: 'ft' },
      { value: 198, unit: 'cm' }, { value: 6.6, unit: 'ft' },
      { value: 205, unit: 'cm' }
    ];
    
    return Array(count).fill(null).map((_, index) => ({
      email: `player${index + 1}@bball.com`,
      password: 'Password123!',
      displayName: `Baller${index + 1}`,
      userName: `hooper${index + 1}`,
      profilePicture: `https://example.com/profile${index + 1}.jpg`,
      highlightVideo: `https://example.com/highlight${index + 1}.mp4`,
      socialMedia: {
        instagram: `hooper${index + 1}`,
        youtube: `baller${index + 1}`,
        twitter: `bball${index + 1}`
      },
      height: heights[index % heights.length],
      weight: {
        value: 75 + (index * 5),
        unit: 'kg'
      },
      wingspan: {
        value: 190 + (index * 5),
        unit: 'cm'
      },
      position: positions[index % positions.length],
      verticalJump: {
        value: 28 + (index * 2),
        unit: 'in'
      },
      aboutMe: `Professional basketball player with ${index + 1} years of experience`,
      isPremium: index < 5,
      isPrivate: index % 3 === 0,
      isEmailVerified: true,
      premiumStartDate: index < 5 ? new Date('2024-01-01') : null,
      premiumExpiryDate: index < 5 ? new Date('2024-12-31') : null,
      totalSpent: index < 5 ? 99.99 * (index + 1) : 0
    }));
  };

  const generateCourses = (count: number) => {
    const courseTitles = [
      'Advanced Dribbling Masterclass',
      'Shooting Form Perfection',
      'Post Move Domination',
      'Defense Elite Training',
      'Basketball IQ Development'
    ];

    return Array(count).fill(null).map((_, index) => ({
      title: courseTitles[index],
      description: `Master ${courseTitles[index].toLowerCase()} with pro techniques`,
      level: ['beginner', 'intermediate', 'expert'][index % 3],
      duration: ['1 week', '1 month', '2 months'][index % 3],
      frequency: ['daily', 'every 2 days', 'weekly'][index % 3],
      thumbnail: `https://example.com/course${index + 1}.jpg`,
      price: 29.99 + (index * 10),
      isPremium: index % 2 === 0
    }));
  };

  const generateDrills = (count: number) => {
    const drillTitles = [
      'Crossover Mastery',
      'Three-Point Shooting',
      'Box-Out Fundamentals',
      'Quick Release Training',
      'Defensive Slides'
    ];

    return Array(count).fill(null).map((_, index) => ({
      title: drillTitles[index],
      description: `Improve your ${drillTitles[index].toLowerCase()} skills`,
      instructions: `Step-by-step guide for ${drillTitles[index]}`,
      instructionVideo: `https://example.com/drill${index + 1}.mp4`,
      category: ['shooting', 'dribbling', 'defense', 'conditioning', 'footwork'][index % 5],
      difficulty: ['beginner', 'intermediate', 'advanced'][index % 3],
      totalAttempts: Math.floor(Math.random() * 1000),
      averageScore: Math.floor(Math.random() * 100)
    }));
  };

  const generateChallenges = (count: number) => {
    const challengeTitles = [
      '100 Three-Pointer Challenge',
      'Dribbling Time Trial',
      'Free Throw Marathon',
      'Defense Reaction Test',
      'Vertical Jump Contest'
    ];

    return Array(count).fill(null).map((_, index) => ({
      title: challengeTitles[index],
      description: `Complete the ${challengeTitles[index].toLowerCase()}`,
      instructions: `Rules and guidelines for ${challengeTitles[index]}`,
      demoVideo: `https://example.com/challenge${index + 1}.mp4`,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isActive: true
    }));
  };

  const generatePosts = (count: number) => {
    const postContents = [
      'Just hit my personal best in vertical jump! 🏀',
      'Game winning shot at the buzzer! 🔥',
      'New workout routine starting tomorrow 💪',
      'Looking for pickup game partners 🏀',
      'Check out my latest highlight reel!'
    ];

    return Array(count).fill(null).map((_, index) => ({
      content: postContents[index % postContents.length],
      media: {
        type: index % 2 === 0 ? 'image' : 'video',
        url: `https://example.com/post${index + 1}.${index % 2 === 0 ? 'jpg' : 'mp4'}`
      },
      isPrivate: false
    }));
  };

  const generateComments = (count: number, postId: string, userId: string) => {
    const commentContents = [
      'Great form! 🏀',
      'Keep grinding! 💪',
      'Need to try this drill',
      'Impressive progress',
      'Lets play together sometime'
    ];

    return Array(count).fill(null).map((_, index) => ({
      user: userId,
      post: postId,
      content: commentContents[index % commentContents.length],
    }));
  };

  const generateReports = (count: number, reporterId: string, reportedId: string) => {
    const reasons = [
      'Inappropriate content',
      'Spam',
      'Harassment',
      'False information',
      'Other'
    ];

    return Array(count).fill(null).map((_, index) => ({
      reporter: reporterId,
      reported: reportedId,
      contentType: ['post', 'comment', 'user'][index % 3],
      contentId: reportedId, // This would normally be the ID of the reported content
      reason: reasons[index % reasons.length],
      comment: `Detailed explanation for report ${index + 1}`,
      status: 'pending'
    }));
  };

  const generateAdmin = () => ({
    email: 'jindeval@gmail.com',
    password: 'ChangeMe123!',
    name: 'aun'
  });

  const generatePremiumConfig = () => ({
    premiumPrice: 99.99,
    currentDiscount: {
      percentage: 20,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      description: 'Early bird special offer'
    }
  });

  // Test suites
  describe('Seed Database', () => {
    let firstUserId: string;
    let firstPostId: string;

    it('should create admin', async () => {
      try {
        const admin = generateAdmin();
        await axios.post(`${API_BASE_URL}${API_ROUTES.admin.create}`, admin);
      } catch (error) {
        console.error('Error creating admin:', error);
      }
    });

    it('should create 10 users', async () => {
      const users = generateUsers(10);
      for (const user of users) {
        try {
          const response = await axios.post(`${API_BASE_URL}${API_ROUTES.user.create}`, user);
          if (!firstUserId) firstUserId = response.data.id;
        } catch (error) {
          console.error('Error creating user:', error);
        }
      }
    });

    it('should create 5 courses', async () => {
      const courses = generateCourses(5);
      for (const course of courses) {
        try {
          await axios.post(`${API_BASE_URL}${API_ROUTES.course.create}`, course);
        } catch (error) {
          console.error('Error creating course:', error);
        }
      }
    });

    it('should create 5 drills', async () => {
      const drills = generateDrills(5);
      for (const drill of drills) {
        try {
          await axios.post(`${API_BASE_URL}${API_ROUTES.drill.create}`, drill);
        } catch (error) {
          console.error('Error creating drill:', error);
        }
      }
    });

    it('should create 5 challenges', async () => {
      const challenges = generateChallenges(5);
      for (const challenge of challenges) {
        try {
          await axios.post(`${API_BASE_URL}${API_ROUTES.challenge.create}`, challenge);
        } catch (error) {
          console.error('Error creating challenge:', error);
        }
      }
    });

    it('should create 5 posts', async () => {
      const posts = generatePosts(5);
      for (const post of posts) {
        try {
          const response = await axios.post(`${API_BASE_URL}${API_ROUTES.post.create}`, {
            ...post,
            user: firstUserId
          });
          if (!firstPostId) firstPostId = response.data.id;
        } catch (error) {
          console.error('Error creating post:', error);
        }
      }
    });

    it('should create 5 comments', async () => {
      const comments = generateComments(5, firstPostId, firstUserId);
      for (const comment of comments) {
        try {
          await axios.post(`${API_BASE_URL}${API_ROUTES.comment.create}`, comment);
        } catch (error) {
          console.error('Error creating comment:', error);
        }
      }
    });

    it('should create 5 reports', async () => {
      const reports = generateReports(5, firstUserId, firstPostId);
      for (const report of reports) {
        try {
          await axios.post(`${API_BASE_URL}${API_ROUTES.report.create}`, report);
        } catch (error) {
          console.error('Error creating report:', error);
        }
      }
    });

    it('should set premium configuration', async () => {
      const premiumConfig = generatePremiumConfig();
      try {
        await axios.post(`${API_BASE_URL}${API_ROUTES.premium.setAmount}`, {
          amount: premiumConfig.premiumPrice
        });
        await axios.patch(`${API_BASE_URL}${API_ROUTES.premium.setDiscount}`, {
          percentage: premiumConfig.currentDiscount.percentage,
          validUntil: premiumConfig.currentDiscount.validUntil,
          description: premiumConfig.currentDiscount.description
        });
      } catch (error) {
        console.error('Error setting premium configuration:', error);
      }
    });
  });
});
