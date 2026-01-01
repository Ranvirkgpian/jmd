import React, { useMemo } from 'react';
import { Bill, BillSettings, BillCustomer } from '@/lib/types';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { generateBillPDF } from '@/lib/pdfGenerator';

interface BillDetailsProps {
  bill: Bill;
  settings: BillSettings | null;
  customer?: BillCustomer;
}

export const BillDetails: React.FC<BillDetailsProps> = ({ bill, settings, customer }) => {
  const { transactions, shopkeepers } = useData();

  const dueAmount = useMemo(() => {
    // Attempt to find shopkeeper by name
    const shopkeeper = shopkeepers.find(s => s.name.toLowerCase() === bill.customer_name.toLowerCase());

    if (shopkeeper) {
      const shopkeeperTransactions = transactions.filter(t => t.shopkeeperId === shopkeeper.id);
      const totalGoodsGiven = shopkeeperTransactions.reduce((sum, t) => sum + t.goodsGiven, 0);
      const totalMoneyReceived = shopkeeperTransactions.reduce((sum, t) => sum + t.moneyReceived, 0);
      const balance = totalGoodsGiven - totalMoneyReceived;
      // Requirement: If balance < 0, due amount is 0
      return balance < 0 ? 0 : balance;
    }
    return undefined;
  }, [bill.customer_name, shopkeepers, transactions]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-semibold text-muted-foreground">Customer:</span>
          <div className="text-lg">{bill.customer_name}</div>
          {customer?.address && (
             <div className="text-muted-foreground">{customer.address}</div>
          )}
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
                <TableCell className="text-right">{item.rate.toFixed(2)}</TableCell>
                <TableCell className="text-right">{item.amount.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end text-right space-y-1 flex-col">
         <div className="flex justify-between w-48 self-end">
           <span>Subtotal:</span>
           <span>{bill.subtotal.toFixed(2)}</span>
         </div>
         {bill.discount_amount > 0 && (
           <div className="flex justify-between w-48 self-end text-green-600">
             <span>Discount:</span>
             <span>-{bill.discount_amount.toFixed(2)}</span>
           </div>
         )}
         {bill.tax_amount > 0 && (
           <div className="flex justify-between w-48 self-end text-slate-600">
             <span>Tax:</span>
             <span>+{bill.tax_amount.toFixed(2)}</span>
           </div>
         )}
         <div className="flex justify-between w-48 self-end font-bold text-lg border-t pt-2 mt-2">
           <span>Total:</span>
           <span>{bill.total_amount.toFixed(2)}</span>
         </div>
          <div className="flex justify-between w-48 self-end text-sm text-muted-foreground">
           <span>Paid:</span>
           <span>{bill.paid_amount.toFixed(2)}</span>
         </div>
      </div>

      <div className="flex justify-center pt-4">
         <Button variant="outline" onClick={() => generateBillPDF(bill, settings, customer?.address, dueAmount)}>
           <Download className="mr-2 w-4 h-4" /> Download PDF
         </Button>
      </div>
    </div>
  );
};
