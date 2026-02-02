import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface NavLinkProps {
  to: string;
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

export const NavLink = ({ to, icon: Icon, children, className }: NavLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === to;

  return (
    <Link
      href={to}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:text-primary",
        isActive
          ? "bg-muted text-primary"
          : "text-muted-foreground",
        className
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
};
