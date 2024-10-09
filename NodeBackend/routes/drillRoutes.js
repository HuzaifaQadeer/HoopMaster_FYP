const express = require('express');
const router = express.Router();
const drillController = require('../controllers/drillController');

// Define drill routes here
router.get('/', drillController.getAllDrills);
router.post('/', drillController.createDrill);

module.exports = router;