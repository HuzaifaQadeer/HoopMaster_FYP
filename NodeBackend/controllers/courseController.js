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

exports.getCourseById = async (req, res) => {
  try {
    const course = await courseService.getCourseById(req.params.id);
    res.json(course);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.getCoursesByType = async (req, res) => {
  try {
    const { type } = req.params;
    const courses = await courseService.getCoursesByType(type);
    res.json(courses);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getUserCourses = async (req, res) => {
  try {
    const courses = await courseService.getUserCourses(req.user.id);
    res.json(courses);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.registerUserForCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const result = await courseService.registerUserForCourse(req.user.id, courseId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.abandonCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const result = await courseService.abandonCourse(req.user.id, courseId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getCourseDrills = async (req, res) => {
  try {
    const { courseId } = req.params;
    const drills = await courseService.getCourseDrills(courseId);
    res.json(drills);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.getCourseSessionDrills = async (req, res) => {
  try {
    const { courseId, sessionNumber } = req.params;
    const drills = await courseService.getCourseSessionDrills(courseId, parseInt(sessionNumber));
    res.json(drills);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const progressData = await courseService.getCourseProgress(req.user.id, courseId);
    res.json(progressData);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateCourseProgress = async (req, res) => {
  try {
    const { courseId, sessionNumber } = req.params;
    const { completed } = req.body;
    const result = await courseService.updateCourseProgress(
      req.user.id, 
      courseId, 
      parseInt(sessionNumber), 
      completed
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getCoursesByParameters = async (req, res) => {
  try {
    const { type, level, frequency } = req.query;
    const course = await courseService.getCoursesByParameters(type, level, frequency);
    res.json(course);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
