"use client";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Filter, Edit, Trash2 } from "lucide-react";
import { isBase12Unit } from "@/lib/calculationUtils";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { ProductDialog } from "@/components/products/ProductDialog";
import { CategoryDialog } from "@/components/products/CategoryDialog";
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
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");

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
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
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

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" ||
      (typeof product.category === 'object' ? product.category._id : product.category) === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Products</h1>
          <p className="text-muted-foreground">Manage your product inventory</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => setIsCategoryDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
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
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
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
                          {product.calculationField && product.calculationField.label && product.calculationField.value?.toString() !== "1" && product.calculationField.value !== "" && (
                            <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1 rounded border border-blue-100 flex items-center gap-1">
                              {product.calculationField.label}: {product.calculationField.value} {product.calculationField.unit}
                            </span>
                          )}
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
                  <TableCell>{product.stock} {product.unit || 'pcs'}</TableCell>
                  <TableCell>₹{product.price} / {product.calculationField?.unit || product.unit || 'pcs'}</TableCell>

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
        categories={categories}
      />
      <CategoryDialog
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
        onSuccess={fetchCategories}
      />
    </div>
  );
};

export default Products;
