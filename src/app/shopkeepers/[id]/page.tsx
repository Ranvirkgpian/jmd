
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
import { PlusCircle, Edit3, Trash2, ArrowLeft, FileText, MessageSquare, ReceiptIndianRupee, XCircle, Filter } from 'lucide-react';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';

export default function ShopkeeperTransactionsPage() {
  const router = useRouter();
  const params = useParams();
  const shopkeeperId = params.id as string;
  
  const { 
    getShopkeeperById, 
    getTransactionsByShopkeeper, 
    addTransaction, 
    updateTransaction, 
    deleteTransaction,
  } = useData();

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const shopkeeper = useMemo(() => getShopkeeperById(shopkeeperId), [shopkeeperId, getShopkeeperById]);
  
  // Raw transactions for the shopkeeper
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
        if (!startDate && !endDate) return true; // No filter applied

        const transactionDate = parseISO(transaction.date);

        if (startDate) {
          const filterStartDate = startOfDay(startDate);
          if (transactionDate < filterStartDate) return false;
        }
        if (endDate) {
          const filterEndDate = endOfDay(endDate);
          if (transactionDate > filterEndDate) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Keep original sorting logic
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

  if (!isMounted) {
    return <div className="flex justify-center items-center h-64"><p>Loading...</p></div>;
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

  const confirmDeleteTransaction = () => {
    if (transactionToDelete) {
      deleteTransaction(transactionToDelete.id);
      setTransactionToDelete(null);
    }
  };

  const handleTransactionFormSubmit = (data: Omit<Transaction, 'id' | 'createdAt' | 'shopkeeperId' | 'description'> & { date: string }) => {
    if (editingTransaction) {
      updateTransaction(editingTransaction.id, { ...data });
    } else {
      addTransaction({ ...data, shopkeeperId });
    }
    setEditingTransaction(null);
  };

  const handleExportPdf = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    window.print(); // User saves PDF first
    // Timeout to allow print dialog to be handled
    setTimeout(() => {
      const message = `Your transaction summary for ${shopkeeper.name} by JMD:\nTotal Goods Given: ₹${summary.totalGoodsGiven.toFixed(2)}\nTotal Money Received: ₹${summary.totalMoneyReceived.toFixed(2)}\nBalance: ₹${summary.balanceAmount.toFixed(2)} (${summary.balanceType})\n\nPlease attach the PDF file you just saved to this chat.`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }, 1000); // Adjust delay if needed
  };

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
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

        {/* Summary Card */}
        <Card className="shadow-lg">
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
              <p className="text-2xl font-semibold">₹{summary.totalMoneyReceived.toFixed(2)}</p>
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
        
         {/* Report Actions Card - will be hidden via CSS during print */}
        <Card className="shadow-lg reports-card">
          <CardHeader>
              <CardTitle className="text-xl">Reports</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
              <Button onClick={handleExportPdf} variant="outline" className="w-full sm:w-auto">
                  <FileText className="mr-2 h-4 w-4" /> Export as PDF
              </Button>
              <Button onClick={handleShareWhatsApp} variant="outline" className="w-full sm:w-auto">
                  <MessageSquare className="mr-2 h-4 w-4" /> Share via WhatsApp
              </Button>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Transaction History</CardTitle>
             {/* Date Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-2 mt-4 items-center hide-on-print">
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
            {transactionsFromShopkeeper.length === 0 ? (
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

