const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Order = require('./models/Order');

dotenv.config();

const recalculateOrders = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const orders = await Order.find({});
        console.log(`Found ${orders.length} total orders in database.`);

        let updatedCount = 0;

        for (const order of orders) {
            let loadingCharge = order.loadingCharge || 0;
            const subtotal = order.subtotal || 0;
            const includeGST = order.includeGST !== false;
            const oldGrandTotal = order.grandTotal || 0;

            // Deduce loading charge if not saved but was part of grand total
            if (loadingCharge === 0) {
                const oldGstAmount = includeGST ? (subtotal * 0.18) : 0;
                const expectedOldTotalWithoutLoading = subtotal + oldGstAmount;
                const diff = oldGrandTotal - expectedOldTotalWithoutLoading;

                // Ignore rounding differences of less than 1
                if (diff >= 1) {
                    loadingCharge = Math.round(diff);
                }
            }

            if (loadingCharge > 0) {
                // Calculate new taxable value
                const taxableValue = subtotal + loadingCharge;

                // Calculate new GST
                const gstAmount = includeGST ? (taxableValue * 0.18) : 0;
                const individualGst = gstAmount / 2;
                const cgst = individualGst;
                const sgst = individualGst;

                // Calculate new raw total & grand total
                const rawTotal = taxableValue + gstAmount;
                const grandTotal = Math.ceil(rawTotal);
                const roundOff = Number((grandTotal - rawTotal).toFixed(2));

                // Handle balance and paid amount adjustments
                let paidAmount = order.paidAmount || 0;
                let balanceDue = order.balanceDue || 0;

                // If it was fully paid before, keep it fully paid under the new grand total
                if (balanceDue === 0 || paidAmount >= oldGrandTotal) {
                    paidAmount = grandTotal;
                    balanceDue = 0;
                } else {
                    balanceDue = Math.max(0, grandTotal - paidAmount);
                }

                // Check if any of these values are different from the saved order values
                const hasChanged = 
                    order.loadingCharge !== loadingCharge ||
                    order.grandTotal !== grandTotal ||
                    order.roundOff !== roundOff ||
                    order.paidAmount !== paidAmount ||
                    order.balanceDue !== balanceDue;

                if (hasChanged) {
                    const oldCgst = order.cgst || (includeGST ? (subtotal * 0.09) : 0);
                    const oldSgst = order.sgst || (includeGST ? (subtotal * 0.09) : 0);

                    order.loadingCharge = loadingCharge;
                    order.grandTotal = grandTotal;
                    order.roundOff = roundOff;
                    order.paidAmount = paidAmount;
                    order.balanceDue = balanceDue;

                    if (order.paymentHistory && order.paymentHistory.length === 1) {
                        order.paymentHistory[0].amount = paidAmount;
                    }

                    await order.save({ validateBeforeSave: false });

                    console.log(`Updated Order #${order.invoiceNo || order._id}:`);
                    console.log(`  - Subtotal: ${subtotal} | Loading Charge: ${loadingCharge}`);
                    console.log(`  - Old Grand Total: ${oldGrandTotal} -> New Grand Total: ${grandTotal}`);
                    console.log(`  - Old GST (each): ${oldCgst.toFixed(2)} -> New GST (each): ${cgst.toFixed(2)}`);
                    console.log(`  - Paid Amount: ${paidAmount} | Balance Due: ${balanceDue}`);
                    console.log('----------------------------------------------------');
                    updatedCount++;
                }
            }
        }

        console.log(`Successfully updated ${updatedCount} orders.`);
        await mongoose.disconnect();
        process.exit(0);

    } catch (error) {
        console.error('Error during recalculation:', error);
        process.exit(1);
    }
};

recalculateOrders();
