
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
import { DatePicker } from '@/components/ui/datepicker';
import { Button } from '@/components/ui/button';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, startOfDay, endOfDay } from 'date-fns';
import { PackageSearch, Loader2, Filter, XCircle } from 'lucide-react';

interface MonthlyData {
  month: string; // e.g., "Jan 2023"
  totalGoodsGiven: number;
}

interface ProcessedChartData {
  data: MonthlyData[];
  label: string;
  description: string;
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
  const [filterStartDate, setFilterStartDate] = useState<Date | undefined>(undefined);
  const [filterEndDate, setFilterEndDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const processedChartData: ProcessedChartData = useMemo(() => {
    if (loadingTransactions || !isMounted) {
      return { 
        data: [], 
        label: "Monthly Goods Given Analysis", 
        description: "Loading graph data..." 
      };
    }

    let intervalStart: Date;
    let intervalEnd: Date;
    let chartLabel: string;
    let chartDescription: string;

    const now = new Date();

    if (filterStartDate && filterEndDate) {
        intervalStart = startOfMonth(filterStartDate);
        // Ensure intervalEnd captures the full last month of the selection for eachMonthOfInterval
        intervalEnd = startOfMonth(filterEndDate); 
        chartLabel = `Goods Given from ${format(filterStartDate, 'MMM yyyy')} to ${format(filterEndDate, 'MMM yyyy')}`;
        chartDescription = `Displaying total goods given per month for the selected period.`;
    } else {
        intervalStart = subMonths(startOfMonth(now), 11);
        intervalEnd = startOfMonth(now);
        chartLabel = "Goods Given Over Last 12 Months";
        chartDescription = "This chart displays the total value of goods given each month for the past year.";
    }
    
    const monthsInInterval = eachMonthOfInterval({
      start: intervalStart,
      end: intervalEnd,
    });

    const relevantTransactions = transactions.filter(transaction => {
        try {
            const transactionDate = parseISO(transaction.date);
            // Apply stricter filtering based on selected start/end days
            if (filterStartDate && transactionDate < startOfDay(filterStartDate)) return false;
            if (filterEndDate && transactionDate > endOfDay(filterEndDate)) return false;
            return true;
        } catch (error) {
            console.error("Error parsing transaction date for filtering:", transaction.date, error);
            return false;
        }
    });

    const dataByMonth: Record<string, number> = {};
    relevantTransactions.forEach(transaction => {
      try {
        const transactionDate = parseISO(transaction.date);
        const monthKey = format(transactionDate, 'MMM yyyy');
        dataByMonth[monthKey] = (dataByMonth[monthKey] || 0) + transaction.goodsGiven;
      } catch (error) {
        console.error("Error parsing transaction date for aggregation:", transaction.date, error);
      }
    });
    
    const chartData = monthsInInterval.map(monthDate => {
      const monthKey = format(monthDate, 'MMM yyyy');
      return {
        month: monthKey,
        totalGoodsGiven: dataByMonth[monthKey] || 0,
      };
    });

    return { data: chartData, label: chartLabel, description: chartDescription };

  }, [transactions, loadingTransactions, isMounted, filterStartDate, filterEndDate]);

  const clearFilters = () => {
    setFilterStartDate(undefined);
    setFilterEndDate(undefined);
  };

  if (!isMounted || loadingTransactions) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-muted-foreground">
        <Loader2 className="h-12 w-12 animate-spin mb-4 text-primary" />
        <p className="text-lg">Loading graph data...</p>
      </div>
    );
  }

  const hasData = processedChartData.data.some(d => d.totalGoodsGiven > 0);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-semibold tracking-tight">{processedChartData.label}</h2>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <Filter className="mr-2 h-5 w-5" /> Filter by Date Range
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 items-center">
          <DatePicker
            value={filterStartDate}
            onChange={setFilterStartDate}
            className="w-full sm:w-auto"
          />
          <span className="text-muted-foreground">to</span>
          <DatePicker
            value={filterEndDate}
            onChange={setFilterEndDate}
            disabled={(date) => !!filterStartDate && date < filterStartDate}
            className="w-full sm:w-auto"
          />
          <Button 
            onClick={clearFilters} 
            variant="ghost" 
            size="sm" 
            disabled={!filterStartDate && !filterEndDate}
            className="w-full sm:w-auto"
          >
            <XCircle className="mr-2 h-4 w-4" /> Clear Filters
          </Button>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>{processedChartData.label}</CardTitle>
          <CardDescription>
            {processedChartData.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasData ? (
            <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={processedChartData.data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    padding={{ left: 10, right: 10 }}
                    interval={processedChartData.data.length > 12 ? Math.floor(processedChartData.data.length / 12) : 0} // Adjust interval for many months
                  />
                  <YAxis
                    tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
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
                    barSize={Math.max(10, 40 - Math.max(0, processedChartData.data.length - 12) * 2)} // Dynamically adjust bar size
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
                {(filterStartDate || filterEndDate) 
                  ? "There are no transactions recorded for the selected period."
                  : "There are no transactions recorded in the last 12 months to display on the graph."
                }
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="leading-none text-muted-foreground">
            Showing total goods given per month. 
            {(filterStartDate && filterEndDate) 
              ? ` Currently displaying data from ${format(filterStartDate, 'MMM d, yyyy')} to ${format(filterEndDate, 'MMM d, yyyy')}.`
              : " Currently displaying data for the last 12 months."
            }
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

