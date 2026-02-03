const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const existingAdmin = await User.findOne({ email: 'admin@metalindustries.com' });

        if (existingAdmin) {
            console.log('Admin user already exists');
        } else {
            const adminUser = new User({
                name: 'Admin User',
                email: 'admin@metalindustries.com',
                password: 'vasantha',
                role: 'admin'
            });

            await adminUser.save();
            console.log('Admin user seeded successfully');
        }

        await mongoose.disconnect();
        process.exit(0);

    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
