const courseService = require('../services/courseService');

exports.createCourse = async (req, res) => {
  try {
    const course = await courseService.createCourse(req.body);
    res.status(201).json(course);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAllCourses = async (req, res) => {
  try {
    const courses = await courseService.getAllCourses();
    res.json(courses);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getTopPopularCourses = async (req, res) => {
  try {
    const courses = await courseService.getTopPopularCourses();
    res.json(courses);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
