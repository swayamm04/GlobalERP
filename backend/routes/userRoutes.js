const express = require('express');
const router = express.Router();
const { authUser, registerUser, getUsers, deleteUser, updateUserProfile } = require('../controllers/userController');
const { protect, superAdmin } = require('../middleware/authMiddleware');

router.post('/login', authUser);
router.route('/')
    .get(protect, superAdmin, getUsers)
    .post(protect, superAdmin, registerUser);

router.route('/profile')
    .put(protect, updateUserProfile);

router.route('/:id')
    .delete(protect, superAdmin, deleteUser);

module.exports = router;
