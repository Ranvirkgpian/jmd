'use client';

import React from 'react';
import Link from 'next/link';
import {
  PlusCircle,
  CalendarDays,
  History,
  BookUser,
  BarChart4,
  Settings,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { motion } from 'framer-motion';

const menuItems = [
  {
    title: 'Create New Bill',
    description: 'Generate a new invoice for a customer',
    icon: PlusCircle,
    href: '/bill-book/new',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    title: "Today's Bills",
    description: 'View bills generated today',
    icon: CalendarDays,
    href: '/bill-book/today',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    title: 'All Bills / History',
    description: 'Search and manage past records',
    icon: History,
    href: '/bill-book/history',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  {
    title: 'Customer',
    description: 'Track dues and payments per customer',
    icon: BookUser,
    href: '/bill-book/customer',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    title: 'Product Reports',
    description: 'Sales summaries and analytics',
    icon: BarChart4,
    href: '/bill-book/product-reports',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
  },
  {
    title: 'Settings',
    description: 'Company details and configuration',
    icon: Settings,
    href: '/bill-book/settings',
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
  },
];

export default function BillBookPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-800">Bill Book Menu</h1>
        <p className="text-slate-500">Manage your invoices, customers, and business reports.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item, index) => (
          <Link key={item.href} href={item.href}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="h-full"
            >
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-slate-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className={`p-3 rounded-xl ${item.bgColor}`}>
                    <item.icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-xl mb-2">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
