"use client";

import { useState, useEffect, useRef } from "react";
import { LogOut, Search, Menu, Loader2, Package, ShoppingCart, Users, Truck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { toast } from "sonner";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  const router = useRouter(); // Top level hook call
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const userName = Cookies.get("user_name") || "Admin User";
  const userRole = Cookies.get("user_role") || "User";
  const userInitials = userName.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);

  useEffect(() => {
    setMounted(true);

    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length > 1) {
        performSearch();
      } else {
        setSearchResults(null);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = async () => {
    setIsSearching(true);
    setShowResults(true);
    try {
      const { data } = await api.get(`/api/search?q=${searchQuery}`);
      setSearchResults(data);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const navigateToResult = (type: string, id: string) => {
    setShowResults(false);
    setSearchQuery("");
    switch (type) {
      case 'order':
        router.push('/manage-orders');
        break;
      case 'product':
        router.push('/manage-products');
        break;
      case 'customer':
        router.push('/customers');
        break;
      case 'supplier':
        router.push('/suppliers');
        break;
      case 'user':
        router.push('/users');
        break;
    }
  };

  const handleLogout = () => {
    // 1. Clear all auth-related cookies with explicit path to ensure removal
    const cookieOptions = { path: '/' };
    Cookies.remove("auth_token", cookieOptions);
    Cookies.remove("user_role", cookieOptions);
    Cookies.remove("user_name", cookieOptions);
    
    // 2. Clear any local/session storage that might hold sensitive state
    localStorage.clear();
    sessionStorage.clear();

    toast.success("Logged out successfully");

    // 3. Professional redirection: Force a full page reload to the login page
    // Using window.location.href instead of router.push ensures that all 
    // client-side state is cleared and the browser makes a fresh request 
    // to the server, allowing the middleware to intercept correctly.
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-6">
      {/* Mobile Menu Button - Left */}
      <div className="flex items-center gap-4 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="text-muted-foreground hover:text-foreground"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Search - Hidden on mobile initially or full width if needed, kept simple for now */}
      <div className="relative w-full max-w-md hidden md:block" ref={searchRef}>
        <div className="relative">
          {isSearching ? (
            <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          )}
          <Input
            type="search"
            placeholder="Search products, orders, customers..."
            className="pl-10 bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.trim().length > 1 && setShowResults(true)}
          />
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchResults && (
          <div className="absolute top-full left-0 right-0 mt-2 max-h-[400px] overflow-y-auto bg-card border rounded-md shadow-lg z-50 custom-scrollbar">
            {/* Orders */}
            {searchResults.orders?.length > 0 && (
              <div className="p-2 border-b last:border-0">
                <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <ShoppingCart className="h-3 w-3" />
                  Orders
                </div>
                {searchResults.orders.map((order: any) => (
                  <button
                    key={order._id}
                    className="w-full text-left px-2 py-2 rounded hover:bg-muted transition-colors flex flex-col"
                    onClick={() => navigateToResult('order', order._id)}
                  >
                    <span className="text-sm font-medium">#{order._id.substring(order._id.length - 6).toUpperCase()} - {order.customerName}</span>
                    <span className="text-xs text-muted-foreground flex justify-between">
                      <span>{order.status}</span>
                      <span>₹{order.grandTotal?.toLocaleString()}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Products */}
            {searchResults.products?.length > 0 && (
              <div className="p-2 border-b last:border-0">
                <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <Package className="h-3 w-3" />
                  Products
                </div>
                {searchResults.products.map((product: any) => (
                  <button
                    key={product._id}
                    className="w-full text-left px-2 py-2 rounded hover:bg-muted transition-colors flex flex-col"
                    onClick={() => navigateToResult('product', product._id)}
                  >
                    <span className="text-sm font-medium">{product.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {product.category?.name} • ₹{product.price} • {product.stock} in stock
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Customers */}
            {searchResults.customers?.length > 0 && (
              <div className="p-2 border-b last:border-0">
                <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <Users className="h-3 w-3" />
                  Customers
                </div>
                {searchResults.customers.map((customer: any) => (
                  <button
                    key={customer._id}
                    className="w-full text-left px-2 py-2 rounded hover:bg-muted transition-colors flex flex-col"
                    onClick={() => navigateToResult('customer', customer._id)}
                  >
                    <span className="text-sm font-medium">{customer.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {customer.companyName || customer.customerType} • {customer.contact}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Suppliers */}
            {searchResults.suppliers?.length > 0 && (
              <div className="p-2 border-b last:border-0">
                <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <Truck className="h-3 w-3" />
                  Suppliers
                </div>
                {searchResults.suppliers.map((supplier: any) => (
                  <button
                    key={supplier._id}
                    className="w-full text-left px-2 py-2 rounded hover:bg-muted transition-colors flex flex-col"
                    onClick={() => navigateToResult('supplier', supplier._id)}
                  >
                    <span className="text-sm font-medium">{supplier.companyName}</span>
                    <span className="text-xs text-muted-foreground">
                      ID: {supplier.supplierId} • {supplier.contactPerson}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isSearching && searchQuery &&
              (!searchResults.orders?.length && !searchResults.products?.length && !searchResults.customers?.length && !searchResults.suppliers?.length) && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No results found for "{searchQuery}"
                </div>
              )}
          </div>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4 ml-auto md:ml-0">
        {mounted && (
          <div className="hidden sm:flex flex-col items-end mr-2">
            <span className="text-sm font-medium">{userName}</span>
            <span className="text-xs text-muted-foreground capitalize">
              {userRole.replace("_", " ")}
            </span>
          </div>
        )}
        {/* User Avatar */}
        <div className="flex items-center gap-2 px-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm cursor-default">
              {mounted ? userInitials : "AD"}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Logout Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
          title="Log out"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};
