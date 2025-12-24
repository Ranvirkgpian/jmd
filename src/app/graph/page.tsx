"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import {
  Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer,
  Line, LineChart, Pie, PieChart, Cell
} from 'recharts';
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
import { format, parseISO, startOfMonth, eachMonthOfInterval, subMonths, startOfDay, endOfDay } from 'date-fns';
import { PackageSearch, Loader2, Filter, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface MonthlyData {
  month: string;
  totalGoodsGiven: number;
  fill?: string;
}

interface ProcessedChartData {
  data: MonthlyData[];
  label: string;
  description: string;
  pieConfig: ChartConfig;
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
        description: "Loading graph data...",
        pieConfig: {}
      };
    }

    let intervalStart: Date;
    let intervalEnd: Date;
    let chartLabel: string;
    let chartDescription: string;

    const now = new Date();

    if (filterStartDate && filterEndDate) {
        intervalStart = startOfMonth(filterStartDate);
        intervalEnd = startOfMonth(filterEndDate); 
        chartLabel = `Goods Given from ${format(filterStartDate, 'MMM yyyy')} to ${format(filterEndDate, 'MMM yyyy')}`;
        chartDescription = `Displaying total goods given per month for the selected period.`;
    } else {
        intervalStart = subMonths(startOfMonth(now), 2);
        intervalEnd = startOfMonth(now);
        chartLabel = "Goods Given Over Last 3 Months";
        chartDescription = "This chart displays the total value of goods given each month for the past 3 months.";
    }
    
    let monthsInInterval: Date[] = [];
    try {
        monthsInInterval = eachMonthOfInterval({
        start: intervalStart,
        end: intervalEnd,
      });
    } catch (e) {
      // Fallback if dates are invalid relative to each other
       monthsInInterval = [];
    }

    const relevantTransactions = transactions.filter(transaction => {
        try {
            const transactionDate = parseISO(transaction.date);
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
    
    const pieConfig: ChartConfig = {
      totalGoodsGiven: {
        label: "Goods Given",
      },
    };

    const chartData = monthsInInterval.map((monthDate, index) => {
      const monthKey = format(monthDate, 'MMM yyyy');
      const colorVar = `hsl(var(--chart-${(index % 5) + 1}))`;

      // Populate pieConfig dynamically
      pieConfig[monthKey] = {
        label: monthKey,
        color: colorVar,
      };

      return {
        month: monthKey,
        totalGoodsGiven: dataByMonth[monthKey] || 0,
        fill: colorVar,
      };
    });

    return { data: chartData, label: chartLabel, description: chartDescription, pieConfig };

  }, [transactions, loadingTransactions, isMounted, filterStartDate, filterEndDate]);

  const clearFilters = () => {
    setFilterStartDate(undefined);
    setFilterEndDate(undefined);
  };

  if (!isMounted || loadingTransactions) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />
        <p className="text-base font-medium">Loading graph data...</p>
      </div>
    );
  }

  const hasData = processedChartData.data.some(d => d.totalGoodsGiven > 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2 border-b border-border/40 pb-6">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">{processedChartData.label}</h2>
        <p className="text-muted-foreground">Visualize transaction trends and goods distribution over time.</p>
      </div>

      <Card className="shadow-sm border-border/60 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center font-medium">
            <Filter className="mr-2 h-4 w-4 text-primary" /> Filter by Date Range
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="w-full sm:w-auto">
             <DatePicker
              value={filterStartDate}
              onChange={setFilterStartDate}
              className="w-full"
              placeholder="Start Date"
            />
          </div>
          <span className="text-muted-foreground text-sm font-medium">to</span>
           <div className="w-full sm:w-auto">
            <DatePicker
              value={filterEndDate}
              onChange={setFilterEndDate}
              disabled={(date) => !!filterStartDate && date < filterStartDate}
              className="w-full"
              placeholder="End Date"
            />
          </div>
          <div className="flex-grow" />
          <Button 
            onClick={clearFilters} 
            variant="ghost" 
            size="sm" 
            disabled={!filterStartDate && !filterEndDate}
            className="w-full sm:w-auto text-muted-foreground hover:text-foreground"
          >
            <XCircle className="mr-2 h-4 w-4" /> Clear Filters
          </Button>
        </CardContent>
      </Card>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        {/* Bar Chart */}
        <Card className="shadow-lg border-border/60">
          <CardHeader>
            <CardTitle>Bar Chart - {processedChartData.label}</CardTitle>
            <CardDescription>
              {processedChartData.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasData ? (
              <ChartContainer config={chartConfig} className="min-h-[350px] w-full">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={processedChartData.data} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--muted-foreground)/0.2)" />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={12}
                      padding={{ left: 10, right: 10 }}
                      interval={processedChartData.data.length > 12 ? Math.floor(processedChartData.data.length / 12) : 0}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis
                      tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={12}
                      width={60}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <ChartTooltip
                      cursor={{ fill: 'hsl(var(--muted)/0.4)' }}
                      content={<ChartTooltipContent indicator="dot" className="bg-background/95 backdrop-blur-sm border-border shadow-xl" />}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar
                      dataKey="totalGoodsGiven"
                      fill="var(--color-totalGoodsGiven)"
                      fillOpacity={0.9}
                      radius={[4, 4, 0, 0]}
                      barSize={Math.max(10, 40 - Math.max(0, processedChartData.data.length - 12) * 2)}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <NoDataState filterActive={!!(filterStartDate || filterEndDate)} />
            )}
          </CardContent>
        </Card>

        {/* Line Chart */}
        <Card className="shadow-lg border-border/60">
          <CardHeader>
            <CardTitle>Line Chart - {processedChartData.label}</CardTitle>
            <CardDescription>
               Trend of goods given over the selected period.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasData ? (
              <ChartContainer config={chartConfig} className="min-h-[350px] w-full">
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={processedChartData.data} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--muted-foreground)/0.2)" />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={12}
                      padding={{ left: 10, right: 10 }}
                      interval={processedChartData.data.length > 12 ? Math.floor(processedChartData.data.length / 12) : 0}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis
                      tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={12}
                      width={60}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <ChartTooltip
                      cursor={{ stroke: 'hsl(var(--muted-foreground))' }}
                      content={<ChartTooltipContent indicator="line" className="bg-background/95 backdrop-blur-sm border-border shadow-xl" />}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line
                      type="monotone"
                      dataKey="totalGoodsGiven"
                      stroke="var(--color-totalGoodsGiven)"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "var(--color-totalGoodsGiven)" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <NoDataState filterActive={!!(filterStartDate || filterEndDate)} />
            )}
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="shadow-lg border-border/60">
          <CardHeader>
            <CardTitle>Pie Chart - Monthly Contribution</CardTitle>
            <CardDescription>
              Proportion of goods given by month.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasData ? (
              <ChartContainer config={processedChartData.pieConfig} className="min-h-[350px] w-full mx-auto">
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel nameKey="month" indicator="dot" className="bg-background/95 backdrop-blur-sm border-border shadow-xl" />}
                    />
                    <Pie
                      data={processedChartData.data}
                      dataKey="totalGoodsGiven"
                      nameKey="month"
                      innerRadius={60}
                      outerRadius={120}
                      strokeWidth={2}
                      paddingAngle={2}
                    >
                      {processedChartData.data.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent nameKey="month" />} className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center" />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <NoDataState filterActive={!!(filterStartDate || filterEndDate)} />
            )}
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm border-t pt-4 bg-muted/10">
            <div className="leading-none text-muted-foreground">
              Showing total goods given per month.
              {(filterStartDate && filterEndDate)
                ? ` Data range: ${format(filterStartDate, 'MMM d, yyyy')} - ${format(filterEndDate, 'MMM d, yyyy')}.`
                : " Data range: Last 3 months."
              }
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}

function NoDataState({ filterActive }: { filterActive: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mx-auto bg-muted p-4 rounded-full w-fit mb-4">
        <PackageSearch className="h-10 w-10 text-muted-foreground" />
      </div>
      <p className="text-lg font-semibold">No Transaction Data Available</p>
      <p className="text-muted-foreground mt-1 max-w-sm">
        {filterActive
          ? "There are no transactions recorded for the selected period."
          : "There are no transactions recorded in the last 3 months."
        }
      </p>
    </div>
  );
}
