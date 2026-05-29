const express = require('express');
const {
  getCalls,
  getCallById,
  syncTwilioCalls
} = require('../controllers/callController');

const router = express.Router();

router.get('/', getCalls);
router.post('/sync-twilio', syncTwilioCalls);
router.get('/:id', getCallById);

module.exports = router;