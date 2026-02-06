"use client";

import { useState, useEffect } from "react";
import { LogOut, Search, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { toast } from "sonner";

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  let router: any = null;
  try {
    router = useRouter();
  } catch (e) {
    // Falls through to window.location fallback in functions
  }
  const [mounted, setMounted] = useState(false);

  const userName = Cookies.get("user_name") || "Admin User";
  const userRole = Cookies.get("user_role") || "User";
  const userInitials = userName.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    Cookies.remove("auth_token", { path: '/' });
    Cookies.remove("user_role", { path: '/' });
    Cookies.remove("user_name", { path: '/' });
    toast.success("Logged out successfully");

    // Safely attempt redirection
    try {
      if (router) {
        router.push("/login");
      } else {
        window.location.href = "/login";
      }
    } catch (e) {
      window.location.href = "/login";
    }
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
      <div className="relative w-full max-w-md hidden md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search products, orders, customers..."
          className="pl-10 bg-background"
        />
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
