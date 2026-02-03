const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const Order = require('./models/Order');
const User = require('./models/User');

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Clear existing data
        await Product.deleteMany({});
        await Order.deleteMany({});

        // Get or Create Admin User
        let user = await User.findOne({ email: 'admin@metalindustries.com' });
        if (!user) {
            user = await User.create({
                name: 'Admin User',
                email: 'admin@metalindustries.com',
                password: 'vasantha', // In real app, hash this! but for seed it might be handled by pre-save hook if exists
                role: 'admin'
            });
        }

        // Create Products
        const products = await Product.create([
            {
                user: user._id,
                name: 'Steel Sheet 5mm',
                category: 'Sheets',
                stock: 150,
                price: 5000,
                status: 'In Stock'
            },
            {
                user: user._id,
                name: 'Aluminum Rod 10mm',
                category: 'Rods',
                stock: 200,
                price: 1200,
                status: 'In Stock'
            },
            {
                user: user._id,
                name: 'Copper Wire 2mm',
                category: 'Wires',
                stock: 2,
                price: 300,
                status: 'Low Stock'
            },
            {
                user: user._id,
                name: 'Iron Pipe 2 inch',
                category: 'Pipes',
                stock: 0,
                price: 800,
                status: 'Out of Stock'
            }
        ]);

        console.log('Products Seeded');

        // Create Orders
        const orders = await Order.create([
            {
                user: user._id,
                customerName: 'Rahul Construction',
                product: products[0]._id,
                amount: 10000,
                status: 'Completed'
            },
            {
                user: user._id,
                customerName: 'Metro Builders',
                product: products[1]._id,
                amount: 2400,
                status: 'Shipped'
            },
            {
                user: user._id,
                customerName: 'City Hardware',
                product: products[2]._id,
                amount: 600,
                status: 'Processing'
            },
            {
                user: user._id,
                customerName: 'Global Infra',
                product: products[0]._id,
                amount: 5000,
                status: 'Pending'
            }
        ]);

        console.log('Orders Seeded');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
