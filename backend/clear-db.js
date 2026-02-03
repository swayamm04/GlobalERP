const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const clearDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        console.log('Dropping database...');
        await mongoose.connection.db.dropDatabase();
        console.log('Database Cleared Successfully');

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('Error clearing database:', err);
        process.exit(1);
    }
};

clearDB();
