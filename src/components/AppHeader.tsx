
"use client";

import React from 'react';
import { Landmark } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';

export function AppHeader() {
  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-center relative">
        {/* SidebarTrigger positioned absolutely to the left, respecting container padding */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2"> {/* Changed left-4 to left-2 */}
          <SidebarTrigger className="text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground" />
        </div>

        {/* Logo and Title group */}
        <div className="flex items-center">
          <Landmark className="h-8 w-8 mr-3" />
          <h1 className="text-2xl font-bold tracking-tight">JMD ENTERPRISES</h1>
        </div>
      </div>
    </header>
  );
}

    