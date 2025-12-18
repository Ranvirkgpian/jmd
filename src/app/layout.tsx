"use client";

import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { DataProvider } from '@/contexts/DataContext';
import { AppHeader } from '@/components/AppHeader';
import { Toaster } from "@/components/ui/toaster";
import { AuthGuard } from '@/components/AuthGuard';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  useEffect(() => {
    document.title = 'JMD Enterprises';
  }, []);

  // Determine if we should show the full layout (Header + AuthGuard) or just children (Login page usually handles its own layout, but here we wrap everything in AuthGuard except public routes if any, though AuthGuard handles redirection)
  // Actually, AuthGuard renders children only if authenticated (or if it's the login page, typically handled inside AuthGuard or by route protection).
  // Looking at previous code, AuthGuard wraps the main content.
  // The SidebarProvider is removed as we are moving to a top navbar layout.

  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans bg-background text-foreground min-h-screen flex flex-col`} suppressHydrationWarning={true}>
        <DataProvider>
          <AuthGuard>
            <AppHeader />
            <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="h-full"
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </main>
            <Toaster />
          </AuthGuard>
        </DataProvider>
      </body>
    </html>
  );
}
