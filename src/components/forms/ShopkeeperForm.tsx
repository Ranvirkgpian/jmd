
"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Shopkeeper } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea'; // Added Textarea
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const shopkeeperSchema = z.object({
  name: z.string().min(1, { message: "Shopkeeper name is required." }).max(100, { message: "Name cannot exceed 100 characters." }),
  mobileNumber: z.string()
    .max(15, { message: "Mobile number cannot exceed 15 characters." })
    .optional()
    .or(z.literal('')) 
    .transform(value => value === '' ? undefined : value),
  address: z.string()
    .max(255, { message: "Address cannot exceed 255 characters."})
    .optional()
    .or(z.literal(''))
    .transform(value => value === '' ? undefined : value),
});

type ShopkeeperFormData = z.infer<typeof shopkeeperSchema>;

interface ShopkeeperFormProps {
  onSubmit: (data: ShopkeeperFormData) => void | Promise<void>;
  initialData?: Shopkeeper | null;
  onCancel?: () => void;
}

export function ShopkeeperForm({ onSubmit, initialData, onCancel }: ShopkeeperFormProps) {
  const form = useForm<ShopkeeperFormData>({
    resolver: zodResolver(shopkeeperSchema),
    defaultValues: initialData 
      ? { 
          name: initialData.name, 
          mobileNumber: initialData.mobileNumber || '',
          address: initialData.address || '' 
        } 
      : { name: '', mobileNumber: '', address: '' },
  });

  const handleSubmit = async (data: ShopkeeperFormData) => {
    await onSubmit(data);
    form.reset(); 
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Shopkeeper Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter shopkeeper name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="mobileNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mobile Number (Optional)</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="Enter mobile number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter address" {...field} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-3">
          {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {form.formState.isSubmitting ? (initialData ? 'Saving...' : 'Adding...') : (initialData ? 'Save Changes' : 'Add Shopkeeper')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
