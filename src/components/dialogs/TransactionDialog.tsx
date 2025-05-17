
"use client";

import React from 'react';
import type { Transaction } from '@/lib/types';
import { TransactionForm } from '@/components/forms/TransactionForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { formatISO, isValid } from 'date-fns';

interface TransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (data: Omit<Transaction, 'id' | 'created_at' | 'shopkeeperId'> & { date: string }) => Promise<void>; // onSubmit is now async
  initialData?: Transaction | null;
}

export function TransactionDialog({ isOpen, onOpenChange, onSubmit, initialData }: TransactionDialogProps) {
  const handleSubmit = async (data: { date: Date, goodsGiven: number, moneyReceived: number }) => {
    // Ensure date is valid before formatting. If not, default to current date string.
    const dateString = data.date && isValid(data.date) ? formatISO(data.date) : formatISO(new Date());
    
    await onSubmit({ // Call await here
      ...data,
      date: dateString, 
    });
    onOpenChange(false); // Close dialog on submit
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Transaction' : 'Add New Transaction'}</DialogTitle>
          <DialogDescription>
            {initialData ? 'Update the details of this transaction.' : 'Enter the details for the new transaction.'}
          </DialogDescription>
        </DialogHeader>
        <TransactionForm 
          onSubmit={handleSubmit} // onSubmit in TransactionForm can now be async
          initialData={initialData} 
          onCancel={() => onOpenChange(false)} 
        />
      </DialogContent>
    </Dialog>
  );
}
