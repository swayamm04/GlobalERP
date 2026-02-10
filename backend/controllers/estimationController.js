const Estimation = require('../models/Estimation');

// @desc    Get all estimations
// @route   GET /api/estimations
// @access  Private
const getEstimations = async (req, res) => {
    try {
        const estimations = await Estimation.find().sort({ createdAt: -1 });
        res.status(200).json(estimations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create new estimation
// @route   POST /api/estimations
// @access  Private
const createEstimation = async (req, res) => {
    try {
        const estimationData = {
            ...req.body,
            user: req.user ? req.user.id : null
        };

        const estimation = new Estimation(estimationData);
        const createdEstimation = await estimation.save();

        res.status(201).json(createdEstimation);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getEstimations,
    createEstimation
};
