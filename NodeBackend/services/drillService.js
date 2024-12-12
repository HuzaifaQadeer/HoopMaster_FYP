const Drill = require('../models/drillModel');

exports.createDrill = async (drillData) => {
  const requiredFields = ['title', 'instructions', 'difficulty'];
  const missingFields = requiredFields.filter(field => !drillData[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  const drill = new Drill(drillData);
  await drill.save();
  return drill;
};

exports.getAllDrills = async () => {
  return await Drill.find()
    .populate('attempts.user', 'displayName profilePicture')
    .sort('-createdAt');
};

exports.getTopPopularDrills = async () => {
  return await Drill.find()
    .sort('-totalAttempts')
    .limit(4)
};
