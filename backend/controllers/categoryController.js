const Category = require('../models/Category');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Private
const getCategories = async (req, res) => {
    const categories = await Category.find({ user: req.user.id });
    res.status(200).json(categories);
};

// @desc    Create category
// @route   POST /api/categories
// @access  Private
const createCategory = async (req, res) => {
    if (!req.body.name) {
        res.status(400).json({ message: 'Please add a category name' });
        return;
    }

    const category = await Category.create({
        user: req.user.id,
        name: req.body.name,
        fields: req.body.fields || []
    });

    res.status(201).json(category);
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private
const updateCategory = async (req, res) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
        res.status(404).json({ message: 'Category not found' });
        return;
    }

    const updatedCategory = await Category.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
    });

    res.status(200).json(updatedCategory);
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private
const deleteCategory = async (req, res) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
        res.status(404).json({ message: 'Category not found' });
        return;
    }

    await category.deleteOne();
    res.status(200).json({ id: req.params.id });
};

module.exports = {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
};
