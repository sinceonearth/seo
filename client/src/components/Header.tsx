"use client";

import { LogOut } from "lucide-react";
import { Icon } from "lucide-react";
import { faceAlien } from "@lucide/lab";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

export function Header() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { path: "/", label: "Profile" },
    { path: "/trips", label: "Trips" },
  ];

  if (user?.is_admin) {
    navItems.push({ path: "/admin", label: "Admin" });
  }

  return (
    <header className="fixed top-0 left-0 z-50 w-full border-b border-white/0 bg-transparent">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        {/* 👽 Left Section: Alien icon + Welcome capsule */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-green-500/30 hover:border-green-500/60 transition-all duration-300">
              <Icon iconNode={faceAlien} className="h-6 w-6 text-green-400" />
            </div>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center"
          >
            <div className="px-4 py-1.5 rounded-full bg-green-500/20 text-green-400 font-semibold text-sm border border-green-500/40 shadow-sm flex items-center gap-1.5">
              <span>alien #{user?.alien ?? "—"}</span>
            </div>
          </motion.div>
        </div>



        {/* 🚪 Logout */}
        <Button
          variant="ghost"
          size="icon"
          onClick={logout}
          className="text-white/80 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="h-6 w-6" />
        </Button>
      </div>
    </header>
  );
}
