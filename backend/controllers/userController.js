const logActivity = require('../utils/activityLogger');

const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        // Log Activity
        await logActivity(
            user._id,
            'USER_LOGIN',
            `User logged in: ${user.name}`,
            req
        );

        res.json({
            _id: user._id,
            name: user.name,
            companyName: user.companyName || user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
};

// @desc    Register a new user (by super admin)
// @route   POST /api/users
// @access  Private/SuperAdmin
const registerUser = async (req, res) => {
    const { name, email, password, industry, subscriptionDuration, amountPaid, subscriptionStartDate } = req.body;

    const emailExists = await User.findOne({ email });
    if (emailExists) {
        return res.status(400).json({ message: 'Email is already registered' });
    }

    const nameExists = await User.findOne({ name });
    if (nameExists) {
        return res.status(400).json({ message: 'Name is already taken' });
    }

    const start = subscriptionStartDate ? new Date(subscriptionStartDate) : new Date();
    let end = new Date(start);
    if (subscriptionDuration === '1 month') {
        end.setMonth(end.getMonth() + 1);
    } else if (subscriptionDuration === '3 months') {
        end.setMonth(end.getMonth() + 3);
    } else if (subscriptionDuration === '6 months') {
        end.setMonth(end.getMonth() + 6);
    } else if (subscriptionDuration === '1 year') {
        end.setFullYear(end.getFullYear() + 1);
    } else {
        end.setMonth(end.getMonth() + 1);
    }

    const user = await User.create({
        name,
        companyName: name,
        email,
        password,
        role: 'admin',
        industry: industry || '',
        subscriptionDuration: subscriptionDuration || '1 month',
        amountPaid: Number(amountPaid) || 0,
        subscriptionStartDate: start,
        subscriptionEndDate: end
    });

    if (user) {
        // Log activity
        await logActivity(
            req.user._id,
            'CREATED_ADMIN',
            `Created admin user: ${user.name} (${user.email})`,
            req
        );

        res.status(201).json({
            _id: user._id,
            name: user.name,
            companyName: user.companyName || user.name,
            email: user.email,
            role: user.role,
            industry: user.industry,
            subscriptionDuration: user.subscriptionDuration,
            amountPaid: user.amountPaid,
            subscriptionStartDate: user.subscriptionStartDate,
            subscriptionEndDate: user.subscriptionEndDate
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/SuperAdmin
const getUsers = async (req, res) => {
    const users = await User.find({}).select('-password');
    res.json(users);
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/SuperAdmin
const deleteUser = async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        if (user.role === 'super_admin') {
            res.status(400);
            throw new Error('Super Admin cannot be deleted');
        }
        await User.findByIdAndDelete(req.params.id);

        // Log activity
        await logActivity(
            req.user._id,
            'DELETED_USER',
            `Deleted user: ${user.name} (${user.email})`,
            req
        );

        res.json({ message: 'User removed' });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        if (req.body.name && req.body.name !== user.name) {
            const nameExists = await User.findOne({ name: req.body.name });
            if (nameExists) {
                return res.status(400).json({ message: 'Name is already taken' });
            }
            user.name = req.body.name;
        }

        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        // Log Activity
        await logActivity(
            user._id,
            'UPDATED_PROFILE',
            `User updated their profile: ${user.name}`,
            req
        );

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            companyName: updatedUser.companyName || updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            token: generateToken(updatedUser._id),
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
};

// @desc    Update a user/company (by super admin)
// @route   PUT /api/users/:id
// @access  Private/SuperAdmin
const updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const { name, email, password, industry, subscriptionDuration, amountPaid, subscriptionStartDate } = req.body;
        
        if (name && name !== user.name) {
            const nameExists = await User.findOne({ name });
            if (nameExists) {
                return res.status(400).json({ message: 'Name is already taken' });
            }
            user.name = name;
            user.companyName = name;
        }
        
        if (email && email !== user.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                return res.status(400).json({ message: 'Email is already registered' });
            }
            user.email = email;
        }
        
        if (password) {
            user.password = password;
        }
        
        if (industry !== undefined) user.industry = industry;
        if (subscriptionDuration !== undefined) user.subscriptionDuration = subscriptionDuration;
        if (amountPaid !== undefined) user.amountPaid = Number(amountPaid);
        
        if (subscriptionStartDate !== undefined) {
            user.subscriptionStartDate = new Date(subscriptionStartDate);
            const start = user.subscriptionStartDate;
            let end = new Date(start);
            if (subscriptionDuration === '1 month') end.setMonth(end.getMonth() + 1);
            else if (subscriptionDuration === '3 months') end.setMonth(end.getMonth() + 3);
            else if (subscriptionDuration === '6 months') end.setMonth(end.getMonth() + 6);
            else if (subscriptionDuration === '1 year') end.setFullYear(end.getFullYear() + 1);
            user.subscriptionEndDate = end;
        }
        
        const updatedUser = await user.save();
        
        // Log activity
        if (req.user) {
            await logActivity(
                req.user._id,
                'UPDATED_ADMIN',
                `Updated company user: ${user.name} (${user.email})`,
                req
            );
        }
        
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            companyName: updatedUser.companyName || updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            industry: updatedUser.industry,
            subscriptionDuration: updatedUser.subscriptionDuration,
            amountPaid: updatedUser.amountPaid,
            subscriptionStartDate: updatedUser.subscriptionStartDate,
            subscriptionEndDate: updatedUser.subscriptionEndDate
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = { authUser, registerUser, getUsers, deleteUser, updateUserProfile, updateUser };
