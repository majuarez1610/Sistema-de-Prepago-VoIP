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

const router = express.Router();

router.post('/incoming-call', incomingCall);
router.get('/test', testIncomingCall);

router.post('/recharge-intent', rechargeIntent);
router.post('/recharge-choice', rechargeChoice);
router.post('/recharge-card-number', rechargeCardNumber);
router.post('/recharge-expiry', rechargeExpiry);
router.post('/recharge-cvv', rechargeCvv);

module.exports = router;