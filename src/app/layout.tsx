
import type {Metadata} from 'next';
import Link from 'next/link';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import { DataProvider } from '@/contexts/DataContext';
import { AppHeader } from '@/components/AppHeader';
import { Toaster } from "@/components/ui/toaster";
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarInset, 
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from '@/components/ui/sidebar';
import { Landmark, Home as HomeIcon, FileText as FileTextIcon } from 'lucide-react';


const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'JMD Enterprises',
  description: 'Shopkeeper Transaction Management App',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
              <SidebarContent>
                <SidebarMenu>
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
                       {/* You can update this href later when the reports page is ready */}
                      <SidebarMenuButton asChild>
                        <a>
                          <FileTextIcon />
                          Transaction report
                        </a>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarContent>
            </Sidebar>
            <SidebarInset>
              <AppHeader />
              <main className="container mx-auto p-4">
                {children}
              </main>
              <Toaster />
            </SidebarInset>
          </SidebarProvider>
        </DataProvider>
      </body>
    </html>
  );
}
