const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const checkAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ email: 'admin@metalindustries.com' });
        if (user) {
            console.log(`User: ${user.name}, Email: ${user.email}, Role: ${user.role}`);
        } else {
            console.log('User not found');
        }
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkAdmin();
