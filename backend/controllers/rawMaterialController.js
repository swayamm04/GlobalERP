const RawMaterial = require('../models/RawMaterial');

// @desc    Get all raw materials
// @route   GET /api/raw-materials
const getRawMaterials = async (req, res) => {
    try {
        const materials = await RawMaterial.find().sort({ name: 1 });
        res.status(200).json(materials);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a raw material
// @route   POST /api/raw-materials
const createRawMaterial = async (req, res) => {
    try {
        const { name, category, unit, minStockLevel, stockQuantity } = req.body;
        const exists = await RawMaterial.findOne({ name });
        if (exists) {
            return res.status(400).json({ message: 'Material already exists' });
        }
        const material = await RawMaterial.create({
            name,
            category,
            unit,
            minStockLevel,
            stockQuantity: stockQuantity || 0
        });
        res.status(201).json(material);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update raw material
// @route   PUT /api/raw-materials/:id
const updateRawMaterial = async (req, res) => {
    try {
        const material = await RawMaterial.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(material);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getRawMaterials,
    createRawMaterial,
    updateRawMaterial
};
