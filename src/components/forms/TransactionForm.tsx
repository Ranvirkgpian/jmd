
"use client";

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Transaction } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DatePicker } from '@/components/ui/datepicker'; // Assuming you created this
import { parseISO } from 'date-fns';

const transactionSchema = z.object({
  date: z.date({ required_error: "Please select a date." }),
  description: z.string().min(1, "Description is required.").max(200, "Description cannot exceed 200 characters."),
  goodsGiven: z.coerce.number().min(0, "Value must be non-negative.").default(0),
  moneyReceived: z.coerce.number().min(0, "Value must be non-negative.").default(0),
}).refine(data => data.goodsGiven > 0 || data.moneyReceived > 0, {
  message: "Either Goods Given or Money Received must have a value greater than 0.",
  path: ["goodsGiven"], // You can point this error to one field or make it a form-level error
});


type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  onSubmit: (data: TransactionFormData) => void;
  initialData?: Transaction | null;
  onCancel?: () => void;
}

export function TransactionForm({ onSubmit, initialData, onCancel }: TransactionFormProps) {
  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: initialData 
      ? { 
          ...initialData, 
          date: initialData.date ? parseISO(initialData.date) : new Date(),
          goodsGiven: initialData.goodsGiven ?? 0,
          moneyReceived: initialData.moneyReceived ?? 0,
        } 
      : { 
          date: new Date(), 
          description: '', 
          goodsGiven: 0, 
          moneyReceived: 0 
        },
  });

  const handleSubmit = (data: TransactionFormData) => {
    onSubmit(data);
    form.reset({ date: new Date(), description: '', goodsGiven: 0, moneyReceived: 0 });
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
          name="description"
          render={({ field }) => (
            <FormItem>
              {/* <FormLabel>Description</FormLabel> */}
              <FormControl>
                <Textarea placeholder="Enter transaction details" {...field} />
              </FormControl>
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
         {form.formState.errors.goodsGiven && !form.formState.errors.goodsGiven.ref && (
             <p className="text-sm font-medium text-destructive">{form.formState.errors.goodsGiven.message}</p>
        )}


        <div className="flex justify-end space-x-3 pt-2">
          {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
          <Button type="submit">{initialData ? 'Save Changes' : 'Add Transaction'}</Button>
        </div>
      </form>
    </Form>
  );
}
