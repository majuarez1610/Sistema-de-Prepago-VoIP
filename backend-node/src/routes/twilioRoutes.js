const express = require('express');
const { incomingCall, testIncomingCall } = require('../controllers/twilioController');

const router = express.Router();

router.post('/incoming-call', incomingCall);
router.get('/test', testIncomingCall);

module.exports = router;
