const drillService = require('../services/drillService');

exports.createDrill = async (req, res) => {
  try {
    const drill = await drillService.createDrill(req.body);
    res.status(201).json(drill);
  } catch (error) {
    res.status(400).json({ message: error.message });
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