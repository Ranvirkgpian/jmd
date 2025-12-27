"use client";

import React, { useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useBill } from '@/contexts/BillContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, ArrowUpCircle, ArrowDownCircle, Banknote, Calendar, Eye, Loader2 } from 'lucide-react';
import { format, isToday } from 'date-fns';
import Link from 'next/link';

export default function HomePage() {
  const { transactions, loadingTransactions } = useData();
  const { bills, loadingBills } = useBill();

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

  // Today's Bills Logic
  const todaysBills = bills.filter(bill => isToday(new Date(bill.date)));
  const totalBillAmount = todaysBills.reduce((sum, bill) => sum + (bill.total_amount || 0), 0);

  const handlePdfClick = () => {
    window.open("https://drive.google.com/file/d/139tjA0YNeLcX-GgkvdrXgMQIGoU76NVv/view", "_blank");
  };

  if (loadingTransactions || loadingBills) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
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

      {/* Today's Bills Section */}
      <div className="w-full space-y-6 pt-8 border-t">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Today's Bills</h2>
            <Link href="/bill-book/new">
                <Button size="sm">Create New Bill</Button>
            </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Bills Generated</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{todaysBills.length}</div>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales (Bills)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">₹{totalBillAmount.toFixed(2)}</div>
            </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
            <CardTitle>Bill Transactions</CardTitle>
            </CardHeader>
            <CardContent>
            {todaysBills.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                No bills generated today.
                </div>
            ) : (
                <div className="rounded-md border">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Bill #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Paid</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {todaysBills.map((bill) => {
                        const due = bill.total_amount - bill.paid_amount;
                        return (
                        <TableRow key={bill.id}>
                            <TableCell className="font-medium">{bill.bill_number}</TableCell>
                            <TableCell>{bill.customer_name}</TableCell>
                            <TableCell>₹{bill.total_amount.toFixed(2)}</TableCell>
                            <TableCell className="text-green-600">₹{bill.paid_amount.toFixed(2)}</TableCell>
                            <TableCell>
                            {due <= 0 ? (
                                <Badge variant="default" className="bg-green-500 hover:bg-green-600">Paid</Badge>
                            ) : bill.paid_amount === 0 ? (
                                <Badge variant="destructive">Unpaid</Badge>
                            ) : (
                                <Badge variant="secondary" className="text-orange-600">Partial</Badge>
                            )}
                            </TableCell>
                            <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => {
                                // View Details Logic Placeholder
                                console.log('View bill', bill.id);
                            }}>
                                <Eye className="w-4 h-4" />
                            </Button>
                            </TableCell>
                        </TableRow>
                        );
                    })}
                    </TableBody>
                </Table>
                </div>
            )}
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
