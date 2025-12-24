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
import { subMonths, parseISO, isAfter } from 'date-fns';

type StatusFilter = 'all' | 'active' | 'inactive';

export default function TransactionSummaryPage() {
  const { shopkeepers, transactions, loadingShopkeepers, loadingTransactions } = useData();
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { processedData, stats } = useMemo(() => {
    if (loadingShopkeepers || loadingTransactions) {
      return {
        processedData: [],
        stats: { total: 0, active: 0, inactive: 0 }
      };
    }

    const threeMonthsAgo = subMonths(new Date(), 3);

    // Pre-calculate totals and check activity
    const shopkeeperStats = transactions.reduce((acc, t) => {
      if (!acc[t.shopkeeperId]) {
        acc[t.shopkeeperId] = { given: 0, received: 0, lastTransactionDate: null };
      }
      acc[t.shopkeeperId].given += t.goodsGiven;
      acc[t.shopkeeperId].received += t.moneyReceived;

      const tDate = parseISO(t.date);
      if (!acc[t.shopkeeperId].lastTransactionDate || tDate > acc[t.shopkeeperId].lastTransactionDate!) {
        acc[t.shopkeeperId].lastTransactionDate = tDate;
      }

      return acc;
    }, {} as Record<string, { given: number; received: number; lastTransactionDate: Date | null }>);

    let activeCount = 0;
    let inactiveCount = 0;

    const data = shopkeepers.map(shopkeeper => {
      const stats = shopkeeperStats[shopkeeper.id] || { given: 0, received: 0, lastTransactionDate: null };
      const dueAmount = stats.given - stats.received;

      // Determine if active: has any transaction in last 3 months
      const isActive = stats.lastTransactionDate
        ? isAfter(stats.lastTransactionDate, threeMonthsAgo)
        : false;

      if (isActive) activeCount++;
      else inactiveCount++;

      return {
        id: shopkeeper.id,
        name: shopkeeper.name,
        address: shopkeeper.address || 'N/A',
        totalMoneyReceived: stats.received,
        dueAmount,
        isActive
      };
    }).sort((a, b) => b.dueAmount - a.dueAmount);

    return {
      processedData: data,
      stats: {
        total: shopkeepers.length,
        active: activeCount,
        inactive: inactiveCount
      }
    };
  }, [shopkeepers, transactions, loadingShopkeepers, loadingTransactions]);

  const filteredData = useMemo(() => {
    return processedData.filter(item => {
      // Status Filter
      if (statusFilter === 'active' && !item.isActive) return false;
      if (statusFilter === 'inactive' && item.isActive) return false;

      // Text Search
      if (searchTerm) {
        return (
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.address.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      return true;
    });
  }, [processedData, searchTerm, statusFilter]);

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
      <div className="grid gap-4 md:grid-cols-3">
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === 'all' ? 'ring-2 ring-primary border-primary' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shopkeepers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All registered shopkeepers</p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === 'active' ? 'ring-2 ring-green-600 border-green-600' : ''}`}
          onClick={() => setStatusFilter('active')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Active Shopkeepers</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">At least one transaction in last 3 months</p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === 'inactive' ? 'ring-2 ring-red-600 border-red-600' : ''}`}
          onClick={() => setStatusFilter('inactive')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Inactive Shopkeepers</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground">No transactions in last 3 months</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader>
           <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <CardTitle>Shopkeeper Balances</CardTitle>
              <CardDescription>
                {statusFilter === 'all' && "Showing all shopkeepers."}
                {statusFilter === 'active' && "Showing only active shopkeepers."}
                {statusFilter === 'inactive' && "Showing only inactive shopkeepers."}
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
               No shopkeepers found matching the current filters.
             </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Shopkeeper Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Paid Amount</TableHead>
                    <TableHead className="text-right">Due Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => router.push(`/shopkeepers/${item.id}`)}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.address}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${item.isActive ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-red-50 text-red-700 ring-red-600/20'}`}>
                          {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
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
