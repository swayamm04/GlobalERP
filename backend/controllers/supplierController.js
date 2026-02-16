const Supplier = require('../models/Supplier');
const User = require('../models/User');
const logActivity = require('../utils/activityLogger');

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

        let userId = null;

        // 1. Only create user if password is provided
        if (password) {
            // Check if user already exists
            const userExists = await User.findOne({ email });
            if (userExists) {
                return res.status(400).json({ message: 'User already exists with this email' });
            }

            // Create User account for supplier
            const user = await User.create({
                name: companyName,
                email,
                password,
                role: 'supplier'
            });
            userId = user._id;
        }

        // 2. Generate unique Supplier ID
        const count = await Supplier.countDocuments();
        const supplierId = `SUP-${(count + 1).toString().padStart(3, '0')}`;

        // 3. Create Supplier record
        const supplier = await Supplier.create({
            supplierId,
            companyName,
            contactPerson,
            email,
            phone,
            location,
            userId
        });

        // Log Activity
        if (req.user) {
            await logActivity(
                req.user._id,
                'CREATED_SUPPLIER',
                `Created supplier: ${companyName} (${supplierId})`,
                req
            );
        }

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

        // 1. Delete associated User account if exists
        if (supplier.userId) {
            await User.findByIdAndDelete(supplier.userId);
        }

        // 2. Delete Supplier record
        await Supplier.findByIdAndDelete(req.params.id);

        // Log Activity
        if (req.user) {
            await logActivity(
                req.user._id,
                'DELETED_SUPPLIER',
                `Deleted supplier: ${supplier.companyName} (${supplier.supplierId})`,
                req
            );
        }

        res.status(200).json({ message: 'Supplier removed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const updateSupplier = async (req, res) => {
    try {
        const {
            companyName,
            contactPerson,
            email,
            password,
            phone,
            location,
            status
        } = req.body;

        const supplier = await Supplier.findById(req.params.id);

        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

        // 1. Handle User account update/creation
        let userId = supplier.userId;
        if (password) {
            if (userId) {
                // Update existing user password
                const user = await User.findById(userId);
                if (user) {
                    user.password = password;
                    if (email) user.email = email;
                    if (companyName) user.name = companyName;
                    await user.save();
                }
            } else {
                // Create new user if one didn't exist
                const userExists = await User.findOne({ email });
                if (userExists) {
                    return res.status(400).json({ message: 'User already exists with this email' });
                }
                const user = await User.create({
                    name: companyName || supplier.companyName,
                    email: email || supplier.email,
                    password,
                    role: 'supplier'
                });
                userId = user._id;
            }
        } else if (email || companyName) {
            // Update email/name in User account if it exists
            if (userId) {
                const user = await User.findById(userId);
                if (user) {
                    if (email) user.email = email;
                    if (companyName) user.name = companyName;
                    await user.save();
                }
            }
        }

        // 2. Update Supplier record
        supplier.companyName = companyName || supplier.companyName;
        supplier.contactPerson = contactPerson || supplier.contactPerson;
        supplier.email = email || supplier.email;
        supplier.phone = phone || supplier.phone;
        supplier.location = location || supplier.location;
        supplier.status = status || supplier.status;
        supplier.userId = userId;

        const updatedSupplier = await supplier.save();
        // Log Activity
        if (req.user) {
            await logActivity(
                req.user._id,
                'UPDATED_SUPPLIER',
                `Updated supplier: ${updatedSupplier.companyName} (${updatedSupplier.supplierId})`,
                req
            );
        }

        res.status(200).json(updatedSupplier);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getSuppliers,
    createSupplier,
    deleteSupplier,
    updateSupplier
};
