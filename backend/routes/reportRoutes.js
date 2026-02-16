const express = require('express');
const router = express.Router();
const {
    getSalesSummary,
    getCategorySales,
    getProductStockReport,
    getRawMaterialStockReport,
    getOrderHistory,
    getPendingOrders,
    getTopCustomers,
    getSupplierPerformance,
    getActivityLogs,
    getAnalyticsDashboard
} = require('../controllers/reportController');

// Sales Reports
router.get('/sales/summary', getSalesSummary);
router.get('/sales/category', getCategorySales);

// Inventory Reports
router.get('/inventory/products', getProductStockReport);
router.get('/inventory/raw-materials', getRawMaterialStockReport);

// Order Reports
router.get('/orders/history', getOrderHistory);
router.get('/orders/pending', getPendingOrders);

// Customer & Supplier Reports
router.get('/customers/top', getTopCustomers);
router.get('/suppliers/performance', getSupplierPerformance);

// Activity Log
router.get('/activity-log', getActivityLogs);

// Dashboard Analytics
router.get('/analytics', getAnalyticsDashboard);

module.exports = router;
