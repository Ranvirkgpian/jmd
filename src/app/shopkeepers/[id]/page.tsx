
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useData } from '@/contexts/DataContext';
import type { Transaction } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TransactionDialog } from '@/components/dialogs/TransactionDialog';
import { ConfirmationDialog } from '@/components/dialogs/ConfirmationDialog';
import { DatePicker } from '@/components/ui/datepicker';
import { PlusCircle, Edit3, Trash2, ArrowLeft, FileSpreadsheet, MessageSquare, ReceiptIndianRupee, XCircle, Filter, Loader2 } from 'lucide-react';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import * as XLSX from 'xlsx';
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


export default function ShopkeeperTransactionsPage() {
  const router = useRouter();
  const params = useParams();
  const shopkeeperId = params.id as string;
  const { toast } = useToast();
  
  const { 
    getShopkeeperById, 
    getTransactionsByShopkeeper, 
    addTransaction, 
    updateTransaction, 
    deleteTransaction,
    loadingShopkeepers, 
    loadingTransactions 
  } = useData();

  const [isMounted, setIsMounted] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const shopkeeper = useMemo(() => getShopkeeperById(shopkeeperId), [shopkeeperId, getShopkeeperById]);
  
  const transactionsFromShopkeeper = useMemo(() => getTransactionsByShopkeeper(shopkeeperId), [shopkeeperId, getTransactionsByShopkeeper]);

  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  const displayedTransactions = useMemo(() => {
    return transactionsFromShopkeeper
      .filter(transaction => {
        if (!startDate && !endDate) return true; 
        const transactionDate = parseISO(transaction.date);
        if (startDate && transactionDate < startOfDay(startDate)) return false;
        if (endDate && transactionDate > endOfDay(endDate)) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactionsFromShopkeeper, startDate, endDate]);

  const summary = useMemo(() => {
    const totalGoodsGiven = displayedTransactions.reduce((sum, t) => sum + t.goodsGiven, 0);
    const totalMoneyReceived = displayedTransactions.reduce((sum, t) => sum + t.moneyReceived, 0);
    const balance = totalGoodsGiven - totalMoneyReceived;
    return {
      totalGoodsGiven,
      totalMoneyReceived,
      balance,
      balanceType: balance > 0 ? "Outstanding" : balance < 0 ? "Advance" : "Settled",
      balanceAmount: Math.abs(balance),
    };
  }, [displayedTransactions]);

  if (!isMounted || loadingShopkeepers || loadingTransactions) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading data...</p>
      </div>
    );
  }

  if (!shopkeeper) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold mb-4">Shopkeeper Not Found</h2>
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Shopkeepers
          </Link>
        </Button>
      </div>
    );
  }

  const handleAddTransaction = () => {
    setEditingTransaction(null);
    setIsTransactionDialogOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsTransactionDialogOpen(true);
  };

  const handleDeleteTransaction = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setIsConfirmDeleteDialogOpen(true);
  };

  const confirmDeleteTransaction = async () => {
    if (transactionToDelete) {
      await deleteTransaction(transactionToDelete.id);
      setTransactionToDelete(null);
    }
  };

  const handleTransactionFormSubmit = async (data: Omit<Transaction, 'id' | 'created_at' | 'shopkeeperId'> & { date: string }) => {
    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, { ...data, date: data.date });
    } else {
      await addTransaction({ ...data, shopkeeperId, date: data.date });
    }
    setEditingTransaction(null);
  };

  const handleShopkeeperExcelExport = async () => {
    if (!shopkeeper || displayedTransactions.length === 0) {
      toast({
        title: "No Data",
        description: "There is no transaction data for this shopkeeper to export.",
        variant: "destructive",
      });
      return;
    }

    setIsExportingExcel(true);
    try {
      const dataForSheet = displayedTransactions.map(t => ({
        'Date': format(parseISO(t.date), "yyyy-MM-dd"),
        'Goods Given (INR)': t.goodsGiven,
        'Money Received (INR)': t.moneyReceived,
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataForSheet);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

      const columnWidths = [
        { wch: 12 }, // Date
        { wch: 20 }, // Goods Given
        { wch: 22 }, // Money Received
      ];
      worksheet['!cols'] = columnWidths;
      
      const fileName = `${shopkeeper.name.toLowerCase().replace(/\s+/g, '-')}-transactions.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({
        title: "Excel Exported",
        description: `${fileName} has been downloaded.`,
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

  const handleShareWhatsApp = () => {
    window.print(); 
    setTimeout(() => {
      const message = `Your transaction summary by JMD for ${shopkeeper.name}:\nTotal Goods Given: ₹${summary.totalGoodsGiven.toFixed(2)}\nTotal Money Received: ₹${summary.totalMoneyReceived.toFixed(2)}\nBalance: ₹${summary.balanceAmount.toFixed(2)} (${summary.balanceType})`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }, 1000); 
  };

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };
  
  const handleDirectPdfDownload = async () => { // This function is for PDF download, not Excel
    if (!shopkeeper) return;
    const printableArea = document.querySelector('.printable-area') as HTMLElement;
    if (!printableArea) {
      toast({ title: "Error", description: "Could not find printable area.", variant: "destructive" });
      return;
    }

    setIsExportingExcel(true); // Re-using state, consider renaming if PDF and Excel have distinct loading states

    const elementsToHideSelectors = [
        '[data-pdf-hide="account-summary"]',
        '[data-pdf-hide="transaction-filters"]',
        '.reports-card' 
    ];
    const originalDisplays: { element: HTMLElement, display: string }[] = [];

    elementsToHideSelectors.forEach(selector => {
        const elements = printableArea.querySelectorAll(selector) as NodeListOf<HTMLElement>;
        elements.forEach(el => {
            originalDisplays.push({ element: el, display: el.style.display });
            el.style.display = 'none';
        });
    });

    try {
      const canvas = await html2canvas(printableArea, { 
        scale: 2, 
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height] 
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${shopkeeper.name.toLowerCase().replace(/\s+/g, '-')}-transaction-history.pdf`);
      toast({ title: "PDF Generated", description: "Transaction history PDF has been downloaded."});
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({ title: "PDF Generation Error", description: "Could not generate PDF. Please try again.", variant: "destructive" });
    } finally {
      originalDisplays.forEach(({element, display}) => {
          element.style.display = display;
      });
      setIsExportingExcel(false); 
    }
  };


  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" onClick={() => router.push('/')} className="mb-4 hide-on-print">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Shopkeepers
      </Button>

      <div className="printable-area space-y-6"> 
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h2 className="text-3xl font-semibold tracking-tight">Transactions for <span className="text-primary">{shopkeeper.name}</span></h2>
          <Button onClick={handleAddTransaction} className="shadow-md w-full sm:w-auto hide-on-print">
            <PlusCircle className="mr-2 h-5 w-5" /> Add Transaction
          </Button>
        </div>

        <Card className="shadow-lg" data-pdf-hide="account-summary">
          <CardHeader>
            <CardTitle className="text-xl">Account Summary { (startDate || endDate) && <span className="text-sm font-normal text-muted-foreground">(Filtered)</span>}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center md:text-left">
            <div>
              <p className="text-sm text-muted-foreground">Total Goods Given</p>
              <p className="text-2xl font-semibold">₹{summary.totalGoodsGiven.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Money Received</p>
              <p className="text-2xl font-semibold text-green-600">₹{summary.totalMoneyReceived.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className={`text-2xl font-semibold ${summary.balance > 0 ? 'text-red-600' : summary.balance < 0 ? 'text-green-600' : ''}`}>
                ₹{summary.balanceAmount.toFixed(2)}
                <span className="text-sm ml-1">({summary.balanceType})</span>
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg reports-card hide-on-print">
          <CardHeader>
              <CardTitle className="text-xl">Reports</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
              {/* This button is for Excel Export */}
              <Button 
                onClick={handleShopkeeperExcelExport} 
                variant="outline" 
                className="w-full sm:w-auto"
                disabled={isExportingExcel}
              >
                  {isExportingExcel ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Exporting Excel...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Export as Excel
                    </>
                  )}
              </Button>
              {/* This button uses window.print() for PDF/sharing, not direct PDF download */}
              <Button onClick={handleShareWhatsApp} variant="outline" className="w-full sm:w-auto">
                  <MessageSquare className="mr-2 h-4 w-4" /> Share via WhatsApp
              </Button>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Transaction History</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 mt-4 items-center hide-on-print" data-pdf-hide="transaction-filters">
              <DatePicker
                value={startDate}
                onChange={setStartDate}
                className="w-full sm:w-auto"
              />
              <span className="hide-on-print text-muted-foreground">to</span>
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
            </div>
          </CardHeader>
          <CardContent>
            {transactionsFromShopkeeper.length === 0 && !startDate && !endDate ? ( 
              <div className="text-center py-10">
                <div className="mx-auto bg-secondary p-4 rounded-full w-fit">
                   <ReceiptIndianRupee className="h-12 w-12 text-muted-foreground" />
                </div>
                <p className="mt-4 text-muted-foreground">No transactions recorded yet for {shopkeeper.name}.</p>
                <p className="text-muted-foreground">Click "Add Transaction" to record the first one.</p>
              </div>
            ) : displayedTransactions.length === 0 ? (
              <div className="text-center py-10">
                <div className="mx-auto bg-secondary p-4 rounded-full w-fit">
                   <ReceiptIndianRupee className="h-12 w-12 text-muted-foreground" />
                </div>
                <p className="mt-4 text-muted-foreground">No transactions found for the selected date range.</p>
                <p className="text-muted-foreground">Try adjusting the filters or clear them to see all transactions.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Date</TableHead>
                      <TableHead className="text-right w-[130px]">Goods Given</TableHead>
                      <TableHead className="text-right w-[140px]">Money Received</TableHead>
                      <TableHead className="text-right w-[100px] table-actions-col">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{format(parseISO(transaction.date), "MMM d, yyyy")}</TableCell>
                        <TableCell className="text-right">₹{transaction.goodsGiven.toFixed(2)}</TableCell>
                        <TableCell className="text-right">₹{transaction.moneyReceived.toFixed(2)}</TableCell>
                        <TableCell className="text-right table-actions-col">
                          <div className="flex justify-end space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEditTransaction(transaction)} aria-label="Edit transaction">
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteTransaction(transaction)} aria-label="Delete transaction" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div> 
      
      <TransactionDialog
        isOpen={isTransactionDialogOpen}
        onOpenChange={setIsTransactionDialogOpen}
        onSubmit={handleTransactionFormSubmit}
        initialData={editingTransaction}
      />
      <ConfirmationDialog
        isOpen={isConfirmDeleteDialogOpen}
        onOpenChange={setIsConfirmDeleteDialogOpen}
        onConfirm={confirmDeleteTransaction}
        title="Delete Transaction"
        description={`Are you sure you want to delete this transaction? This action cannot be undone.`}
        confirmButtonText="Delete"
      />
    </div>
  );
}

    

    