const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Order = require('./models/Order');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        const count = await Order.countDocuments();
        console.log(`Total Orders: ${count}`);
        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
