const express = require('express');
const { getCalls, getCallById } = require('../controllers/callController');

const router = express.Router();

router.get('/', getCalls);
router.get('/:id', getCallById);

module.exports = router;
