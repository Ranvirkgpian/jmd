"use client";

import React, { useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ArrowUpCircle, ArrowDownCircle, Banknote, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function HomePage() {
  const { transactions, loadingTransactions } = useData();

  // Get current date string in YYYY-MM-DD for comparison and display
  const today = new Date();
  const formattedDate = format(today, 'dd MMM yyyy'); // e.g. 24 Oct 2025
  const todayISO = format(today, 'yyyy-MM-dd'); // e.g. 2025-10-24

  const todaysData = useMemo(() => {
    // Filter transactions for today
    // Note: transaction.date is an ISO string (YYYY-MM-DD or full ISO).
    // We need to compare the date part.
    const todaysTransactions = transactions.filter(t => {
      if (!t.date) return false;
      // specific logic depends on if t.date is 'yyyy-mm-dd' or full iso.
      // Supabase dates are usually YYYY-MM-DD for date types, or ISO for timestamptz.
      // Let's handle both by checking if the string starts with todayISO
      return t.date.startsWith(todayISO);
    });

    const totalTransactionsCount = todaysTransactions.length;
    const totalGoodsGiven = todaysTransactions.reduce((sum, t) => sum + (Number(t.goodsGiven) || 0), 0);
    const totalMoneyReceived = todaysTransactions.reduce((sum, t) => sum + (Number(t.moneyReceived) || 0), 0);
    const rawDue = totalGoodsGiven - totalMoneyReceived;
    const totalDue = rawDue < 0 ? 0 : rawDue;

    return {
      count: totalTransactionsCount,
      goodsGiven: totalGoodsGiven,
      moneyReceived: totalMoneyReceived,
      due: totalDue
    };
  }, [transactions, todayISO]);

  const handlePdfClick = () => {
    window.open("https://drive.google.com/file/d/139tjA0YNeLcX-GgkvdrXgMQIGoU76NVv/view", "_blank");
  };

  if (loadingTransactions) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center space-y-8 max-w-5xl mx-auto py-10 px-4">

      {/* Header Section */}
      <div className="text-center space-y-4 w-full">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-primary">
          JMD ENTERPRISES
        </h1>

        <div className="flex justify-center">
            <Button
                onClick={handlePdfClick}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-6 px-8 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all text-lg"
            >
                <FileText className="mr-2 h-6 w-6" />
                JMD PRODUCT
            </Button>
        </div>
      </div>

      {/* Date Display */}
      <div className="flex flex-col items-center space-y-2 mt-4">
          <div className="bg-secondary/30 px-6 py-2 rounded-full border border-secondary flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <span className="text-xl font-medium text-foreground">{formattedDate}</span>
          </div>
          <p className="text-sm text-muted-foreground">Today's Overview</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-8">

        {/* Total Transactions (Goods Given) */}
        <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Transactions
            </CardTitle>
            <Banknote className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
                ₹ {todaysData.goodsGiven.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {todaysData.count} transaction{todaysData.count !== 1 && 's'} today
            </p>
          </CardContent>
        </Card>

        {/* Received Money (Green) */}
        <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Received Money
            </CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹ {todaysData.moneyReceived.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Cash received today
            </p>
          </CardContent>
        </Card>

        {/* Due Money (Red) */}
        <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Due Money
            </CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₹ {todaysData.due.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pending amount for today
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
