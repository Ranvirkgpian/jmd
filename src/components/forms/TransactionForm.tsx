
"use client";

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Transaction } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DatePicker } from '@/components/ui/datepicker';
import { parseISO, isValid } from 'date-fns';

const transactionSchema = z.object({
  date: z.date({ required_error: "Please select a date." }),
  goodsGiven: z.coerce.number().min(0, "Value must be non-negative.").default(0),
  moneyReceived: z.coerce.number().min(0, "Value must be non-negative.").default(0),
}).refine(data => data.goodsGiven > 0 || data.moneyReceived > 0, {
  message: "Either Goods Given or Money Received must have a value greater than 0.",
  path: ["goodsGiven"], 
});


type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  onSubmit: (data: TransactionFormData) => void | Promise<void>; // onSubmit can be async
  initialData?: Transaction | null;
  onCancel?: () => void;
}

export function TransactionForm({ onSubmit, initialData, onCancel }: TransactionFormProps) {
  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: initialData
      ? {
          date: initialData.date && isValid(parseISO(initialData.date)) ? parseISO(initialData.date) : new Date(),
          goodsGiven: initialData.goodsGiven ?? 0,
          moneyReceived: initialData.moneyReceived ?? 0,
        }
      : {
          date: new Date(),
          goodsGiven: 0,
          moneyReceived: 0
        },
  });

  const handleSubmit = async (data: TransactionFormData) => {
    await onSubmit(data); // onSubmit can now be async
    form.reset({ date: new Date(), goodsGiven: 0, moneyReceived: 0 });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Controller
                name="date"
                control={form.control}
                render={({ field: { onChange, value } }) => (
                  <DatePicker
                    value={value}
                    onChange={onChange}
                  />
                )}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="goodsGiven"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Goods Given (Value)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="moneyReceived"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Money Received</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {form.formState.errors.root && (
             <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>
        )}
         {form.formState.errors.goodsGiven && !form.formState.errors.goodsGiven.ref && ( // Check if it's the custom refine error
             <p className="text-sm font-medium text-destructive">{form.formState.errors.goodsGiven.message}</p>
        )}

        <div className="flex justify-end space-x-3 pt-2">
          {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (initialData ? 'Saving...' : 'Adding...') : (initialData ? 'Save Changes' : 'Add Transaction')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
