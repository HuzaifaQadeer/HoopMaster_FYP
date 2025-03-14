const Course = require('../models/courseModel');
const CourseDrill = require('../models/coursedrillModel');
const User = require('../models/userModel');
const mongoose = require('mongoose');
const Progress = require('../models/progressModel');

class CourseService {
  async createCourse(courseData) {
    return await Course.create(courseData);
  }

  async getAllCourses() {
    return await Course.find().sort({ createdAt: -1 });
  }

  async getTopPopularCourses() {
    // This method can be expanded later to determine popularity
    return await Course.find().limit(3);
  }

  async getCourseById(courseId) {
    const course = await Course.findById(courseId).populate('coursedrills');
    if (!course) {
      throw new Error('Course not found');
    }
    return course;
  }

  async getCoursesByType(courseType) {
    return await Course.find({ title: { $regex: courseType, $options: 'i' } });
  }

  async getUserCourses(userId) {
    const user = await User.findById(userId).populate('courses');
    if (!user) {
      throw new Error('User not found');
    }
    return user.courses;
  }

  async registerUserForCourse(userId, courseId) {
    // First check if the course exists
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    // Check if course is premium and if user has premium access
    if (course.isPremium) {
      const user = await User.findById(userId);
      if (!user.isPremium) {
        throw new Error('Premium subscription required for this course');
      }
    }

    // Check if user already registered for this course
    const user = await User.findById(userId);
    if (user.courses.includes(courseId)) {
      throw new Error('User already registered for this course');
    }

    // Register user for the course
    return await User.findByIdAndUpdate(
      userId,
      { $addToSet: { courses: courseId } },
      { new: true }
    ).populate('courses');
  }

  async abandonCourse(userId, courseId) {
    // Remove course from user's courses
    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { courses: courseId } },
      { new: true }
    ).populate('courses');

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async getCourseDrills(courseId) {
    const drills = await CourseDrill.find({ course: courseId }).sort({ session: 1, order: 1 });
    if (!drills || drills.length === 0) {
      throw new Error('No drills found for this course');
    }
    return drills;
  }

  async getCourseSessionDrills(courseId, sessionNumber) {
    const drills = await CourseDrill.find({ 
      course: courseId,
      session: sessionNumber
    }).sort({ order: 1 });
    
    if (!drills || drills.length === 0) {
      throw new Error('No drills found for this session');
    }
    
    return drills;
  }

  async getMaxSessionNumber(courseId) {
    try {
      // Query all drills for this course and find the maximum session number
      const drills = await CourseDrill.find({ course: courseId }).select('session');
      
      if (drills && drills.length > 0) {
        // Find the highest session number
        const maxSession = Math.max(...drills.map(drill => drill.session));
        if (maxSession > 0) {
          return maxSession;
        }
      }
      
      // If no drills found or max session is 0, determine based on course frequency
      const course = await Course.findById(courseId);
      if (!course) {
        return 0;
      }
      
      // Determine max session based on frequency
      if (course.frequency === 'daily') {
        return 14; // 2 weeks
      } else if (course.frequency === 'every 2 days') {
        return 15; // 1 month
      } else if (course.frequency === 'weekly') {
        return 8; // 2 months
      }
      
      return 0;
    } catch (error) {
      console.error('Error determining max session number:', error);
      return 0;
    }
  }

  async getCourseProgress(userId, courseId) {
    try {
      console.log(`Getting progress for user ${userId} in course ${courseId}`);
      
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if user is registered for this course
      if (!user.courses.includes(courseId)) {
        throw new Error('User not registered for this course');
      }

      // Get max session number for the course
      const maxSession = await this.getMaxSessionNumber(courseId);
      console.log(`Max session number for course ${courseId}: ${maxSession}`);
      
      if (maxSession === 0) {
        console.log('No sessions found for this course, returning 0% progress');
        return { progress: 0, completedSessions: [] };
      }

      // Check user progress data in the database
      const progress = await Progress.findOne({ userId, courseId });
      
      if (!progress || !progress.completedSessions || progress.completedSessions.length === 0) {
        // No progress data found, user just started the course
        console.log('No progress data found for this user-course combination');
        return { progress: 0, completedSessions: [] };
      }
      
      // Calculate completion percentage based on completed sessions
      const completedCount = progress.completedSessions.length;
      console.log(`Completed sessions: ${completedCount}/${maxSession}`);
      
      const progressPercentage = Math.floor((completedCount / maxSession) * 100);
      console.log(`Calculated progress: ${progressPercentage}%`);
      
      return { 
        progress: Math.min(progressPercentage, 100),
        completedSessions: progress.completedSessions
      };
    } catch (error) {
      console.error('Error getting course progress:', error);
      return { progress: 0, completedSessions: [] };
    }
  }

  async updateCourseProgress(userId, courseId, sessionNumber, completed) {
    try {
      console.log(`Updating progress for user ${userId}, course ${courseId}, session ${sessionNumber}, completed: ${completed}`);
      
      // Validate inputs
      if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(courseId)) {
        throw new Error('Invalid user or course ID');
      }
      
      if (sessionNumber <= 0) {
        throw new Error('Invalid session number');
      }
      
      // Check if user exists and is registered for this course
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      if (!user.courses.includes(courseId)) {
        throw new Error('User not registered for this course');
      }
      
      // Find or create a progress entry
      let progress = await Progress.findOne({ userId, courseId });
      
      if (!progress) {
        console.log('Creating new progress record for user-course');
        progress = new Progress({
          userId,
          courseId,
          completedSessions: [],
          lastAccessed: new Date()
        });
      }
      
      // Update the completed sessions array
      if (completed) {
        // Check if this session is already marked as completed
        const sessionExists = progress.completedSessions.some(
          session => session.sessionNumber === sessionNumber
        );
        
        if (!sessionExists) {
          console.log(`Adding session ${sessionNumber} to completed sessions`);
          progress.completedSessions.push({
            sessionNumber,
            completedAt: new Date()
          });
        } else {
          console.log(`Session ${sessionNumber} already marked as completed`);
        }
      } else {
        // Remove the session from completed if it exists
        console.log(`Removing session ${sessionNumber} from completed sessions`);
        progress.completedSessions = progress.completedSessions.filter(
          session => session.sessionNumber !== sessionNumber
        );
      }
      
      // Update last accessed timestamp
      progress.lastAccessed = new Date();
      
      // Save the progress
      await progress.save();
      console.log(`Progress saved, now has ${progress.completedSessions.length} completed sessions`);
      
      // Calculate and return updated progress percentage
      const maxSession = await this.getMaxSessionNumber(courseId);
      console.log(`Max session for course: ${maxSession}`);
      
      const completedCount = progress.completedSessions.length;
      const progressPercentage = maxSession > 0 ? Math.floor((completedCount / maxSession) * 100) : 0;
      
      console.log(`Updated progress percentage: ${progressPercentage}%`);
      
      return { 
        success: true, 
        progress: Math.min(progressPercentage, 100)
      };
    } catch (error) {
      console.error('Error updating course progress:', error);
      throw error;
    }
  }

  async getCoursesByParameters(type, level, frequency) {
    return await Course.findOne({
      title: { $regex: type, $options: 'i' },
      level: level,
      frequency: frequency
    });
  }
}

module.exports = new CourseService();
