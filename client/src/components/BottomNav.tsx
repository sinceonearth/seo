import { Link, useLocation } from "wouter";
import { User, Plane, Plus, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

export function BottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();

  const navItems = [
    { path: "/", icon: User, label: "Profile" },
    { path: "/trips", icon: Plane, label: "Trips" },
  ];

  if (user?.isAdmin) {
    navItems.push({ path: "/admin", icon: Shield, label: "Admin" });
  }

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 md:hidden">
      <div className="flex items-center gap-2 bg-card/95 backdrop-blur-sm border rounded-full shadow-lg px-4 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Link key={item.path} href={item.path}>
              <button
                data-testid={`nav-${item.label.toLowerCase()}`}
                className={cn(
                  "flex items-center justify-center p-3 rounded-full transition-colors",
                  isActive
                    ? "text-green-500 bg-green-500/20"
                    : "text-muted-foreground hover-elevate"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "fill-current")} />
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
