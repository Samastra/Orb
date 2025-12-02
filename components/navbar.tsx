"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Zap, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

const Navbar = () => {
  const { isSignedIn } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <motion.nav
        initial={{ y: -20, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={cn(
          "pointer-events-auto flex items-center justify-between",
          "bg-white/80 backdrop-blur-xl border border-gray-200/50", // Light mode glass
          "rounded-full px-6 py-3 shadow-lg shadow-gray-200/20",
          "w-full max-w-5xl"
        )}
      >
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-8 h-8 group-hover:scale-110 transition-transform duration-300">
             {/* Using your uploaded file */}
             <Image 
               src="/Asset1.png" 
               alt="Orblin Logo" 
               fill 
               className="object-contain"
             />
          </div>
          <span className="font-bold text-lg tracking-tight text-gray-900 group-hover:text-blue-600 transition-colors">
            Orblin
          </span>
        </Link>

        {/* Desktop Nav - Restored your links, removed Pricing/Help */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/features"
            className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors relative group"
          >
            Features
          </Link>
          <Link
            href="/contact"
            className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors relative group"
          >
            Contact
          </Link>
        </div>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-4">
          <Link href={isSignedIn ? "/boards" : "/sign-in"}>
            <span className="text-sm font-medium text-gray-600 hover:text-black transition-colors px-2">
              {isSignedIn ? "Dashboard" : "Log in"}
            </span>
          </Link>
          <Link href={isSignedIn ? "/boards" : "/sign-up"}>
            <Button
              className={cn(
                "rounded-full px-5 h-9 text-xs font-semibold",
                "bg-gray-900 text-white hover:bg-gray-800 transition-all", // Dark button on light bg
                "shadow-lg shadow-gray-900/10"
              )}
            >
              Start Thinking <Zap className="w-3 h-3 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden text-gray-600"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </motion.nav>
    </header>
  );
};

export default Navbar;