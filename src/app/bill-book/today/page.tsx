'use client';

import React from 'react';
import { useBill } from '@/contexts/BillContext';
import { format, isToday } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, FileText, ArrowLeft, Loader2, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BillDetails } from '@/components/bill-book/BillDetails';
import { shareOrDownloadBill } from '@/lib/pdfGenerator';
import { Bill } from '@/lib/types';

export default function TodaysBillsPage() {
  const { bills, customers, settings, loadingBills } = useBill();
  const router = useRouter();
  const [selectedBill, setSelectedBill] = React.useState<Bill | null>(null);
  const [isViewOpen, setIsViewOpen] = React.useState(false);

  const todaysBills = bills.filter(bill => isToday(new Date(bill.date)));
  const totalAmount = todaysBills.reduce((sum, bill) => sum + (bill.total_amount || 0), 0);

  const handleShare = async (bill: Bill) => {
    const customer = customers.find(c => c.id === bill.customer_id);
    await shareOrDownloadBill(bill, settings, customer?.address, customer?.mobile_number);
  };

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
          <Button variant="ghost" size="icon" aria-label="Go back">
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
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="text-center">Share</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todaysBills.map((bill) => {
                    return (
                      <TableRow key={bill.id}>
                        <TableCell>{bill.customer_name}</TableCell>
                        <TableCell>₹{bill.total_amount.toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleShare(bill)}
                            aria-label={`Share bill for ${bill.customer_name}`}
                          >
                            <MessageCircle className="w-5 h-5" />
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedBill(bill);
                              setIsViewOpen(true);
                            }}
                            aria-label={`View details for bill ${bill.customer_name}`}
                          >
                            <Eye className="w-4 h-4 text-blue-500" />
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

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bill Details</DialogTitle>
          </DialogHeader>
          {selectedBill && (
            <BillDetails
              bill={selectedBill}
              settings={settings}
              customer={customers.find(c => c.id === selectedBill.customer_id)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
