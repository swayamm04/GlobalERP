const Product = require('../models/Product');
const logActivity = require('../utils/activityLogger');

// @desc    Get products
// @route   GET /api/products
// @access  Public (or Private depending on needs, currently Public)
const getProducts = async (req, res) => {
    const products = await Product.find().populate('category').sort({ createdAt: -1 });
    res.status(200).json(products);
};

// @desc    Set product
// @route   POST /api/products
// @access  Private
const createProduct = async (req, res) => {
    if (!req.body.name || !req.body.price) {
        res.status(400).json({ message: 'Please add name and price' });
        return;
    }

    let status = 'In Stock';
    if (req.body.stock === 0) {
        status = 'Out of Stock';
    } else if (req.body.stock < 10) {
        status = 'Low Stock';
    }

    const product = await Product.create({
        ...req.body,
        status: status,
        user: req.user.id
    });

    const populatedProduct = await Product.findById(product._id).populate('category');

    // Log Activity
    if (req.user) {
        await logActivity(
            req.user._id,
            'CREATED_PRODUCT',
            `Added new product: ${product.name}`,
            req
        );
    }

    res.status(200).json(populatedProduct);
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        res.status(400).json({ message: 'Product not found' });
        return;
    }

    // Check for user
    if (!req.user) {
        res.status(401).json({ message: 'User not found' });
        return;
    }

    // Calculate status if stock is being updated
    if (req.body.stock !== undefined) {
        let status = 'In Stock';
        if (Number(req.body.stock) === 0) {
            status = 'Out of Stock';
        } else if (Number(req.body.stock) < 5) {
            status = 'Low Stock';
        }
        req.body.status = status;
    }

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
    }).populate('category');

    // Log Activity
    if (req.user) {
        await logActivity(
            req.user._id,
            'UPDATED_PRODUCT',
            `Updated product: ${product.name}`,
            req
        );
    }

    res.status(200).json(updatedProduct);
};

// @desc    Add stock to product
// @route   PUT /api/products/:id/add-stock
const addProductStock = async (req, res) => {
    try {
        const { quantity } = req.body;
        if (!quantity || isNaN(quantity)) {
            return res.status(400).json({ message: 'Valid quantity is required' });
        }

        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        product.stock += Number(quantity);

        // Update status based on new stock
        if (product.stock === 0) {
            product.status = 'Out of Stock';
        } else if (product.stock < 10) {
            product.status = 'Low Stock';
        } else {
            product.status = 'In Stock';
        }

        await product.save();

        const populatedProduct = await Product.findById(product._id).populate('category');

        // Log Activity
        if (req.user) {
            await logActivity(
                req.user._id,
                'ADDED_STOCK',
                `Added ${quantity} stock to ${product.name}`,
                req
            );
        }

        res.status(200).json(populatedProduct);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private
const deleteProduct = async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        res.status(400).json({ message: 'Product not found' });
        return;
    }

    // Check for user
    if (!req.user) {
        res.status(401).json({ message: 'User not found' });
        return;
    }

    await product.deleteOne();

    // Log Activity
    if (req.user) {
        await logActivity(
            req.user._id,
            'DELETED_PRODUCT',
            `Deleted product: ${product.name}`,
            req
        );
    }

    res.status(200).json({ id: req.params.id });
};

module.exports = {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    addProductStock
};
