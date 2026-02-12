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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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

const ProductCatalog = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [loading, setLoading] = useState(true);

    const fetchCategories = async () => {
        try {
            const { data } = await api.get("/api/categories");
            setCategories(data);
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

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
        fetchCategories();
    }, []);

    const filteredProducts = products.filter((product) => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === "all" ||
            (typeof product.category === 'object' ? product.category._id : product.category) === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const exportToExcel = () => {
        try {
            const dataToExport = filteredProducts.map((product, index) => {
                const specs = product.customFields?.map((f: any) => `${f.label}: ${f.value}`).join(", ") || "";
                return {
                    "Sl No.": index + 1,
                    "Product Name": product.name,
                    "Category": product.category?.name || "No Category",
                    "Specifications": specs,
                    "Price": product.price,
                };
            });

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
                product.category?.name || "No Category",
                product.customFields?.map((f: any) => `${f.label}: ${f.value}`).join(", ") || "-",
                `Rs. ${product.price} / ${product.unit || 'pcs'}`,
            ]);


            autoTable(doc, {
                head: [["Sl No.", "Product Name", "Category", "Specifications", "Price"]],
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
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="w-[180px]">
                                    <Filter className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="Filter by Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat._id} value={cat._id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Sl No.</TableHead>
                                    <TableHead>Product Name</TableHead>
                                    <TableHead>Category</TableHead>
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
                                            <TableCell className="font-medium">
                                                <div>
                                                    {product.name}
                                                    {product.customFields && product.customFields.length > 0 && (
                                                        <div className="flex flex-wrap gap-x-2 mt-1">
                                                            {product.customFields.map((f: any, i: number) => (
                                                                <span key={i} className="text-[10px] text-muted-foreground bg-muted px-1 rounded">
                                                                    {f.label}: {f.value}{f.unit ? ` ${f.unit}` : ""}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>{product.category?.name || "No Category"}</TableCell>
                                            <TableCell>₹{product.price} / {product.unit || 'pcs'}</TableCell>

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
