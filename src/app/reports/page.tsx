"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import type { Transaction } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DatePicker } from '@/components/ui/datepicker';
import { TrendingUp, TrendingDown, ReceiptIndianRupee, PackageSearch, XCircle, Filter, FileSpreadsheet, Loader2 } from 'lucide-react';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import * as XLSX from 'xlsx';
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface EnrichedTransaction extends Transaction {
  shopkeeperName: string;
}

export default function ReportsPage() {
  const { transactions, getShopkeeperById, loadingTransactions, loadingShopkeepers } = useData();
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isMounted, setIsMounted] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const enrichedTransactions: EnrichedTransaction[] = useMemo(() => {
    if (loadingTransactions || loadingShopkeepers) return [];
    return transactions
      .map(t => {
        const shopkeeper = getShopkeeperById(t.shopkeeperId);
        return {
          ...t,
          shopkeeperName: shopkeeper?.name || 'N/A',
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, getShopkeeperById, loadingTransactions, loadingShopkeepers]);

  const filteredTransactions = useMemo(() => {
    return enrichedTransactions.filter(transaction => {
      if (!startDate && !endDate) return true;
      const transactionDate = parseISO(transaction.date);
      if (startDate && transactionDate < startOfDay(startDate)) return false;
      if (endDate && transactionDate > endOfDay(endDate)) return false;
      return true;
    });
  }, [enrichedTransactions, startDate, endDate]);

  const summary = useMemo(() => {
    const totalGoodsGiven = filteredTransactions.reduce((sum, t) => sum + t.goodsGiven, 0);
    const totalMoneyReceived = filteredTransactions.reduce((sum, t) => sum + t.moneyReceived, 0);
    const balance = totalGoodsGiven - totalMoneyReceived;
    return {
      totalGoodsGiven,
      totalMoneyReceived,
      balance,
      balanceType: balance > 0 ? "Outstanding" : balance < 0 ? "Advance" : "Settled",
      balanceAmount: Math.abs(balance),
    };
  }, [filteredTransactions]);

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const handleExportExcel = async () => {
    if (filteredTransactions.length === 0) {
      toast({
        title: "No Data",
        description: "There is no transaction data to export.",
        variant: "destructive",
      });
      return;
    }

    setIsExportingExcel(true);
    try {
      const dataForSheet = filteredTransactions.map(t => ({
        'Shopkeeper Name': t.shopkeeperName,
        'Date': format(parseISO(t.date), "yyyy-MM-dd"),
        'Goods Given (INR)': t.goodsGiven,
        'Money Received (INR)': t.moneyReceived,
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataForSheet);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

      const columnWidths = [
        { wch: 25 },
        { wch: 12 },
        { wch: 20 },
        { wch: 22 },
      ];
      worksheet['!cols'] = columnWidths;

      XLSX.writeFile(workbook, "Transaction-Report.xlsx");

      toast({
        title: "Excel Exported",
        description: "Transaction-Report.xlsx has been downloaded.",
      });

    } catch (error) {
      console.error("Error exporting Excel:", error);
      toast({
        title: "Export Error",
        description: "Could not export data to Excel. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExportingExcel(false);
    }
  };


  if (!isMounted || loadingShopkeepers || loadingTransactions) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-base text-muted-foreground">Loading Report Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto printable-area">
      <div data-pdf-hide="true" className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/40 pb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Transaction Report</h2>
          <p className="text-muted-foreground text-sm mt-1">Overview of all goods given and money received.</p>
        </div>
        <Button 
          onClick={handleExportExcel}
          variant="outline" 
          className="hide-on-print shadow-sm hover:bg-primary/5 hover:text-primary transition-colors"
          disabled={isExportingExcel}
        >
          {isExportingExcel ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export to Excel
            </>
          )}
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        data-pdf-hide="true"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Goods Given</CardTitle>
            <div className="bg-blue-100 p-2 rounded-full">
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">₹{summary.totalGoodsGiven.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            { (startDate || endDate) && <p className="text-xs text-muted-foreground mt-1">Filtered range</p> }
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Money Received</CardTitle>
             <div className="bg-green-100 p-2 rounded-full">
              <TrendingDown className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{summary.totalMoneyReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
             { (startDate || endDate) && <p className="text-xs text-muted-foreground mt-1">Filtered range</p> }
          </CardContent>
        </Card>

        <Card className={`shadow-md hover:shadow-lg transition-shadow border-l-4 ${summary.balance > 0 ? 'border-l-red-500' : summary.balance < 0 ? 'border-l-green-500' : 'border-l-gray-400'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Net Balance</CardTitle>
             <div className="bg-gray-100 p-2 rounded-full">
               <ReceiptIndianRupee className="h-4 w-4 text-gray-600" />
             </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.balance > 0 ? 'text-red-600' : summary.balance < 0 ? 'text-green-600' : 'text-gray-600'}`}>
              ₹{summary.balanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              {summary.balanceType}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <Card data-pdf-hide="true" className="shadow-sm border-border/60 hide-on-print bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center font-medium">
            <Filter className="mr-2 h-4 w-4 text-primary" /> Filter Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="w-full sm:w-auto">
             <DatePicker
              value={startDate}
              onChange={setStartDate}
              className="w-full"
              placeholder="Start Date"
            />
          </div>
          <span className="text-muted-foreground text-sm font-medium">to</span>
          <div className="w-full sm:w-auto">
            <DatePicker
              value={endDate}
              onChange={setEndDate}
              disabled={(date) => !!startDate && date < startDate}
              className="w-full"
               placeholder="End Date"
            />
          </div>

          <div className="flex-grow" />

          <Button 
            onClick={clearFilters} 
            variant="ghost" 
            size="sm" 
            disabled={!startDate && !endDate}
            className="w-full sm:w-auto text-muted-foreground hover:text-foreground"
          >
            <XCircle className="mr-2 h-4 w-4" /> Clear Filters
          </Button>
        </CardContent>
      </Card>
      
      <Card className="shadow-md border-border/60 overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4 border-b">
          <CardTitle className="text-lg font-semibold">Detailed Transactions</CardTitle>
           { (startDate || endDate) && <CardDescription>Displaying transactions for the selected date range.</CardDescription> }
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 && !startDate && !endDate ? (
             <div className="text-center py-16 px-4">
              <div className="mx-auto bg-muted p-4 rounded-full w-fit mb-4">
                <PackageSearch className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="text-lg font-semibold">No Transactions Recorded Yet</p>
              <p className="text-muted-foreground mt-1">Once you add transactions, they will appear here.</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-16 px-4">
               <div className="mx-auto bg-muted p-4 rounded-full w-fit mb-4">
                 <PackageSearch className="h-10 w-10 text-muted-foreground" />
               </div>
              <p className="text-lg font-semibold">No Transactions Found</p>
              <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
                No transactions match your current filter criteria. Try adjusting or clearing the filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold text-foreground">Shopkeeper</TableHead>
                    <TableHead className="w-[150px] font-semibold text-foreground">Date</TableHead>
                    <TableHead className="text-right w-[150px] font-semibold text-foreground">Goods Given</TableHead>
                    <TableHead className="text-right w-[150px] font-semibold text-foreground">Money Received</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-medium text-foreground">{transaction.shopkeeperName}</TableCell>
                      <TableCell className="text-muted-foreground">{format(parseISO(transaction.date), "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-right font-medium">₹{transaction.goodsGiven.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">₹{transaction.moneyReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
