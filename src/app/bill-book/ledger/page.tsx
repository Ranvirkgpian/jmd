'use client';

import React, { useState } from 'react';
import { useBill } from '@/contexts/BillContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, ChevronRight, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function CustomerLedgerPage() {
  const { customers, bills, loadingCustomers } = useBill();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);

  // Aggregate data per customer
  const customerLedger = customers.map(customer => {
    const customerBills = bills.filter(b => b.customer_id === customer.id || b.customer_name === customer.name);

    const totalBilled = customerBills.reduce((sum, b) => sum + b.total_amount, 0);
    const totalPaid = customerBills.reduce((sum, b) => sum + b.paid_amount, 0);
    const totalDue = totalBilled - totalPaid;

    return {
      ...customer,
      totalBilled,
      totalPaid,
      totalDue,
      history: customerBills
    };
  }).filter(c => {
    const searchLower = searchTerm.toLowerCase();
    return c.name.toLowerCase().includes(searchLower) || (c.mobile_number && c.mobile_number.includes(searchLower));
  });

  const toggleExpand = (id: string) => {
    setExpandedCustomerId(prev => prev === id ? null : id);
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
          <h1 className="text-2xl font-bold tracking-tight">Customer Ledger</h1>
          <p className="text-muted-foreground">Track payments and dues per customer.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
           <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search customer by name or mobile..."
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
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead className="text-right">Total Billed</TableHead>
                  <TableHead className="text-right">Total Received</TableHead>
                  <TableHead className="text-right">Total Due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerLedger.map((customer) => (
                  <React.Fragment key={customer.id}>
                    <TableRow
                      className={`cursor-pointer hover:bg-muted/50 ${expandedCustomerId === customer.id ? 'bg-muted/50' : ''}`}
                      onClick={() => toggleExpand(customer.id)}
                    >
                      <TableCell>
                        {expandedCustomerId === customer.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </TableCell>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.mobile_number || '-'}</TableCell>
                      <TableCell className="text-right">₹{customer.totalBilled.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-green-600">₹{customer.totalPaid.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        {customer.totalDue > 0 ? (
                          <span className="text-red-500 font-bold">₹{customer.totalDue.toFixed(2)}</span>
                        ) : (
                          <span className="text-green-500">Paid</span>
                        )}
                      </TableCell>
                    </TableRow>

                    {expandedCustomerId === customer.id && (
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableCell colSpan={6} className="p-4">
                           <div className="rounded-md border bg-background">
                             <div className="p-3 bg-muted/20 border-b font-medium text-sm">Transaction History</div>
                             <Table>
                               <TableHeader>
                                 <TableRow>
                                   <TableHead className="text-xs">Date</TableHead>
                                   <TableHead className="text-xs">Bill #</TableHead>
                                   <TableHead className="text-xs text-right">Bill Amount</TableHead>
                                   <TableHead className="text-xs text-right">Paid</TableHead>
                                   <TableHead className="text-xs text-right">Due</TableHead>
                                 </TableRow>
                               </TableHeader>
                               <TableBody>
                                 {customer.history.length === 0 ? (
                                   <TableRow>
                                     <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-4">No transactions found.</TableCell>
                                   </TableRow>
                                 ) : (
                                   customer.history.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(bill => {
                                      const billDue = bill.total_amount - bill.paid_amount;
                                      return (
                                       <TableRow key={bill.id}>
                                         <TableCell className="text-xs">{format(new Date(bill.date), 'dd/MM/yyyy')}</TableCell>
                                         <TableCell className="text-xs font-medium">{bill.bill_number}</TableCell>
                                         <TableCell className="text-xs text-right">₹{bill.total_amount}</TableCell>
                                         <TableCell className="text-xs text-right text-green-600">₹{bill.paid_amount}</TableCell>
                                         <TableCell className="text-xs text-right text-red-500">{billDue > 0 ? `₹${billDue}` : '-'}</TableCell>
                                       </TableRow>
                                      );
                                   })
                                 )}
                               </TableBody>
                             </Table>
                           </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
                {customerLedger.length === 0 && (
                   <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No customers found.
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
