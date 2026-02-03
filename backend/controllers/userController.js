const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = async (req, res) => {
    const { email, password } = req.body;
    console.log(`Login attempt: ${email}`);

    const user = await User.findOne({ email });

    if (user) {
        console.log(`User found: ${user.email}`);
        if (await user.matchPassword(password)) {
            console.log('Password matched');
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            console.log('Password mismatch');
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } else {
        console.log('User not found');
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

module.exports = { authUser };
