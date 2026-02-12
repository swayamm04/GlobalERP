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
        const { materials, category } = req.body;

        // Check if it's a bulk creation
        if (Array.isArray(materials)) {
            // Validate materials and apply category
            const materialsToCreate = materials.map(m => ({
                ...m,
                category: category || m.category,
                stockQuantity: m.stockQuantity || 0,
                specifications: m.specifications || []
            }));

            // Check for duplicates in the list itself
            const names = materialsToCreate.map(m => m.name);
            const uniqueNames = new Set(names);
            if (names.length !== uniqueNames.size) {
                return res.status(400).json({ message: 'Duplicate material names in request' });
            }

            // Check for existing materials in DB
            const existing = await RawMaterial.find({ name: { $in: names } });
            if (existing.length > 0) {
                return res.status(400).json({
                    message: `Materials already exist: ${existing.map(m => m.name).join(', ')}`
                });
            }

            const createdMaterials = await RawMaterial.insertMany(materialsToCreate);
            return res.status(201).json(createdMaterials);
        }

        // Single material creation
        const { name, unit, minStockLevel, stockQuantity, specifications } = req.body;
        const exists = await RawMaterial.findOne({ name });
        if (exists) {
            return res.status(400).json({ message: 'Material already exists' });
        }
        const material = await RawMaterial.create({
            name,
            category: req.body.category,
            unit,
            minStockLevel: minStockLevel || 10,
            stockQuantity: stockQuantity || 0,
            specifications: specifications || []
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

// @desc    Add stock to raw material
// @route   PUT /api/raw-materials/:id/add-stock
const addRawMaterialStock = async (req, res) => {
    try {
        const { quantity } = req.body;
        if (!quantity || isNaN(quantity)) {
            return res.status(400).json({ message: 'Valid quantity is required' });
        }

        const material = await RawMaterial.findById(req.params.id);
        if (!material) {
            return res.status(404).json({ message: 'Material not found' });
        }

        material.stockQuantity += Number(quantity);
        await material.save();

        res.status(200).json(material);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getRawMaterials,
    createRawMaterial,
    updateRawMaterial,
    addRawMaterialStock
};
