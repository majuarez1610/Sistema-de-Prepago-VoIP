const express = require('express');
const {
  getUsers,
  createUser,
  getUserById,
  rechargeUser
} = require('../controllers/userController');

const router = express.Router();

router.get('/', getUsers);
router.post('/', createUser);
router.get('/:id', getUserById);
router.put('/:id/recharge', rechargeUser);

module.exports = router;
