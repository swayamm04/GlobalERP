import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface InvoiceData {
    customerName: string;
    contact: string;
    address: string;
    items: any[];
    grandTotal: number;
    paymentMethod: string;
    companyDetails?: {
        companyName: string;
        address: string;
        gstNumber: string;
        stateName: string;
        stateCode: string;
        phone: string;
        email: string;
    };
    orderId?: string;
    date?: string | Date;
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
        date
    } = data;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

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
    doc.text("Tax Invoice", pageWidth / 2, 12, { align: "center" });
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
    doc.text(`GSTIN/UIN: ${companyDetails?.gstNumber || "29ABCDE1234F1Z5"}`, leftCol, headerY);
    doc.text(`State Name: ${companyDetails?.stateName || "Karnataka"}, Code: ${companyDetails?.stateCode || "29"}`, leftCol, headerY + 5);

    // Top Section - Detailed Grid
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const rightColOffset = pageWidth / 2;

    // Horizontal separators for header grid
    [22, 32, 42, 52, 62, 72, 85].forEach(y => doc.line(rightColOffset, y, pageWidth - 5, y));

    // Right Column Content - Grid fields
    doc.text("Invoice No.", rightColOffset + 2, 19);
    doc.setFont("helvetica", "bold");
    const displayId = orderId ? (orderId.length > 6 ? `#INV-${orderId.slice(-6).toUpperCase()}` : `#INV-${orderId}`) : `#INV-${Date.now().toString().slice(-6)}`;
    doc.text(displayId, rightColOffset + 2, 21.5);

    doc.setFont("helvetica", "normal");
    doc.text("Dated", rightColOffset + 35, 19);
    doc.setFont("helvetica", "bold");
    const invoiceDate = date ? new Date(date) : new Date();
    doc.text(invoiceDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }), rightColOffset + 35, 21.5);

    doc.setFont("helvetica", "normal");
    doc.text("Delivery Note", rightColOffset + 2, 26);
    doc.text("Mode/Terms of Payment", rightColOffset + 35, 26);
    doc.setFont("helvetica", "bold");
    doc.text((paymentMethod || "Cash").toUpperCase(), rightColOffset + 35, 30);

    doc.setFont("helvetica", "normal");
    doc.text("Reference No. & Date", rightColOffset + 2, 36);
    doc.text("Other References", rightColOffset + 35, 36);

    doc.text("Buyer's Order No.", rightColOffset + 2, 46);
    doc.text("Dated", rightColOffset + 35, 46);

    doc.text("Dispatch Doc No.", rightColOffset + 2, 56);
    doc.text("Delivery Note Date", rightColOffset + 35, 56);

    doc.text("Dispatched through", rightColOffset + 2, 66);
    doc.text("Destination", rightColOffset + 35, 66);
    doc.setFont("helvetica", "bold");
    doc.text(address.split(',').pop()?.trim() || "N/A", rightColOffset + 35, 70);

    doc.setFont("helvetica", "normal");
    doc.text("Terms of Delivery", rightColOffset + 2, 76);
    doc.text("Motor Vehicle No.", rightColOffset + 35, 76);

    // Buyer Details
    doc.setFont("helvetica", "bold");
    doc.text("Buyer (Bill to)", leftCol, headerY + 15);
    doc.text(customerName, leftCol, headerY + 20);
    doc.setFont("helvetica", "normal");
    const buyerAddr = doc.splitTextToSize(address, 80);
    doc.text(buyerAddr, leftCol, headerY + 25);
    doc.text(`Contact: ${contact}`, leftCol, headerY + 25 + (buyerAddr.length * 4));

    doc.line(pageWidth / 2, 15, pageWidth / 2, 85);
    doc.line(5, 85, pageWidth - 5, 85);

    // Items Table with Multi-page Support
    const tableBody = items.map((item, index) => {
        const rateExclTax = item.price / 1.18;
        return [
            index + 1,
            item.productName || "Product",
            item.category || "N/A", // Using category as HSN/SAC fallback if not explicitly provided
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

    doc.save(`Invoice_${customerName.replace(/\s+/g, '_')}_${orderId || Date.now()}.pdf`);
};
