const express = require('express');
const { getDecisions } = require('../controllers/decisionController');

const router = express.Router();

router.get('/', getDecisions);

module.exports = router;
