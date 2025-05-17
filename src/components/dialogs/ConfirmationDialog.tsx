
"use client";

import React, { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Import Input
import { Label } from '@/components/ui/label';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

export function ConfirmationDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
}: ConfirmationDialogProps) {
  const [confirmationText, setConfirmationText] = useState('');

  useEffect(() => {
    // Reset confirmation text when dialog is closed
    if (!isOpen) {
      setConfirmationText('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (confirmationText === 'delete') {
      onConfirm();
      onOpenChange(false); // This will also trigger the useEffect to clear text
    }
  };

  const handleCancel = () => {
    onOpenChange(false); // This will also trigger the useEffect to clear text
  }

  const isConfirmDisabled = confirmationText !== 'delete';

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2 my-4">
          <Label htmlFor="delete-confirm-input" className="text-sm font-medium text-muted-foreground">
            To confirm, type "delete" in the box below.
          </Label>
          <Input
            id="delete-confirm-input"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            placeholder="delete"
            className="bg-secondary"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>{cancelButtonText}</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} asChild>
            <Button variant="destructive" disabled={isConfirmDisabled}>
              {confirmButtonText}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
