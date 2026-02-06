import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Search, Filter, Download, FileSpreadsheet, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const getColorClass = (color: string) => {
    switch (color) {
        case "Red":
            return "text-red-600 font-semibold";
        case "Blue":
            return "text-blue-600 font-semibold";
        case "Green":
            return "text-green-600 font-semibold";
        default:
            return "";
    }
};

const ProductCatalog = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    const fetchProducts = async () => {
        try {
            const { data } = await api.get("/api/products");
            setProducts(data);
        } catch (error) {
            console.error("Error fetching products:", error);
            toast.error("Failed to fetch products");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const filteredProducts = products.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const exportToExcel = () => {
        try {
            const dataToExport = filteredProducts.map((product, index) => ({
                "Sl No.": index + 1,
                "Product Name": product.name,
                "Category": product.category,
                "Color": product.color,
                "Length": product.length,
                "Thickness": product.thickness ? `${product.thickness}mm` : "-",
                "HSN Code": product.hsnCode,
                "Price": product.price,
            }));

            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
            XLSX.writeFile(workbook, "products_catalog.xlsx");
            toast.success("Products exported to Excel successfully");
        } catch (error) {
            console.error("Error exporting to Excel:", error);
            toast.error("Failed to export to Excel");
        }
    };

    const exportToPDF = () => {
        try {
            const doc = new jsPDF();

            doc.setFontSize(18);
            doc.text("Product Catalog", 14, 22);

            doc.setFontSize(11);
            doc.text("Vasantha Metal Industry", 14, 30);
            doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`, 14, 36);

            const tableData = filteredProducts.map((product, index) => [
                index + 1,
                product.name,
                product.category,
                product.color,
                product.thickness ? `${product.thickness}mm` : "-",
                product.length,
                product.hsnCode,
                `Rs. ${product.price}`,
            ]);

            autoTable(doc, {
                head: [["Sl No.", "Product Name", "Category", "Color", "Thickness", "Length", "HSN Code", "Price"]],
                body: tableData,
                startY: 44,
            });

            // Add computerized declaration
            const finalY = (doc as any).lastAutoTable.finalY || 150;
            doc.setFontSize(10);
            const declarationText = "This is a computer-generated document. No signature is required.";
            const pageWidth = doc.internal.pageSize.width;

            doc.text(declarationText, pageWidth / 2, finalY + 20, { align: "center" });

            doc.save("products_catalog.pdf");
            toast.success("Products exported to PDF successfully");
        } catch (error) {
            console.error("Error exporting to PDF:", error);
            toast.error("Failed to export to PDF");
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Product Catalog</h1>
                        <p className="text-muted-foreground">View your product catalog</p>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <Download className="mr-2 h-4 w-4" />
                                Export
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={exportToExcel}>
                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                Export to Excel
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={exportToPDF}>
                                <FileText className="mr-2 h-4 w-4" />
                                Export to PDF
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search products..."
                                    className="pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            {/* Filter button removed */}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Sl No.</TableHead>
                                    <TableHead>Product Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Color</TableHead>
                                    <TableHead>Thickness</TableHead>
                                    <TableHead>Length</TableHead>
                                    <TableHead>HSN Code</TableHead>
                                    <TableHead>Price</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-4">Loading catalog...</TableCell>
                                    </TableRow>
                                ) : filteredProducts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-4">
                                            No products found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredProducts.map((product, index) => (
                                        <TableRow key={product._id || index}>
                                            <TableCell className="font-medium">{index + 1}</TableCell>
                                            <TableCell>{product.name}</TableCell>
                                            <TableCell>{product.category}</TableCell>
                                            <TableCell className={getColorClass(product.color)}>{product.color}</TableCell>
                                            <TableCell>{product.thickness ? `${product.thickness}mm` : "-"}</TableCell>
                                            <TableCell>{product.length}</TableCell>
                                            <TableCell>{product.hsnCode}</TableCell>
                                            <TableCell>₹{product.price}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default ProductCatalog;
