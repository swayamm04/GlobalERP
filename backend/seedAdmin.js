const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const existingAdmin = await User.findOne({ email: 'admin@nirvanaerp.com' });

        if (existingAdmin) {
            existingAdmin.name = 'Rakshith';
            existingAdmin.role = 'super_admin';
            existingAdmin.password = 'erpofnirvana';
            await existingAdmin.save();
            console.log('Admin user updated (Name: Rakshith, Role: super_admin)');
        } else {
            const adminUser = new User({
                name: 'Rakshith',
                email: 'admin@nirvanaerp.com',
                password: 'erpofnirvana',
                role: 'super_admin'
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
