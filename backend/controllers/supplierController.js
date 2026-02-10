const Supplier = require('../models/Supplier');
const User = require('../models/User');

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private/Admin
const getSuppliers = async (req, res) => {
    try {
        const suppliers = await Supplier.find().sort({ createdAt: -1 });
        res.status(200).json(suppliers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a supplier
// @route   POST /api/suppliers
// @access  Private/Admin
const createSupplier = async (req, res) => {
    try {
        const {
            companyName,
            contactPerson,
            email,
            password,
            phone,
            location
        } = req.body;

        // 1. Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // 2. Create User account for supplier
        const user = await User.create({
            name: companyName,
            email,
            password,
            role: 'supplier'
        });

        // 3. Generate unique Supplier ID
        const count = await Supplier.countDocuments();
        const supplierId = `SUP-${(count + 1).toString().padStart(3, '0')}`;

        // 4. Create Supplier record
        const supplier = await Supplier.create({
            supplierId,
            companyName,
            contactPerson,
            email,
            phone,
            location,
            userId: user._id
        });

        res.status(201).json(supplier);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const deleteSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);

        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

        // 1. Delete associated User account
        if (supplier.userId) {
            await User.findByIdAndDelete(supplier.userId);
        }

        // 2. Delete Supplier record
        await Supplier.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: 'Supplier removed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getSuppliers,
    createSupplier,
    deleteSupplier
};
