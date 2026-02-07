const Product = require('../models/Product');

// @desc    Get products
// @route   GET /api/products
// @access  Public (or Private depending on needs, currently Public)
const getProducts = async (req, res) => {
    const products = await Product.find().populate('category');
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
    } else if (req.body.stock < 5) {
        status = 'Low Stock';
    }

    const product = await Product.create({
        ...req.body,
        status: status,
        user: req.user.id
    });

    const populatedProduct = await Product.findById(product._id).populate('category');
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

    // Make sure the logged in user matches the goal user
    // Optional: If you want admins to edit everything, skip this check
    // if (product.user.toString() !== req.user.id) {
    //     res.status(401).json({ message: 'User not authorized' });
    //     return;
    // }

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

    res.status(200).json(updatedProduct);
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

    res.status(200).json({ id: req.params.id });
};

module.exports = {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct
};
