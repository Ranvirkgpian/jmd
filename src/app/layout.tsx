
"use client"; // Make RootLayout a client component for logout logic

import type { Metadata } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Import useRouter
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
import { Landmark, Home as HomeIcon, FileText as FileTextIcon, LogOut } from 'lucide-react';
import { useEffect } from 'react'; // Ensure useEffect is imported


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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();

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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}>
        <DataProvider>
          <SidebarProvider>
            <Sidebar>
              <SidebarHeader className="p-4">
                <div className="flex items-center gap-2">
                  <Landmark className="h-6 w-6 text-primary" />
                  <h2 className="text-lg font-semibold">JMD Enterprises</h2>
                </div>
              </SidebarHeader>
              <SidebarContent className="flex flex-col">
                <SidebarMenu className="flex-grow">
                  <SidebarMenuItem>
                    <Link href="/" legacyBehavior passHref>
                      <SidebarMenuButton asChild>
                        <a>
                          <HomeIcon />
                          Home
                        </a>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <Link href="/reports" legacyBehavior passHref>
                      <SidebarMenuButton asChild>
                        <a>
                          <FileTextIcon />
                          Transaction report
                        </a>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                </SidebarMenu>
                <SidebarFooter className="p-2 mt-auto border-t border-sidebar-border">
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={handleLogout} className="w-full">
                        <LogOut />
                        Logout
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarFooter>
              </SidebarContent>
            </Sidebar>
            <AuthGuard> {/* Wrap protected content with AuthGuard */}
              <SidebarInset>
                <AppHeader />
                <main className="container mx-auto p-4">
                  {children}
                </main>
                <Toaster />
              </SidebarInset>
            </AuthGuard>
          </SidebarProvider>
        </DataProvider>
      </body>
    </html>
  );
}
