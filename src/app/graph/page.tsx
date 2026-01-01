"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { supabase } from '@/lib/supabaseClient';
import {
  Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer,
  Line, LineChart, Tooltip, Legend
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DatePicker } from '@/components/ui/datepicker';
import { Button } from '@/components/ui/button';
import {
  format,
  parseISO,
  startOfDay,
  endOfDay,
  subMonths,
  startOfMonth,
  isWithinInterval,
  subDays,
  differenceInDays
} from 'date-fns';
import {
  Loader2,
  Filter,
  XCircle,
  DollarSign,
  ShoppingCart,
  Package,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';

// --- Types ---

interface ChartDataPoint {
  date: string; // formatted date string for axis
  fullDate: Date; // for sorting
  sales: number; // Goods Given
}

interface SummaryMetrics {
  totalSales: number;
  totalMoneyReceived: number;
  itemsSold: number;
  inventoryValue: number; // Placeholder
  inventoryCount: number; // Placeholder

  prevTotalSales: number;
  prevTotalMoneyReceived: number;
  prevItemsSold: number;
}

export default function GraphPage() {
  const { transactions, loadingTransactions, products, loadingProducts } = useData();
  const [isMounted, setIsMounted] = useState(false);

  // Date Filters
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Extra Data State
  const [billItemsCount, setBillItemsCount] = useState<number>(0);
  const [prevBillItemsCount, setPrevBillItemsCount] = useState<number>(0);
  const [loadingBillStats, setLoadingBillStats] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Default to last 3 months if no date selected
    if (!startDate && !endDate) {
        const now = new Date();
        setStartDate(subMonths(startOfMonth(now), 2)); // Start of 3 months ago
        setEndDate(endOfDay(now));
    }
  }, []);

  // --- Fetch Bill Items for "Items Sold" ---
  useEffect(() => {
    const fetchBillStats = async () => {
      if (!startDate || !endDate) return;
      setLoadingBillStats(true);

      try {
        // 1. Fetch Bills in range
        const { data: bills, error: billsError } = await supabase
          .from('bills')
          .select('id, date')
          .gte('date', startOfDay(startDate).toISOString())
          .lte('date', endOfDay(endDate).toISOString());

        if (billsError) throw billsError;

        const billIds = bills?.map(b => b.id) || [];

        let count = 0;
        if (billIds.length > 0) {
           const { data: items, error: itemsError } = await supabase
             .from('bill_items')
             .select('quantity')
             .in('bill_id', billIds);

           if (itemsError) throw itemsError;
           // Sum quantities
           count = items?.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0) || 0;
        }
        setBillItemsCount(count);

        // 2. Fetch Bills in PREVIOUS equivalent range for comparison
        const dayDiff = differenceInDays(endDate, startDate) + 1;
        const prevStart = subDays(startDate, dayDiff);
        const prevEnd = subDays(endDate, dayDiff);

        const { data: prevBills, error: prevBillsError } = await supabase
            .from('bills')
            .select('id')
            .gte('date', startOfDay(prevStart).toISOString())
            .lte('date', endOfDay(prevEnd).toISOString());

        if (prevBillsError) throw prevBillsError;

        const prevBillIds = prevBills?.map(b => b.id) || [];
        let prevCount = 0;
        if (prevBillIds.length > 0) {
            const { data: prevItems, error: prevItemsError } = await supabase
                .from('bill_items')
                .select('quantity')
                .in('bill_id', prevBillIds);

            if (prevItemsError) throw prevItemsError;
            prevCount = prevItems?.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0) || 0;
        }
        setPrevBillItemsCount(prevCount);

      } catch (err) {
        console.error("Error fetching bill stats:", err);
      } finally {
        setLoadingBillStats(false);
      }
    };

    fetchBillStats();
  }, [startDate, endDate]);

  // --- Calculate Metrics ---
  const metrics: SummaryMetrics = useMemo(() => {
    if (loadingTransactions || !startDate || !endDate) {
      return {
        totalSales: 0, totalMoneyReceived: 0, itemsSold: 0, inventoryValue: 0, inventoryCount: 0,
        prevTotalSales: 0, prevTotalMoneyReceived: 0, prevItemsSold: 0
      };
    }

    const start = startOfDay(startDate);
    const end = endOfDay(endDate);

    // Comparison Range
    const dayDiff = differenceInDays(endDate, startDate) + 1;
    const prevStart = subDays(startDate, dayDiff);
    const prevEnd = subDays(endDate, dayDiff);

    let totalSales = 0;
    let totalMoneyReceived = 0;
    let prevTotalSales = 0;
    let prevTotalMoneyReceived = 0;

    transactions.forEach(t => {
      const tDate = parseISO(t.date);
      // Current Range
      if (isWithinInterval(tDate, { start, end })) {
        totalSales += t.goodsGiven;
        totalMoneyReceived += t.moneyReceived;
      }
      // Previous Range
      if (isWithinInterval(tDate, { start: prevStart, end: prevEnd })) {
         prevTotalSales += t.goodsGiven;
         prevTotalMoneyReceived += t.moneyReceived;
      }
    });

    // Inventory (Static, no history tracking usually)
    // NOTE: Product table currently lacks 'quantity'.
    // Assuming 0 if missing to avoid crashes, or sum if strictly required.
    // Logic: Sum of (cost_price * 0) since quantity is missing.
    // If user insists on Inventory Value, we need quantity.
    // For now, I will count distinct products as "Inventory On Hand" count?
    // Or just 0.
    const inventoryCount = products.length;
    const inventoryValue = 0; // Cannot calculate without quantity

    return {
      totalSales,
      totalMoneyReceived,
      itemsSold: billItemsCount,
      inventoryValue,
      inventoryCount,
      prevTotalSales,
      prevTotalMoneyReceived,
      prevItemsSold: prevBillItemsCount
    };
  }, [transactions, loadingTransactions, startDate, endDate, products, billItemsCount, prevBillItemsCount]);

  // --- Prepare Chart Data ---
  const chartData: ChartDataPoint[] = useMemo(() => {
    if (loadingTransactions || !startDate || !endDate) return [];

    const start = startOfDay(startDate);
    const end = endOfDay(endDate);
    const dataMap: Record<string, number> = {};

    transactions.forEach(t => {
        const tDate = parseISO(t.date);
        if (isWithinInterval(tDate, { start, end })) {
            // Group by Day
            const key = format(tDate, 'yyyy-MM-dd');
            dataMap[key] = (dataMap[key] || 0) + t.goodsGiven;
        }
    });

    // Fill gaps? Or just show days with activity?
    // For a cleaner graph over 3 months, maybe group by Week or Month if range is large?
    // Let's stick to daily but maybe sort properly.
    // Actually, if range is > 32 days, maybe group by Month?
    const days = differenceInDays(end, start);

    let result: ChartDataPoint[] = [];

    if (days > 60) {
        // Group by Month
        const monthlyData: Record<string, number> = {};
        transactions.forEach(t => {
            const tDate = parseISO(t.date);
            if (isWithinInterval(tDate, { start, end })) {
                const key = format(tDate, 'MMM yyyy');
                monthlyData[key] = (monthlyData[key] || 0) + t.goodsGiven;
            }
        });
        // We need to order them.
        // Quick hack: rely on iteration order if sorted keys? No.
        // Better: Iterate through months in interval.
        // (Simplified for now: Just keys)
        // Let's use the previous logic's style for mapping
        // But for this "Upgrade", let's keep it simple: Map available data points.
         result = Object.entries(monthlyData).map(([key, val]) => ({
            date: key,
            fullDate: parseISO(Object.keys(dataMap).find(k => format(parseISO(k), 'MMM yyyy') === key) || new Date().toISOString()), // Approximate for sort
            sales: val
        }));
         // This is a bit messy for sorting months.
         // Let's just default to Daily for < 90 days, or list all relevant transactions.
         // Actually, let's just map the aggregations cleanly.
    }

    // Default: Daily Aggregation sorted
    result = Object.entries(dataMap).map(([dateStr, val]) => ({
        date: format(parseISO(dateStr), 'MMM dd'),
        fullDate: parseISO(dateStr),
        sales: val
    })).sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime());

    return result;
  }, [transactions, loadingTransactions, startDate, endDate]);


  const clearFilters = () => {
    // Reset to default 3 months
    const now = new Date();
    setStartDate(subMonths(startOfMonth(now), 2));
    setEndDate(endOfDay(now));
  };

  // Helper to calculate percentage change
  const calcChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  if (!isMounted || loadingTransactions || loadingProducts) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />
        <p className="text-base font-medium">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6 max-w-[1600px] mx-auto p-4 md:p-6">

      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
           <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
           <p className="text-muted-foreground">Overview of your business performance.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 items-center bg-card p-2 rounded-lg border shadow-sm">
             <div className="flex items-center gap-2 w-full sm:w-auto">
                 <Filter className="h-4 w-4 text-muted-foreground" />
                 <DatePicker
                  value={startDate}
                  onChange={setStartDate}
                  placeholder="Start Date"
                  className="w-[140px]"
                />
             </div>
             <span className="text-muted-foreground text-xs hidden sm:inline">-</span>
             <div className="w-full sm:w-auto">
                <DatePicker
                  value={endDate}
                  onChange={setEndDate}
                  placeholder="End Date"
                  className="w-[140px]"
                />
             </div>
             {/* <Button variant="ghost" size="icon" onClick={clearFilters} title="Reset to last 3 months">
                <XCircle className="h-4 w-4" />
             </Button> */}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">

        {/* Left Column: Summary Cards (30%) */}
        <div className="w-full lg:w-[30%] space-y-4">

            {/* Sales Card */}
            <SummaryCard
                title="Sales"
                value={`₹${metrics.totalSales.toLocaleString()}`}
                change={calcChange(metrics.totalSales, metrics.prevTotalSales)}
                icon={<DollarSign className="h-5 w-5 text-blue-600" />}
                subtext={`Previous: ₹${metrics.prevTotalSales.toLocaleString()}`}
            />

            {/* Money Received Card */}
            <SummaryCard
                title="Money Received"
                value={`₹${metrics.totalMoneyReceived.toLocaleString()}`}
                change={calcChange(metrics.totalMoneyReceived, metrics.prevTotalMoneyReceived)}
                icon={<CreditCard className="h-5 w-5 text-green-600" />}
                subtext={`Previous: ₹${metrics.prevTotalMoneyReceived.toLocaleString()}`}
            />

            {/* Items Sold Card */}
            <SummaryCard
                title="Items Sold"
                value={loadingBillStats ? "..." : metrics.itemsSold.toLocaleString()}
                change={calcChange(metrics.itemsSold, metrics.prevItemsSold)}
                icon={<ShoppingCart className="h-5 w-5 text-purple-600" />}
                subtext={`Previous: ${metrics.prevItemsSold}`}
            />

            {/* Inventory On Hand (Count of Products) */}
            <SummaryCard
                title="Products (Types)"
                value={metrics.inventoryCount.toLocaleString()}
                icon={<Package className="h-5 w-5 text-orange-600" />}
                subtext="Total active product types"
                change={0} // No history for static product count
                hideChange
            />

             {/* Inventory Value (Placeholder) */}
             <SummaryCard
                title="Inventory Value"
                value="N/A"
                icon={<Activity className="h-5 w-5 text-gray-600" />}
                subtext="Requires quantity tracking"
                change={0}
                hideChange
            />

        </div>

        {/* Right Column: Charts (70%) */}
        <div className="w-full lg:w-[70%] space-y-6">

            {/* Sales Over Time (Line) */}
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>Sales Over Time</CardTitle>
                    <CardDescription>Daily sales performance for the selected period.</CardDescription>
                </CardHeader>
                <CardContent className="pl-0">
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    minTickGap={30}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Sales']}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="sales"
                                    stroke="#2563eb"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

             {/* Sales Over Time (Bar) */}
             <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>Sales Volume</CardTitle>
                    <CardDescription>Comparative view of sales volume.</CardDescription>
                </CardHeader>
                <CardContent className="pl-0">
                    <div className="h-[300px] w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    minTickGap={30}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f3f4f6' }}
                                    contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Sales']}
                                />
                                <Bar
                                    dataKey="sales"
                                    fill="#3b82f6"
                                    radius={[4, 4, 0, 0]}
                                    barSize={30}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

        </div>

      </div>
    </div>
  );
}

// Sub-component for uniform Cards
function SummaryCard({ title, value, change, icon, subtext, hideChange }: {
    title: string, value: string, change: number, icon: React.ReactNode, subtext?: string, hideChange?: boolean
}) {
    const isPositive = change >= 0;

    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
                        <h3 className="text-2xl font-bold">{value}</h3>
                    </div>
                    <div className="p-2 bg-muted/20 rounded-full">
                        {icon}
                    </div>
                </div>

                <div className="mt-4 flex items-center text-xs">
                    {!hideChange && (
                        <span className={`flex items-center font-medium ${isPositive ? 'text-green-600' : 'text-red-600'} mr-2`}>
                            {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                            {Math.abs(change).toFixed(1)}%
                        </span>
                    )}
                    <span className="text-muted-foreground">{subtext}</span>
                </div>
            </CardContent>
        </Card>
    );
}
