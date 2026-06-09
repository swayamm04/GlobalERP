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
        
        const Category = require('./models/Category');
        await Category.deleteMany({});

        // Get or Create Admin User
        let user = await User.findOne({ email: 'admin@metalindustries.com' });
        if (!user) {
            user = await User.create({
                name: 'Admin User',
                email: 'admin@metalindustries.com',
                password: 'vasantha',
                role: 'admin'
            });
        }

        // Create Categories
        const categories = await Category.create([
            { user: user._id, name: 'Sheets', hsnCode: '7208' },
            { user: user._id, name: 'Rods', hsnCode: '7214' },
            { user: user._id, name: 'Wires', hsnCode: '7217' },
            { user: user._id, name: 'Pipes', hsnCode: '7304' }
        ]);
        console.log('Categories Seeded');

        // Create Products
        const products = await Product.create([
            {
                user: user._id,
                name: 'Steel Sheet 5mm',
                category: categories[0]._id,
                stock: 150,
                price: 5000,
                status: 'In Stock'
            },
            {
                user: user._id,
                name: 'Aluminum Rod 10mm',
                category: categories[1]._id,
                stock: 200,
                price: 1200,
                status: 'In Stock'
            },
            {
                user: user._id,
                name: 'Copper Wire 2mm',
                category: categories[2]._id,
                stock: 2,
                price: 300,
                status: 'Low Stock'
            },
            {
                user: user._id,
                name: 'Iron Pipe 2 inch',
                category: categories[3]._id,
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
                contact: '9876543210',
                address: '123 Main St, Bangalore',
                items: [
                    {
                        productId: products[0]._id,
                        productName: products[0].name,
                        quantity: 2,
                        price: products[0].price,
                        unit: 'pcs',
                        category: 'Sheets'
                    }
                ],
                subtotal: 10000,
                grandTotal: 11800,
                paidAmount: 11800,
                balanceDue: 0,
                paymentMethod: 'Cash',
                status: 'Completed'
            },
            {
                user: user._id,
                customerName: 'Metro Builders',
                contact: '9876543211',
                address: '456 Metro Ave, Bangalore',
                items: [
                    {
                        productId: products[1]._id,
                        productName: products[1].name,
                        quantity: 2,
                        price: products[1].price,
                        unit: 'pcs',
                        category: 'Rods'
                    }
                ],
                subtotal: 2400,
                grandTotal: 2832,
                paidAmount: 0,
                balanceDue: 2832,
                paymentMethod: 'UPI',
                status: 'Pending'
            },
            {
                user: user._id,
                customerName: 'City Hardware',
                contact: '9876543212',
                address: '789 City Rd, Bangalore',
                items: [
                    {
                        productId: products[2]._id,
                        productName: products[2].name,
                        quantity: 2,
                        price: products[2].price,
                        unit: 'pcs',
                        category: 'Wires'
                    }
                ],
                subtotal: 600,
                grandTotal: 708,
                paidAmount: 708,
                balanceDue: 0,
                paymentMethod: 'Card',
                status: 'Processing'
            },
            {
                user: user._id,
                customerName: 'Global Infra',
                contact: '9876543213',
                address: '321 Global Way, Bangalore',
                items: [
                    {
                        productId: products[0]._id,
                        productName: products[0].name,
                        quantity: 1,
                        price: products[0].price,
                        unit: 'pcs',
                        category: 'Sheets'
                    }
                ],
                subtotal: 5000,
                grandTotal: 5900,
                paidAmount: 0,
                balanceDue: 5900,
                paymentMethod: 'Cash',
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
