const drillService = require('../services/drillService');

exports.createDrill = async (req, res) => {
  try {
    const drill = await drillService.createDrill(req.body);
    res.status(201).json(drill);
  } catch (error) {
    // Check if it's a validation error from our service
    if (error.message.includes('Missing required fields')) {
      return res.status(400).json({ message: error.message });
    }
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation Error', 
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    // Handle other errors
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getAllDrills = async (req, res) => {
  try {
    const drills = await drillService.getAllDrills();
    res.json(drills);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getTopPopularDrills = async (req, res) => {
  try {
    const drills = await drillService.getTopPopularDrills();
    res.json(drills);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};