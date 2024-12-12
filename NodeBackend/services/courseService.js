const Course = require('../models/courseModel');

exports.createCourse = async (courseData) => {
  const course = new Course(courseData);
  await course.save();
  return course;
};

exports.getAllCourses = async () => {
  return await Course.find()
    .populate('enrolledUsers', 'displayName profilePicture')
    .sort('-createdAt');
};

exports.getTopPopularCourses = async () => {
  return await Course.find()
    .sort('-enrolledUsers')
    .limit(4)
};
