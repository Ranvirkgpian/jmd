"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Landmark, Menu, X, LogOut, Home, FileText, BarChart3, Receipt, Package, Trash2, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Initial check
    setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
  }, []);

  // Listen for route changes or storage events to update login state
  useEffect(() => {
    setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    setIsMobileMenuOpen(false);
    setIsLoggedIn(false); // Force state update immediately
    router.push('/login');
    router.refresh();
  };

  const navLinks = [
    { href: '/', label: 'Home Section', icon: Home },
    { href: '/shopkeepers', label: "Shopkeepers's details", icon: Store },
    { href: '/products', label: 'Products', icon: Package },
    { href: '/transaction-summary', label: 'Summary', icon: Receipt },
    { href: '/reports', label: 'Transactions', icon: FileText },
    { href: '/graph', label: 'Graph', icon: BarChart3 },
     { href: '/recycle-bin', label: 'Recycle Bin', icon: Trash2 }, 
  ];

  if (!isMounted) {
    return (
      <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-50">
         <div className="container mx-auto px-4 h-16 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <Landmark className="h-6 w-6" />
             <span className="text-xl font-bold tracking-tight">JMD ENTERPRISES</span>
           </div>
         </div>
      </header>
    );
  }

  // If not logged in, just show simple header or nothing depending on design choice.
  // Assuming simple header for consistency
  if (!isLoggedIn) {
     return (
      <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-50">
         <div className="container mx-auto px-4 h-16 flex items-center justify-center">
           <div className="flex items-center gap-2">
             <Landmark className="h-6 w-6" />
             <span className="text-xl font-bold tracking-tight">JMD ENTERPRISES</span>
           </div>
         </div>
      </header>
    );
  }

  return (
    <header className="bg-primary text-primary-foreground shadow-lg sticky top-0 z-50 border-b border-primary/20">
      <div className="container mx-auto px-4">
        <div className="h-16 flex items-center justify-between">

          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105 active:scale-95">
            <div className="bg-white/10 p-1.5 rounded-lg backdrop-blur-sm">
              <Landmark className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold tracking-tight hidden sm:block">JMD ENTERPRISES</span>
            <span className="text-xl font-bold tracking-tight sm:hidden">JMD</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link key={link.href} href={link.href}>
                  <Button
                    variant="ghost"
                    className={`
                      relative px-4 py-2 h-10 text-primary-foreground hover:bg-white/10 hover:text-white transition-all
                      ${isActive ? 'bg-white/20 font-semibold shadow-inner' : 'opacity-80 hover:opacity-100'}
                    `}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {link.label}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-t-full"
                        initial={false}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Logout Button (Desktop) */}
          <div className="hidden md:block pl-4 border-l border-white/20">
             <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-primary-foreground hover:bg-red-500/20 hover:text-white transition-colors"
            >
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-primary-foreground hover:bg-white/10"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/10 overflow-hidden bg-primary/95 backdrop-blur-md"
          >
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => {
                 const Icon = link.icon;
                 const isActive = pathname === link.href;
                 return (
                  <Link key={link.href} href={link.href} onClick={() => setIsMobileMenuOpen(false)}>
                    <div className={`
                      flex items-center p-3 rounded-lg transition-colors
                      ${isActive ? 'bg-white/20 font-semibold text-white' : 'text-primary-foreground/80 hover:bg-white/10 hover:text-white'}
                    `}>
                      <Icon className="mr-3 h-5 w-5" />
                      {link.label}
                    </div>
                  </Link>
                 )
              })}
              <div className="h-px bg-white/10 my-2" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center p-3 rounded-lg text-primary-foreground/80 hover:bg-red-500/20 hover:text-white transition-colors text-left"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
