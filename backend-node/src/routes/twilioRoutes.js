const express = require('express');
const {
  incomingCall,
  testIncomingCall,
  rechargeIntent,
  rechargeChoice,
  rechargeCardNumber,
  rechargeExpiry,
  rechargeCvv
} = require('../controllers/twilioController');
const { handleIncomingIVR, handleIVRDecision } = require('../controllers/pricedScheduleController');

const router = express.Router();

router.post('/incoming-call', incomingCall);
router.get('/test', testIncomingCall);

router.post('/ivr-start', handleIncomingIVR);
router.post('/ivr-decision', handleIVRDecision);

router.post('/recharge-intent', rechargeIntent);
router.post('/recharge-choice', rechargeChoice);
router.post('/recharge-card-number', rechargeCardNumber);
router.post('/recharge-expiry', rechargeExpiry);
router.post('/recharge-cvv', rechargeCvv);

module.exports = router;