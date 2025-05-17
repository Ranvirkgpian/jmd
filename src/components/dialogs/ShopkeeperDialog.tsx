"use client";

import React from 'react';
import type { Shopkeeper } from '@/lib/types';
import { ShopkeeperForm } from '@/components/forms/ShopkeeperForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface ShopkeeperDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (data: { name: string }) => void;
  initialData?: Shopkeeper | null;
}

export function ShopkeeperDialog({ isOpen, onOpenChange, onSubmit, initialData }: ShopkeeperDialogProps) {
  const handleSubmit = (data: { name: string }) => {
    onSubmit(data);
    onOpenChange(false); // Close dialog on submit
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Shopkeeper' : 'Add New Shopkeeper'}</DialogTitle>
          <DialogDescription>
            {initialData ? 'Update the details of this shopkeeper.' : 'Enter the name of the new shopkeeper.'}
          </DialogDescription>
        </DialogHeader>
        <ShopkeeperForm 
          onSubmit={handleSubmit} 
          initialData={initialData} 
          onCancel={() => onOpenChange(false)} 
        />
      </DialogContent>
    </Dialog>
  );
}
