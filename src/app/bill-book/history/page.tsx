'use client';

import React, { useState } from 'react';
import { useBill } from '@/contexts/BillContext';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, Trash2, ArrowLeft, Search, Loader2 } from 'lucide-react';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BillDetails } from '@/components/bill-book/BillDetails';

export default function BillHistoryPage() {
  const { bills, customers, settings, deleteBill, loadingBills } = useBill();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);

  const filteredBills = bills.filter(bill => {
    const searchLower = searchTerm.toLowerCase();
    return (
      bill.customer_name.toLowerCase().includes(searchLower) ||
      bill.bill_number.toString().includes(searchLower) ||
      format(new Date(bill.date), 'yyyy-MM-dd').includes(searchLower)
    );
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteBill(id);
      toast({
        title: "Bill Deleted",
        description: "The bill has been moved to trash.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete bill.",
        variant: "destructive",
      });
    }
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
          <h1 className="text-2xl font-bold tracking-tight">All Bills / History</h1>
          <p className="text-muted-foreground">Manage and review past invoices.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
           <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by customer, bill number, or date..."
                aria-label="Search bills"
                className="pl-8 max-w-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBills.map((bill) => {
                  const customer = customers.find(c => c.id === bill.customer_id);

                  return (
                    <TableRow key={bill.id}>
                      <TableCell>{format(new Date(bill.date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{bill.customer_name}</TableCell>
                      <TableCell>₹{bill.total_amount}</TableCell>
                      <TableCell className="text-right flex justify-end gap-2">
                         <Dialog>
                           <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedBillId(bill.id)}
                                aria-label={`View details for bill ${bill.customer_name}`}
                              >
                                <Eye className="w-4 h-4 text-blue-500" />
                              </Button>
                           </DialogTrigger>
                           <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Bill Details</DialogTitle>
                              </DialogHeader>
                              <BillDetails
                                bill={bill}
                                settings={settings}
                                customer={customer}
                              />
                           </DialogContent>
                         </Dialog>

                         <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" aria-label={`Delete bill for ${bill.customer_name}`}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently soft-delete the bill.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(bill.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredBills.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No bills found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
