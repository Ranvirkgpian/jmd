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
import { Loader2, ArrowLeft, Users, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { subMonths, isAfter, parseISO } from 'date-fns';

export default function TransactionSummaryPage() {
  const { shopkeepers, transactions, loadingShopkeepers, loadingTransactions } = useData();
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const summaryData = useMemo(() => {
    if (loadingShopkeepers || loadingTransactions) return [];

    const threeMonthsAgo = subMonths(new Date(), 3);

    // Pre-calculate totals and last transaction date
    const totalsByShopkeeper = transactions.reduce((acc, t) => {
      if (!acc[t.shopkeeperId]) {
        acc[t.shopkeeperId] = { given: 0, received: 0, lastDate: null };
      }
      acc[t.shopkeeperId].given += t.goodsGiven;
      acc[t.shopkeeperId].received += t.moneyReceived;

      const transDate = parseISO(t.date);
      if (!acc[t.shopkeeperId].lastDate || isAfter(transDate, acc[t.shopkeeperId].lastDate!)) {
        acc[t.shopkeeperId].lastDate = transDate;
      }
      return acc;
    }, {} as Record<string, { given: number; received: number; lastDate: Date | null }>);

    return shopkeepers.map(shopkeeper => {
      const totals = totalsByShopkeeper[shopkeeper.id] || { given: 0, received: 0, lastDate: null };
      const dueAmount = totals.given - totals.received;

      // Active if last transaction is within 3 months
      const isActive = totals.lastDate ? isAfter(totals.lastDate, threeMonthsAgo) : false;

      return {
        id: shopkeeper.id,
        name: shopkeeper.name,
        address: shopkeeper.address || 'N/A',
        totalMoneyReceived: totals.received,
        dueAmount,
        isActive
      };
    }).sort((a, b) => a.dueAmount - b.dueAmount); // Ascending order of due amount
  }, [shopkeepers, transactions, loadingShopkeepers, loadingTransactions]);

  const stats = useMemo(() => {
    const total = summaryData.length;
    const active = summaryData.filter(s => s.isActive).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [summaryData]);

  const filteredData = useMemo(() => {
    return summaryData.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.address.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesFilter = true;
      if (filterType === 'active') matchesFilter = item.isActive;
      if (filterType === 'inactive') matchesFilter = !item.isActive;

      return matchesSearch && matchesFilter;
    });
  }, [summaryData, searchTerm, filterType]);

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
          <p className="text-muted-foreground">Overview of shopkeeper balances and activity.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className={`cursor-pointer transition-all hover:shadow-md border-l-4 ${filterType === 'all' ? 'border-l-primary bg-primary/5' : 'border-l-primary/40'}`}
          onClick={() => setFilterType('all')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shopkeepers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all hover:shadow-md border-l-4 ${filterType === 'active' ? 'border-l-green-500 bg-green-500/5' : 'border-l-green-500/40'}`}
          onClick={() => setFilterType('active')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Active Shopkeepers</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Transacted in last 3 months</p>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all hover:shadow-md border-l-4 ${filterType === 'inactive' ? 'border-l-red-500 bg-red-500/5' : 'border-l-red-500/40'}`}
          onClick={() => setFilterType('inactive')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-500">Inactive Shopkeepers</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground">No transaction in last 3 months</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader>
           <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <CardTitle>Shopkeeper Balances</CardTitle>
              <CardDescription>
                List of shopkeepers sorted by due amount (increasing).
                {filterType !== 'all' && <span className="font-semibold block mt-1 text-primary">Filtering by: {filterType === 'active' ? 'Active' : 'Inactive'}</span>}
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
               No shopkeepers found matching your criteria.
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
                      <TableCell className={`font-medium ${item.isActive ? 'text-green-600' : 'text-red-500'}`}>
                        {item.name}
                      </TableCell>
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
