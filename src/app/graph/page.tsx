
"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import type { Transaction } from '@/lib/types';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { PackageSearch, Loader2 } from 'lucide-react';

interface MonthlyData {
  month: string; // e.g., "Jan 2023"
  totalGoodsGiven: number;
}

const chartConfig = {
  totalGoodsGiven: {
    label: 'Goods Given (₹)',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export default function GraphPage() {
  const { transactions, loadingTransactions } = useData();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const monthlyGoodsData: MonthlyData[] = useMemo(() => {
    if (loadingTransactions || !isMounted) return [];

    const now = new Date();
    // Get the interval for the last 12 months including the current month
    const last12Months = eachMonthOfInterval({
      start: subMonths(startOfMonth(now), 11),
      end: startOfMonth(now),
    });

    const dataByMonth: Record<string, number> = {};

    transactions.forEach(transaction => {
      try {
        const transactionDate = parseISO(transaction.date);
        const monthKey = format(transactionDate, 'MMM yyyy');
        dataByMonth[monthKey] = (dataByMonth[monthKey] || 0) + transaction.goodsGiven;
      } catch (error) {
        console.error("Error parsing transaction date:", transaction.date, error);
      }
    });
    
    return last12Months.map(monthDate => {
      const monthKey = format(monthDate, 'MMM yyyy');
      return {
        month: monthKey,
        totalGoodsGiven: dataByMonth[monthKey] || 0,
      };
    });

  }, [transactions, loadingTransactions, isMounted]);

  if (!isMounted || loadingTransactions) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-muted-foreground">
        <Loader2 className="h-12 w-12 animate-spin mb-4 text-primary" />
        <p className="text-lg">Loading graph data...</p>
      </div>
    );
  }

  const hasData = monthlyGoodsData.some(d => d.totalGoodsGiven > 0);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-semibold tracking-tight">Monthly Goods Given Analysis</h2>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Goods Given Over Last 12 Months</CardTitle>
          <CardDescription>
            This chart displays the total value of goods given each month for the past year.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasData ? (
            <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyGoodsData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    padding={{ left: 10, right: 10 }}
                  />
                  <YAxis
                    tickFormatter={(value) => `₹${value / 1000}k`}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    width={70}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar
                    dataKey="totalGoodsGiven"
                    fill="var(--color-totalGoodsGiven)"
                    radius={4}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mx-auto bg-secondary p-4 rounded-full w-fit mb-4">
                <PackageSearch className="h-12 w-12 text-muted-foreground" />
              </div>
              <p className="text-xl font-semibold">No Transaction Data Available</p>
              <p className="text-muted-foreground">
                There are no transactions recorded in the last 12 months to display on the graph.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="leading-none text-muted-foreground">
            Showing total goods given per month. Use the main report page for date-specific filtering.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
