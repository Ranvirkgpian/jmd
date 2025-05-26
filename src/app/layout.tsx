"use client"; // Make RootLayout a client component for logout logic

import type { Metadata } from 'next';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation'; // Import useRouter and usePathname
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { DataProvider } from '@/contexts/DataContext';
import { AppHeader } from '@/components/AppHeader';
import { Toaster } from "@/components/ui/toaster";
import { AuthGuard } from '@/components/AuthGuard'; // Import AuthGuard
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarInset, 
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter
} from '@/components/ui/sidebar';
import { Landmark, Home as HomeIcon, FileText as FileTextIcon, LogOut, BarChart3 } from 'lucide-react'; // Added BarChart3
import { useEffect } from 'react'; // Ensure useEffect is imported
import { motion, AnimatePresence } from 'framer-motion';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// export const metadata: Metadata = { // Metadata needs to be handled differently for client components or moved
//   title: 'JMD Enterprises',
//   description: 'Shopkeeper Transaction Management App',
// };

const sidebarAnimation = {
  hidden: { x: -20, opacity: 0 },
  visible: { x: 0, opacity: 1 }
};

const contentAnimation = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    router.push('/login');
    router.refresh(); // Force a refresh to ensure state is cleared everywhere
  };
  
  // Set document title using useEffect for client components
  useEffect(() => {
    document.title = 'JMD Enterprises';
  }, []);

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans bg-background text-foreground`}>
        <DataProvider>
          <SidebarProvider>
            <Sidebar className="border-r border-border/50 bg-background/95 backdrop-blur-sm">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={sidebarAnimation}
                transition={{ duration: 0.3 }}
              >
                <SidebarHeader className="p-6">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="flex items-center gap-3"
                  >
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <Landmark className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                      JMD Enterprises
                    </h2>
                  </motion.div>
                </SidebarHeader>
                <SidebarContent className="flex flex-col px-3">
                  <SidebarMenu className="flex-grow space-y-1">
                    <motion.div variants={sidebarAnimation} transition={{ delay: 0.3 }}>
                      <SidebarMenuItem>
                        <Link href="/" legacyBehavior passHref>
                          <SidebarMenuButton asChild className="transition-colors hover:bg-primary/10 hover:text-primary">
                            <a className="flex items-center gap-3 px-3 py-2 rounded-lg">
                              <HomeIcon className="h-5 w-5" />
                              <span>Home</span>
                            </a>
                          </SidebarMenuButton>
                        </Link>
                      </SidebarMenuItem>
                    </motion.div>
                    <motion.div variants={sidebarAnimation} transition={{ delay: 0.4 }}>
                      <SidebarMenuItem>
                        <Link href="/reports" legacyBehavior passHref>
                          <SidebarMenuButton asChild className="transition-colors hover:bg-primary/10 hover:text-primary">
                            <a className="flex items-center gap-3 px-3 py-2 rounded-lg">
                              <FileTextIcon className="h-5 w-5" />
                              <span>Transaction Report</span>
                            </a>
                          </SidebarMenuButton>
                        </Link>
                      </SidebarMenuItem>
                    </motion.div>
                    <motion.div variants={sidebarAnimation} transition={{ delay: 0.5 }}>
                      <SidebarMenuItem>
                        <Link href="/graph" legacyBehavior passHref>
                          <SidebarMenuButton asChild className="transition-colors hover:bg-primary/10 hover:text-primary">
                            <a className="flex items-center gap-3 px-3 py-2 rounded-lg">
                              <BarChart3 className="h-5 w-5" />
                              <span>Graph</span>
                            </a>
                          </SidebarMenuButton>
                        </Link>
                      </SidebarMenuItem>
                    </motion.div>
                  </SidebarMenu>
                  <SidebarFooter className="p-3 mt-auto border-t border-border/50">
                    <SidebarMenu>
                      <motion.div variants={sidebarAnimation} transition={{ delay: 0.6 }}>
                        <SidebarMenuItem>
                          <SidebarMenuButton 
                            onClick={handleLogout} 
                            className="w-full transition-colors hover:bg-destructive/10 hover:text-destructive flex items-center gap-3 px-3 py-2 rounded-lg"
                          >
                            <LogOut className="h-5 w-5" />
                            <span>Logout</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </motion.div>
                    </SidebarMenu>
                  </SidebarFooter>
                </SidebarContent>
              </motion.div>
            </Sidebar>
            <AuthGuard> {/* Wrap protected content with AuthGuard */}
              <SidebarInset>
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={contentAnimation}
                  transition={{ duration: 0.3 }}
                >
                  <AppHeader />
                  <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={pathname}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        {children}
                      </motion.div>
                    </AnimatePresence>
                  </main>
                </motion.div>
                <Toaster />
              </SidebarInset>
            </AuthGuard>
          </SidebarProvider>
        </DataProvider>
      </body>
    </html>
  );
}