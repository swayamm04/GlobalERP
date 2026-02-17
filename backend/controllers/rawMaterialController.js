const RawMaterial = require('../models/RawMaterial');
const logActivity = require('../utils/activityLogger');

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

            // Log Activity
            if (req.user) {
                await logActivity(
                    req.user._id,
                    'BULK_CREATED_RAW_MATERIALS',
                    `Created ${createdMaterials.length} raw materials in bulk`,
                    req
                );
            }

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
        // Log Activity
        if (req.user) {
            await logActivity(
                req.user._id,
                'CREATED_RAW_MATERIAL',
                `Created raw material: ${material.name}`,
                req
            );
        }

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
        // Log Activity
        if (req.user) {
            await logActivity(
                req.user._id,
                'UPDATED_RAW_MATERIAL',
                `Updated raw material: ${material.name}`,
                req
            );
        }

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

        // Log Activity
        if (req.user) {
            await logActivity(
                req.user._id,
                'ADDED_RAW_MATERIAL_STOCK',
                `Added ${quantity} stock to raw material: ${material.name}`,
                req
            );
        }

        res.status(200).json(material);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete raw material
// @route   DELETE /api/raw-materials/:id
const deleteRawMaterial = async (req, res) => {
    try {
        const material = await RawMaterial.findByIdAndDelete(req.params.id);
        if (!material) {
            return res.status(404).json({ message: 'Material not found' });
        }

        // Log Activity
        if (req.user) {
            await logActivity(
                req.user._id,
                'DELETED_RAW_MATERIAL',
                `Deleted raw material: ${material.name}`,
                req
            );
        }

        res.status(200).json({ message: 'Material deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getRawMaterials,
    createRawMaterial,
    updateRawMaterial,
    addRawMaterialStock,
    deleteRawMaterial
};
