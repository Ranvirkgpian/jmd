
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import type { Transaction } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DatePicker } from '@/components/ui/datepicker';
import { TrendingUp, TrendingDown, ReceiptIndianRupee, PackageSearch, XCircle, Filter, FileSpreadsheet, Loader2 } from 'lucide-react'; // Changed FileTextIcon to FileSpreadsheet
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import * as XLSX from 'xlsx';
import { useToast } from "@/hooks/use-toast";

interface EnrichedTransaction extends Transaction {
  shopkeeperName: string;
}

export default function ReportsPage() {
  const { transactions, getShopkeeperById, loadingTransactions, loadingShopkeepers } = useData();
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isMounted, setIsMounted] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false); // Renamed from isGeneratingPdf

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
      // Prepare data for the Excel sheet
      const dataForSheet = filteredTransactions.map(t => ({
        'Shopkeeper Name': t.shopkeeperName,
        'Date': format(parseISO(t.date), "yyyy-MM-dd"), // Consistent date format
        'Goods Given (INR)': t.goodsGiven,
        'Money Received (INR)': t.moneyReceived,
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataForSheet);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

      // Define column widths (optional, but improves readability)
      const columnWidths = [
        { wch: 25 }, // Shopkeeper Name
        { wch: 12 }, // Date
        { wch: 20 }, // Goods Given
        { wch: 22 }, // Money Received
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
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Report Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 printable-area">
      <div data-pdf-hide="true" className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-semibold tracking-tight">Overall Transaction Report</h2>
        <Button 
          onClick={handleExportExcel} // Changed from handleDirectPdfDownload
          variant="outline" 
          className="hide-on-print"
          disabled={isExportingExcel} // Changed from isGeneratingPdf
        >
          {isExportingExcel ? ( // Changed from isGeneratingPdf
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting Excel...
            </>
          ) : (
            <>
              <FileSpreadsheet className="mr-2 h-4 w-4" /> {/* Changed Icon */}
              Export as Excel
            </>
          )}
        </Button>
      </div>

      <div data-pdf-hide="true" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Goods Given</CardTitle>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{summary.totalGoodsGiven.toFixed(2)}</div>
            { (startDate || endDate) && <p className="text-xs text-muted-foreground">Filtered data</p> }
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Money Received</CardTitle>
            <TrendingDown className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{summary.totalMoneyReceived.toFixed(2)}</div>
             { (startDate || endDate) && <p className="text-xs text-muted-foreground">Filtered data</p> }
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <ReceiptIndianRupee className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.balance > 0 ? 'text-red-600' : summary.balance < 0 ? 'text-green-600' : ''}`}>
              ₹{summary.balanceAmount.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.balanceType} { (startDate || endDate) && " (Filtered)" }
            </p>
          </CardContent>
        </Card>
      </div>

      <Card data-pdf-hide="true" className="shadow-md hide-on-print">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <Filter className="mr-2 h-5 w-5" /> Filter Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 items-center">
          <DatePicker
            value={startDate}
            onChange={setStartDate}
            className="w-full sm:w-auto"
          />
          <span className="text-muted-foreground">to</span>
          <DatePicker
            value={endDate}
            onChange={setEndDate}
            disabled={(date) => !!startDate && date < startDate}
            className="w-full sm:w-auto"
          />
          <Button 
            onClick={clearFilters} 
            variant="ghost" 
            size="sm" 
            disabled={!startDate && !endDate}
            className="w-full sm:w-auto"
          >
            <XCircle className="mr-2 h-4 w-4" /> Clear Filters
          </Button>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg"> {/* This card WILL be in the PDF */}
        <CardHeader>
          <CardTitle className="text-xl">Detailed Transactions</CardTitle>
           { (startDate || endDate) && <CardDescription>Displaying transactions for the selected date range.</CardDescription> }
        </CardHeader>
        <CardContent>
          {transactions.length === 0 && !startDate && !endDate ? (
             <div className="text-center py-12">
              <div className="mx-auto bg-secondary p-4 rounded-full w-fit mb-4">
                <PackageSearch className="h-12 w-12 text-muted-foreground" />
              </div>
              <p className="text-xl font-semibold">No Transactions Recorded Yet</p>
              <p className="text-muted-foreground">Once you add transactions, they will appear here.</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
               <div className="mx-auto bg-secondary p-4 rounded-full w-fit mb-4">
                 <PackageSearch className="h-12 w-12 text-muted-foreground" />
               </div>
              <p className="text-xl font-semibold">No Transactions Found</p>
              <p className="text-muted-foreground">
                No transactions match your current filter criteria. Try adjusting or clearing the filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shopkeeper</TableHead>
                    <TableHead className="w-[120px]">Date</TableHead>
                    <TableHead className="text-right w-[130px]">Goods Given</TableHead>
                    <TableHead className="text-right w-[140px]">Money Received</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.shopkeeperName}</TableCell>
                      <TableCell>{format(parseISO(transaction.date), "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-right">₹{transaction.goodsGiven.toFixed(2)}</TableCell>
                      <TableCell className="text-right">₹{transaction.moneyReceived.toFixed(2)}</TableCell>
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
