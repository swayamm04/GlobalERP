const Project = require('../models/Project');
const logActivity = require('../utils/activityLogger');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
    try {
        const projects = await Project.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
    try {
        const { projectName, customerName, location, numLabours, grandAmount, paidAmount } = req.body;

        if (!projectName || !customerName || !location || !numLabours || grandAmount === undefined) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const initialPaid = Number(paidAmount) || 0;
        const balanceDue = Number(grandAmount) - initialPaid;

        const project = await Project.create({
            user: req.user.id,
            projectName,
            customerName,
            location,
            numLabours,
            grandAmount,
            paidAmount: initialPaid,
            balanceDue,
            paymentHistory: initialPaid > 0 ? [{
                amount: initialPaid,
                method: req.body.paymentMethod || 'Cash',
                date: new Date()
            }] : []
        });

        // Log Activity
        if (req.user) {
            await logActivity(
                req.user._id,
                'CREATED_PROJECT',
                `Created project: ${projectName} for ${customerName}`,
                req
            );
        }

        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update project status
// @route   PATCH /api/projects/:id/status
// @access  Private
const updateProjectStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        project.status = status;
        await project.save();
        // Log Activity
        if (req.user) {
            await logActivity(
                req.user._id,
                'UPDATED_PROJECT_STATUS',
                `Updated project: ${project.projectName} status to ${status}`,
                req
            );
        }

        res.status(200).json(project);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add project payment
// @route   PATCH /api/projects/:id/payment
// @access  Private
const addProjectPayment = async (req, res) => {
    try {
        const { amount, method } = req.body;
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        if (amount > project.balanceDue) {
            return res.status(400).json({ message: 'Payment amount exceeds balance due' });
        }

        project.paidAmount += Number(amount);
        project.balanceDue -= Number(amount);
        project.paymentHistory.push({
            amount,
            method,
            date: new Date()
        });

        await project.save();

        // Log Activity
        if (req.user) {
            await logActivity(
                req.user._id,
                'ADDED_PROJECT_PAYMENT',
                `Added payment of ${amount} to project: ${project.projectName}`,
                req
            );
        }

        res.status(200).json(project);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getProjects,
    createProject,
    updateProjectStatus,
    addProjectPayment
};
