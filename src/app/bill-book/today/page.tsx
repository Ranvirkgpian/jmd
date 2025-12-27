'use client';

import React from 'react';
import { useBill } from '@/contexts/BillContext';
import { format, isToday } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, FileText, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TodaysBillsPage() {
  const { bills, loadingBills } = useBill();
  const router = useRouter();

  const todaysBills = bills.filter(bill => isToday(new Date(bill.date)));
  const totalAmount = todaysBills.reduce((sum, bill) => sum + (bill.total_amount || 0), 0);

  if (loadingBills) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/bill-book">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Today's Bills</h1>
          <p className="text-muted-foreground">{format(new Date(), 'PPPP')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
             <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">₹{totalAmount.toFixed(2)}</div>
           </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {todaysBills.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No bills generated today.
              <div className="mt-4">
                <Link href="/bill-book/new">
                  <Button>Create New Bill</Button>
                </Link>
              </div>
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
                             // View Details Logic (Modal or Page)
                             // For now, simple alert or log, or route to details if we had one
                             // router.push(`/bill-book/history?id=${bill.id}`);
                             // Let's just assume we view it in history for now or placeholder
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
  );
}
