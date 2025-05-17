"use client";

import React from 'react';
import type { Transaction } from '@/lib/types';
import { TransactionForm } from '@/components/forms/TransactionForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { formatISO } from 'date-fns';

interface TransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (data: Omit<Transaction, 'id' | 'createdAt' | 'shopkeeperId'> & { date: string }) => void;
  initialData?: Transaction | null;
}

export function TransactionDialog({ isOpen, onOpenChange, onSubmit, initialData }: TransactionDialogProps) {
  const handleSubmit = (data: { date: Date, description: string, goodsGiven: number, moneyReceived: number }) => {
    onSubmit({
      ...data,
      date: formatISO(data.date), // Ensure date is string for storage
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
          onSubmit={handleSubmit} 
          initialData={initialData} 
          onCancel={() => onOpenChange(false)} 
        />
      </DialogContent>
    </Dialog>
  );
}
