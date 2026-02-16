const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const collectionsToClear = [
    'orders',
    'estimations',
    'rawmaterials',
    'products',
    'purchaseorders',
    'activitylogs',
    'suppliers',
    'categories',
    'customers'
];

const clearBusinessData = async () => {
    try {
        console.log('Attempting to connect to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected successfully');

        for (const collectionName of collectionsToClear) {
            try {
                console.log(`Clearing collection: ${collectionName}...`);
                const result = await mongoose.connection.db.collection(collectionName).deleteMany({});
                console.log(`Cleared ${result.deletedCount} documents from ${collectionName}`);
            } catch (err) {
                console.error(`Error clearing ${collectionName}:`, err.message);
            }
        }

        console.log('Business Data Cleanup Completed Successfully');
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('Connection Error:', err);
        process.exit(1);
    }
};

clearBusinessData();
