import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface InvoiceData {
    customerName: string;
    contact: string;
    address: string;
    items: any[];
    grandTotal: number;
    paymentMethod: string;
    customerType?: string;
    companyName?: string;
    gstin?: string;
    stateName?: string;
    stateCode?: string;
    email?: string;
    invoiceNo?: string;
    invoiceDate?: string | Date;
    deliveryNote?: string;
    modeOfPayment?: string;
    referenceNo?: string;
    otherReferences?: string;
    buyersOrderNo?: string;
    buyersOrderDate?: string | Date;
    dispatchDocNo?: string;
    deliveryNoteDate?: string | Date;
    dispatchedThrough?: string;
    destination?: string;
    billOfLading?: string;
    motorVehicleNo?: string;
    termsOfDelivery?: string;
    companyDetails?: {
        companyName: string;
        address: string;
        gstNumber?: string; // Fallback
        gstin?: string;     // Backend name
        stateName?: string; // Fallback
        state?: string;     // Backend name
        stateCode?: string; // Fallback
        gstCode?: string;   // Backend name
        phone: string;
        email: string;
        hsnCode?: string;
    };
    orderId?: string;
    date?: string | Date;
    isEstimation?: boolean;
    estimationNo?: string;
    paidAmount?: number;
    balanceDue?: number;
}

export const generateInvoice = (data: InvoiceData) => {
    const {
        customerName,
        contact,
        address,
        items,
        grandTotal,
        paymentMethod,
        companyDetails,
        orderId,
        date,
        customerType,
        companyName: businessCompanyName,
        gstin,
        stateName: buyerStateName,
        stateCode: buyerStateCode,
        email: buyerEmail,
        invoiceNo,
        invoiceDate: invDate,
        deliveryNote,
        modeOfPayment,
        referenceNo,
        otherReferences,
        buyersOrderNo,
        buyersOrderDate,
        dispatchDocNo,
        deliveryNoteDate,
        dispatchedThrough,
        destination,
        billOfLading,
        motorVehicleNo,
        termsOfDelivery,
        paidAmount,
        balanceDue
    } = data;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Helper to format date
    const formatDate = (dateInput?: any) => {
        if (!dateInput) return "";
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return dateInput.toString();
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
    };

    // Configuration for uniform page layout
    const drawPageDecoration = (tableData?: any) => {
        // Main Border for current page
        doc.setDrawColor(0);
        doc.setLineWidth(0.1);
        doc.rect(5, 5, pageWidth - 10, pageHeight - 10);

        // Footer on every page
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.text("This is a Computer Generated Invoice", pageWidth / 2, pageHeight - 8, { align: "center" });

        if (tableData && tableData.pageNumber > 1) {
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.text(`Page ${tableData.pageNumber}`, pageWidth - 15, pageHeight - 8);
        }
    };

    // Header - Tax Invoice (First Page)
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(data.isEstimation ? "ESTIMATION" : "Tax Invoice", pageWidth / 2, 12, { align: "center" });
    doc.line(5, 15, pageWidth - 5, 15);

    // Top Section
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const leftCol = 8;
    doc.setFont("helvetica", "bold");
    doc.text(companyDetails?.companyName || "VASANTHA METAL INDUSTRY", leftCol, 20);
    doc.setFont("helvetica", "normal");
    const addressLines = doc.splitTextToSize(companyDetails?.address || "No 25/11, 2nd Main, 2nd Cross, Industrial Area, Bangalore", 80);
    doc.text(addressLines, leftCol, 25);

    let headerY = 25 + (addressLines.length * 4);
    const displayGstin = companyDetails?.gstin || (companyDetails as any)?.gstNumber || "";
    const displayStateName = companyDetails?.state || (companyDetails as any)?.stateName || "";
    const displayStateCode = companyDetails?.gstCode || (companyDetails as any)?.stateCode || "";

    doc.text(`GSTIN/UIN: ${displayGstin}`, leftCol, headerY);
    doc.text(`State Name: ${displayStateName}, Code: ${displayStateCode}`, leftCol, headerY + 5);

    // Top Section - Detailed Grid
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const rightColOffset = pageWidth / 2;

    // Horizontal separators for header grid
    const gridLines = data.isEstimation ? [22, 85] : [22, 32, 42, 52, 65, 85];
    gridLines.forEach(y => doc.line(rightColOffset, y, pageWidth - 5, y));

    // Right Column Content - Grid fields
    doc.text(data.isEstimation ? "Estimation No." : "Invoice No.", rightColOffset + 2, 19);
    doc.setFont("helvetica", "bold");
    const displayInvoiceNo = data.isEstimation
        ? (data.estimationNo || `EST-${Date.now().toString().slice(-6)}`)
        : (invoiceNo || (orderId ? (orderId.length > 6 ? `#INV-${orderId.slice(-6).toUpperCase()}` : `#INV-${orderId}`) : `#INV-${Date.now().toString().slice(-6)}`));
    doc.text(displayInvoiceNo, rightColOffset + 2, 21.5);

    doc.setFont("helvetica", "normal");
    doc.text("Dated", rightColOffset + 35, 19);
    doc.setFont("helvetica", "bold");
    doc.text(formatDate(invDate || date || new Date()), rightColOffset + 35, 21.5);

    if (!data.isEstimation) {
        doc.setFont("helvetica", "normal");
        doc.text("Delivery Note", rightColOffset + 2, 26);
        doc.setFont("helvetica", "bold");
        doc.text(deliveryNote || "", rightColOffset + 2, 30);

        doc.setFont("helvetica", "normal");
        doc.text("Mode/Terms of Payment", rightColOffset + 35, 26);
        doc.setFont("helvetica", "bold");
        doc.text((modeOfPayment || paymentMethod || "Cash").toUpperCase(), rightColOffset + 35, 30);

        doc.setFont("helvetica", "normal");
        doc.text("Dispatched through", rightColOffset + 2, 36);
        doc.setFont("helvetica", "bold");
        doc.text(dispatchedThrough || "", rightColOffset + 2, 40);

        doc.setFont("helvetica", "normal");
        doc.text("Destination", rightColOffset + 35, 36);
        doc.setFont("helvetica", "bold");
        doc.text(destination || (address ? address.split(',').pop()?.trim() : "") || "N/A", rightColOffset + 35, 40);

        doc.setFont("helvetica", "normal");
        doc.text("Delivery Note Date", rightColOffset + 2, 46);
        doc.setFont("helvetica", "bold");
        doc.text(formatDate(deliveryNoteDate), rightColOffset + 2, 50);

        doc.setFont("helvetica", "normal");
        doc.text("Motor Vehicle No.", rightColOffset + 35, 46);
        doc.setFont("helvetica", "bold");
        doc.text(motorVehicleNo || "", rightColOffset + 35, 50);

        doc.setFont("helvetica", "normal");
        doc.text("Terms of Delivery", rightColOffset + 2, 56);
        const termsLines = doc.splitTextToSize(termsOfDelivery || "", 70);
        doc.setFont("helvetica", "bold");
        doc.text(termsLines, rightColOffset + 2, 60);
    }

    // Buyer Details
    doc.setFont("helvetica", "bold");
    doc.text("Buyer (Bill to)", leftCol, headerY + 15);

    let buyerY = headerY + 20;
    if (customerType === "Business" && businessCompanyName) {
        doc.text(businessCompanyName, leftCol, buyerY);
        buyerY += 4;
    } else {
        doc.text(customerName, leftCol, buyerY);
        buyerY += 4;
    }

    doc.setFont("helvetica", "normal");
    const buyerAddr = doc.splitTextToSize(address, 80);
    doc.text(buyerAddr, leftCol, buyerY);
    buyerY += (buyerAddr.length * 4);

    if (customerType === "Business") {
        if (gstin) {
            doc.text(`GSTIN/UIN: ${gstin}`, leftCol, buyerY);
            buyerY += 4;
        }
        if (buyerStateName) {
            doc.text(`State Name: ${buyerStateName}${buyerStateCode ? `, Code: ${buyerStateCode}` : ""}`, leftCol, buyerY);
            buyerY += 4;
        }
    }

    doc.text(`Contact: ${contact}`, leftCol, buyerY);

    doc.line(pageWidth / 2, 15, pageWidth / 2, 85);
    doc.line(5, 85, pageWidth - 5, 85);

    // Items Table with Multi-page Support
    const tableBody = items.map((item, index) => {
        const rateExclTax = item.price / 1.18;
        const specs = item.customFields && item.customFields.length > 0
            ? item.customFields.map((f: any) => `${f.label}: ${f.value}${f.unit ? ` ${f.unit}` : ""}`).join(", ")
            : "";

        const description = specs
            ? { content: `${item.productName || "Product"}\n(${specs})`, styles: { fontSize: 6, cellPadding: 1 } }
            : (item.productName || "Product");

        return [
            index + 1,
            description,
            companyDetails?.hsnCode || item.category || "N/A", // Using global HSN first, then category as fallback
            `${item.quantity} NO`,
            item.price.toFixed(2),
            rateExclTax.toFixed(2),
            "NO",
            (rateExclTax * item.quantity).toFixed(2)
        ];
    });

    autoTable(doc, {
        startY: 85,
        head: [['SI No', 'Description of Goods', 'HSN/SAC', 'Quantity', 'Rate (Incl. Tax)', 'Rate', 'per', 'Amount']],
        body: tableBody,
        theme: 'plain',
        styles: { fontSize: 7, cellPadding: 2, font: "helvetica", lineWidth: 0.1, lineColor: [0, 0, 0] },
        headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: 'bold' },
        columnStyles: {
            0: { cellWidth: 8 },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 18 },
            3: { cellWidth: 18, halign: 'center' },
            4: { cellWidth: 20, halign: 'right' },
            5: { cellWidth: 20, halign: 'right' },
            6: { cellWidth: 10 },
            7: { cellWidth: 22, halign: 'right' }
        },
        margin: { left: 5, right: 5, bottom: 15 },
        didDrawPage: drawPageDecoration
    });

    // Summary Section
    let lastY = (doc as any).lastAutoTable.finalY + 5;
    const summaryHeight = 35;

    // Check if we need a new page for the summary
    if (lastY + summaryHeight > pageHeight - 15) {
        doc.addPage();
        drawPageDecoration();
        lastY = 20;
    }

    const summaryX = pageWidth - 80;
    const rightEdge = pageWidth - 10;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");

    const subtotalExclTax = items.reduce((sum, item) => sum + (item.price / 1.18 * item.quantity), 0);

    doc.text("Total Amount Before Tax:", summaryX, lastY);
    doc.text(`Rs. ${subtotalExclTax.toFixed(2)}`, rightEdge, lastY, { align: 'right' });

    const cgst = subtotalExclTax * 0.09;
    const sgst = subtotalExclTax * 0.09;

    doc.setFont("helvetica", "bold");
    doc.text("CGST (9%):", summaryX + 20, lastY + 6);
    doc.text(`Rs. ${cgst.toFixed(2)}`, rightEdge, lastY + 6, { align: 'right' });

    doc.text("SGST (9%):", summaryX + 20, lastY + 12);
    doc.text(`Rs. ${sgst.toFixed(2)}`, rightEdge, lastY + 12, { align: 'right' });

    doc.line(summaryX - 2, lastY + 15, pageWidth - 5, lastY + 15);
    doc.setFontSize(10);
    doc.text("Grand Total:", summaryX, lastY + 22);
    doc.text(`Rs. ${grandTotal.toFixed(2)}`, rightEdge, lastY + 22, { align: 'right' });

    // Payment Summary for Advance Orders
    if (balanceDue !== undefined && balanceDue > 0) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("Amount Paid:", summaryX, lastY + 30);
        doc.text(`Rs. ${paidAmount?.toFixed(2) || "0.00"}`, rightEdge, lastY + 30, { align: 'right' });

        doc.setTextColor(220, 38, 38); // Red for balance due
        doc.text("Balance Due:", summaryX, lastY + 36);
        doc.text(`Rs. ${balanceDue.toFixed(2)}`, rightEdge, lastY + 36, { align: 'right' });
        doc.setTextColor(0, 0, 0); // Reset to black
    } else if (paidAmount !== undefined && paidAmount >= grandTotal) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("Status:", summaryX, lastY + 30);
        doc.setTextColor(22, 163, 74); // Green for Fully Paid
        doc.text("FULLY PAID", rightEdge, lastY + 30, { align: 'right' });
        doc.setTextColor(0, 0, 0);
    }

    doc.save(`${data.isEstimation ? 'Estimation' : 'Invoice'}_${customerName.replace(/\s+/g, '_')}_${orderId || Date.now()}.pdf`);
};
