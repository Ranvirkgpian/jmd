'use client';

import React, { useState } from 'react';
import { useBill } from '@/contexts/BillContext';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, Trash2, ArrowLeft, Search, Download } from 'lucide-react';
import Link from 'next/link';
import { generateBillPDF } from '@/lib/pdfGenerator';
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

export default function BillHistoryPage() {
  const { bills, deleteBill, loadingBills } = useBill();
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

  // Mock View Bill Component (In reality, this would show full details or PDF)
  const BillDetails = ({ billId }: { billId: string }) => {
    const { settings } = useBill();
    const bill = bills.find(b => b.id === billId);
    if (!bill) return null;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold text-muted-foreground">Customer:</span>
            <div className="text-lg">{bill.customer_name}</div>
          </div>
          <div className="text-right">
            <span className="font-semibold text-muted-foreground">Bill #:</span>
            <div className="text-lg">{bill.bill_number}</div>
          </div>
          <div>
            <span className="font-semibold text-muted-foreground">Date:</span>
            <div>{format(new Date(bill.date), 'PPP')}</div>
          </div>
          <div className="text-right">
             <span className="font-semibold text-muted-foreground">Status:</span>
             <div>{bill.paid_amount >= bill.total_amount ? 'Paid' : 'Unpaid'}</div>
          </div>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bill.items?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.product_name}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{item.rate}</TableCell>
                  <TableCell className="text-right">{item.amount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end text-right space-y-1 flex-col">
           <div className="flex justify-between w-48 self-end">
             <span>Subtotal:</span>
             <span>{bill.subtotal}</span>
           </div>
           {bill.discount_amount > 0 && (
             <div className="flex justify-between w-48 self-end text-green-600">
               <span>Discount:</span>
               <span>-{bill.discount_amount}</span>
             </div>
           )}
           {bill.tax_amount > 0 && (
             <div className="flex justify-between w-48 self-end text-slate-600">
               <span>Tax:</span>
               <span>+{bill.tax_amount}</span>
             </div>
           )}
           <div className="flex justify-between w-48 self-end font-bold text-lg border-t pt-2 mt-2">
             <span>Total:</span>
             <span>{bill.total_amount}</span>
           </div>
            <div className="flex justify-between w-48 self-end text-sm text-muted-foreground">
             <span>Paid:</span>
             <span>{bill.paid_amount}</span>
           </div>
        </div>

        <div className="flex justify-center pt-4">
           {/* Placeholder for PDF Generation */}
           <Button variant="outline" onClick={() => generateBillPDF(bill, settings)}>
             <Download className="mr-2 w-4 h-4" /> Download PDF
           </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/bill-book">
          <Button variant="ghost" size="icon">
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
                  <TableHead>Bill #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBills.map((bill) => {
                  const due = bill.total_amount - bill.paid_amount;
                  return (
                    <TableRow key={bill.id}>
                      <TableCell>{format(new Date(bill.date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="font-medium">{bill.bill_number}</TableCell>
                      <TableCell>{bill.customer_name}</TableCell>
                      <TableCell>₹{bill.total_amount}</TableCell>
                      <TableCell>
                         {due > 0 ? <span className="text-red-500 font-medium">₹{due}</span> : <span className="text-green-500">Paid</span>}
                      </TableCell>
                      <TableCell className="text-right flex justify-end gap-2">
                         <Dialog>
                           <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setSelectedBillId(bill.id)}>
                                <Eye className="w-4 h-4 text-blue-500" />
                              </Button>
                           </DialogTrigger>
                           <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Bill Details</DialogTitle>
                              </DialogHeader>
                              <BillDetails billId={bill.id} />
                           </DialogContent>
                         </Dialog>

                         <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
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
