"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Truck,
  Warehouse,
  ClipboardList,
  Tags,
  PlusCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { Sheet, SheetContent, SheetClose } from "@/components/ui/sheet";
import { X } from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Package, label: "Product Catalog", path: "/product-catalog" },
  { icon: Tags, label: "Manage Products", path: "/products" },
  { icon: Warehouse, label: "Inventory", path: "/inventory" },
  { icon: PlusCircle, label: "Create Order", path: "/create-order" },
  { icon: ShoppingCart, label: "Orders", path: "/orders" },
  { icon: Truck, label: "Suppliers", path: "/suppliers" },
  { icon: Users, label: "Customers", path: "/customers" },
  { icon: ClipboardList, label: "Purchase Orders", path: "/purchase-orders" },
  { icon: FileText, label: "Reports", path: "/reports" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const SidebarNav = ({
  collapsed,
  pathname,
  onItemClick,
}: {
  collapsed: boolean;
  pathname: string;
  onItemClick?: () => void;
}) => (
  <nav className="mt-4 px-2">
    <ul className="space-y-1">
      {menuItems.map((item) => {
        const isActive = pathname === item.path;
        return (
          <li key={item.path}>
            <Link
              href={item.path}
              onClick={onItemClick}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5 flex-shrink-0")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  </nav>
);

export const Sidebar = ({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: SidebarProps) => {
  const pathname = usePathname() || "";

  const SidebarContent = () => (
    <>
      <div className="flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">VM</span>
          </div>
          {!collapsed && (
            <span className="text-lg font-semibold text-primary">Vasantha Metal Industry</span>
          )}
        </Link>
      </div>

      <SidebarNav
        collapsed={collapsed}
        pathname={pathname}
        onItemClick={onMobileClose}
      />
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 hidden h-screen bg-sidebar transition-all duration-300 md:block border-r",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent />

        {/* Toggle Button */}
        <button
          onClick={onToggle}
          className="absolute -right-3 top-5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={onMobileClose}>
        <SheetContent
          side="left"
          className="w-[300px] p-0 bg-sidebar border-r [&>button]:hidden"
        >
          <div className="absolute right-4 top-4 z-50">
            <SheetClose className="flex h-8 w-8 items-center justify-center rounded-sm text-white opacity-70 transition-opacity hover:opacity-100 focus:outline-none">
              <X className="h-5 w-5" />
              <span className="sr-only">Close sidebar</span>
            </SheetClose>
          </div>
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  );
};
