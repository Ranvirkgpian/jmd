
"use client";

import React, { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isVerified, setIsVerified] = useState(false); // Start as not verified

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    if (!isLoggedIn && pathname !== '/login') {
      router.push('/login');
    } else if (isLoggedIn && pathname === '/login') {
      router.push('/');
    } else {
      // If conditions met (logged in and not on login, or not logged in and on login)
      setIsVerified(true);
    }
  }, [pathname, router]);

  // Show loading or null while verification is in progress and conditions aren't met
  if (!isVerified) {
    // Optional: Display a loading spinner or a blank screen during redirect
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
