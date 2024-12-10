const Drill = require('../models/drillModel');

exports.createDrill = async (drillData) => {
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
    .populate('attempts.user', 'displayName profilePicture');
};
