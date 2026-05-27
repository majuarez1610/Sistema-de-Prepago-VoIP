const express = require('express');
const { incomingCall, testIncomingCall } = require('../controllers/twilioController');

const { handleIncomingIVR, handleIVRDecision } = require('../controllers/pricedScheduleController');

const router = express.Router();

router.post('/incoming-call', incomingCall);
router.get('/test', testIncomingCall);

router.post('/ivr-start', handleIncomingIVR);
router.post('/ivr-decision', handleIVRDecision);

module.exports = router;
