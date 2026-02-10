const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Order = require('./models/Order');

dotenv.config();

const clearOrders = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const result = await Order.deleteMany({});
        console.log(`Successfully deleted ${result.deletedCount} orders.`);

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('Error clearing orders:', err);
        process.exit(1);
    }
};

clearOrders();
