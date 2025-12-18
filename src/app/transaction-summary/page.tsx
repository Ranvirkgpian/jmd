"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';

export default function TransactionSummaryPage() {
  const { shopkeepers, transactions, loadingShopkeepers, loadingTransactions } = useData();
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const summaryData = useMemo(() => {
    if (loadingShopkeepers || loadingTransactions) return [];

    // Pre-calculate totals for all transactions in one pass for efficiency
    const totalsByShopkeeper = transactions.reduce((acc, t) => {
      if (!acc[t.shopkeeperId]) {
        acc[t.shopkeeperId] = { given: 0, received: 0 };
      }
      acc[t.shopkeeperId].given += t.goodsGiven;
      acc[t.shopkeeperId].received += t.moneyReceived;
      return acc;
    }, {} as Record<string, { given: number; received: number }>);

    return shopkeepers.map(shopkeeper => {
      const totals = totalsByShopkeeper[shopkeeper.id] || { given: 0, received: 0 };
      const dueAmount = totals.given - totals.received;

      return {
        id: shopkeeper.id,
        name: shopkeeper.name,
        address: shopkeeper.address || 'N/A',
        totalMoneyReceived: totals.received,
        dueAmount
      };
    });
  }, [shopkeepers, transactions, loadingShopkeepers, loadingTransactions]);

  const filteredData = useMemo(() => {
    return summaryData.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [summaryData, searchTerm]);

  if (!isMounted || loadingShopkeepers || loadingTransactions) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />
        <p className="text-base font-medium">Loading summary...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
       <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transaction Summary</h1>
          <p className="text-muted-foreground">Overview of shopkeeper balances.</p>
        </div>
      </div>

      <Card className="shadow-md">
        <CardHeader>
           <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <CardTitle>Shopkeeper Balances</CardTitle>
              <CardDescription>
                A detailed list of paid amounts and due balances for each shopkeeper.
              </CardDescription>
            </div>
            <div className="w-full sm:w-72">
               <Input
                 placeholder="Search by name or address..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredData.length === 0 ? (
             <div className="text-center py-10 text-muted-foreground">
               No shopkeepers found.
             </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Shopkeeper Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead className="text-right">Paid Amount</TableHead>
                    <TableHead className="text-right">Due Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => router.push(`/shopkeepers/${item.id}`)}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.address}</TableCell>
                      <TableCell className="text-right text-green-600 font-medium">
                        ₹{item.totalMoneyReceived.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${item.dueAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ₹{item.dueAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
  );
}
