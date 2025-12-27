'use client';

import React, { useState } from 'react';
import { useBill } from '@/contexts/BillContext';
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeft, CalendarIcon, Download } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

type DateRange = {
  from: Date;
  to: Date;
};

export default function ReportsPage() {
  const { bills } = useBill();

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const filteredBills = bills.filter(bill => {
    if (!dateRange || !dateRange.from || !dateRange.to) return true;
    const billDate = new Date(bill.date);
    return isWithinInterval(billDate, { start: dateRange.from, end: dateRange.to });
  });

  const totalSales = filteredBills.reduce((sum, b) => sum + b.total_amount, 0);
  const totalReceived = filteredBills.reduce((sum, b) => sum + b.paid_amount, 0);
  const totalDue = totalSales - totalReceived;
  const billCount = filteredBills.length;

  // Aggregate Product Quantity Sold
  const productSalesMap = filteredBills.reduce((acc, bill) => {
    if (bill.items && Array.isArray(bill.items)) {
      bill.items.forEach(item => {
        const productName = item.product_name;
        if (!acc[productName]) {
          acc[productName] = { name: productName, quantity: 0 };
        }
        acc[productName].quantity += item.quantity;
      });
    }
    return acc;
  }, {} as Record<string, { name: string, quantity: number }>);

  const productChartData = Object.values(productSalesMap).sort((a, b) => b.quantity - a.quantity);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/bill-book">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Sales summary and analytics.</p>
        </div>
      </div>

      {/* Date Filter */}
      <div className="flex items-center gap-4">
         <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-[300px] justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={(range: any) => setDateRange(range)}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          <Button variant="outline" disabled>
             <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-muted-foreground">Total Bills</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{billCount}</div>
           </CardContent>
         </Card>
         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold text-blue-600">₹{totalSales.toFixed(2)}</div>
           </CardContent>
         </Card>
         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-muted-foreground">Total Received</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold text-green-600">₹{totalReceived.toFixed(2)}</div>
           </CardContent>
         </Card>
         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-muted-foreground">Total Due</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold text-red-600">₹{totalDue.toFixed(2)}</div>
           </CardContent>
         </Card>
      </div>

      {/* Charts */}
      <Card>
        <CardHeader>
          <CardTitle>Product Sales (Quantity)</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          {productChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productChartData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="quantity" name="Quantity Sold" fill="#2563eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
               No sales data for selected range.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
