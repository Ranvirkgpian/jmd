
"use client"; // Make AppHeader a client component for logout logic and conditional rendering

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Landmark, LogOut } from 'lucide-react'; // Removed Menu, X
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export function AppHeader() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  // Removed isMobileMenuOpen state

  useEffect(() => {
    setIsMounted(true);
    setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    // setIsMobileMenuOpen(false); // No longer needed
    router.push('/login');
    router.refresh();
  };

  // Avoid rendering different content on server and client during initial mount
  if (!isMounted) {
    return (
      <header className="bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-center relative">
          <div className="flex items-center">
            <Landmark className="h-8 w-8 mr-3" />
            <h1 className="text-2xl font-bold tracking-tight">JMD ENTERPRISES</h1>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-50">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 py-4 flex items-center justify-center relative"
      >
        {/* Sidebar Trigger - Positioned to the top-left */}
        {isLoggedIn && (
          <div className="absolute left-4 top-4">
            <SidebarTrigger className="text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground transition-colors duration-200" />
          </div>
        )}

        {/* Logo and Title - Centered by parent's justify-center */}
        <motion.div
          className="flex items-center"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <Landmark className="h-8 w-8 mr-3" />
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">JMD ENTERPRISES</h1>
        </motion.div>

        {/* Logout Button - Positioned to the right, vertically centered */}
        {isLoggedIn && (
          <div className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground transition-all duration-200 transform hover:scale-105"
              aria-label="Logout"
            >
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
        )}

        {/* Mobile menu button - REMOVED
        {isLoggedIn && (
          <div className="md:hidden absolute right-4 top-1/2 -translate-y-1/2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-primary-foreground p-2"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        )}
        */}
      </motion.div>

      {/* Mobile menu - REMOVED
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-primary border-t border-primary-foreground/10"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
              <div className="flex items-center justify-center">
                <SidebarTrigger
                  className="text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground transition-all duration-200"
                aria-label="Logout"
              >
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      */}
    </header>
  );
}
