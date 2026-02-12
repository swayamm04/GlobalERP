const express = require('express');
const router = express.Router();
const {
    getProjects,
    createProject,
    updateProjectStatus,
    addProjectPayment
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getProjects)
    .post(protect, createProject);

router.route('/:id/status').patch(protect, updateProjectStatus);
router.route('/:id/payment').patch(protect, addProjectPayment);

module.exports = router;
