import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Filter, Edit, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { ProductDialog } from "@/components/products/ProductDialog";
import Cookies from "js-cookie";

const getStatusVariant = (status: string) => {
  switch (status) {
    case "In Stock":
      return "default";
    case "Low Stock":
      return "secondary";
    case "Out of Stock":
      return "destructive";
    default:
      return "secondary";
  }
};

const Products = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get("/api/products");
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to fetch products");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCreate = async (data: any) => {
    try {
      const token = Cookies.get("auth_token");
      await api.post("/api/products", data, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      toast.success("Product created successfully");
      fetchProducts();
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error("Failed to create product");
    }
  };

  const handleUpdate = async (data: any) => {
    try {
      const token = Cookies.get("auth_token");
      await api.put(`/api/products/${editingProduct._id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      toast.success("Product updated successfully");
      fetchProducts();
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const token = Cookies.get("auth_token");
      await api.delete(`/api/products/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      toast.success("Product deleted successfully");
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    }
  };

  const openCreateDialog = () => {
    setEditingProduct(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (product: any) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Manage Products</h1>
            <p className="text-muted-foreground">Manage your product inventory</p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
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
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Thickness</TableHead>
                  <TableHead>Length</TableHead>
                  <TableHead>HSN Code</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product._id}>
                    <TableCell className="font-medium">
                      <div>
                        {product.name}
                        {product.customFields && product.customFields.length > 0 && (
                          <div className="flex flex-wrap gap-x-2 mt-1">
                            {product.customFields.map((f: any, i: number) => (
                              <span key={i} className="text-[10px] text-muted-foreground bg-muted px-1 rounded">
                                {f.label}: {f.value}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>{product.color}</TableCell>
                    <TableCell>{product.thickness ? `${product.thickness}mm` : "-"}</TableCell>
                    <TableCell>{product.length}</TableCell>
                    <TableCell>{product.hsnCode}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>₹{product.price}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(product.status)}>
                        {product.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDelete(product._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-4">
                      No products found. Add a new product to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <ProductDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSubmit={editingProduct ? handleUpdate : handleCreate}
          product={editingProduct}
        />
      </div>
    </DashboardLayout>
  );
};

export default Products;
