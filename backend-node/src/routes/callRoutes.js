const express = require('express');
const {
  getCalls,
  getCallById,
  getScheduleAnalysis,
  syncTwilioCalls
} = require('../controllers/callController');

const router = express.Router();

router.get('/', getCalls);
router.get('/schedule-analysis', getScheduleAnalysis);
router.post('/sync-twilio', syncTwilioCalls);
router.get('/:id', getCallById);

module.exports = router;