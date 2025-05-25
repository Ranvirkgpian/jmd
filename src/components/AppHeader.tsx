
"use client"; // Make AppHeader a client component for logout logic and conditional rendering

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Landmark, LogOut } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

export function AppHeader() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    router.push('/login');
    router.refresh();
  };

  // Avoid rendering different content on server and client during initial mount
  if (!isMounted) {
    // Render a placeholder or consistent structure during mount
    return (
      <header className="bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-center relative">
          <div className="absolute left-2 top-1/2 -translate-y-1/2">
            {/* SidebarTrigger can be here but won't be functional until client-side hydration */}
          </div>
          <div className="flex items-center">
            <Landmark className="h-8 w-8 mr-3" />
            <h1 className="text-2xl font-bold tracking-tight">JMD ENTERPRISES</h1>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-center relative">
        {/* SidebarTrigger only if logged in and not on login page */}
        {isLoggedIn && (
          <div className="absolute left-2 top-1/2 -translate-y-1/2">
            <SidebarTrigger className="text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground" />
          </div>
        )}
        
        <div className="flex items-center">
          <Landmark className="h-8 w-8 mr-3" />
          <h1 className="text-2xl font-bold tracking-tight">JMD ENTERPRISES</h1>
        </div>

        {isLoggedIn && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground"
              aria-label="Logout"
            >
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
