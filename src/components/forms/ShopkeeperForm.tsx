"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Shopkeeper } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const shopkeeperSchema = z.object({
  name: z.string().min(1, { message: "Shopkeeper name is required." }).max(100, { message: "Name cannot exceed 100 characters." }),
});

type ShopkeeperFormData = z.infer<typeof shopkeeperSchema>;

interface ShopkeeperFormProps {
  onSubmit: (data: ShopkeeperFormData) => void;
  initialData?: Shopkeeper | null;
  onCancel?: () => void;
}

export function ShopkeeperForm({ onSubmit, initialData, onCancel }: ShopkeeperFormProps) {
  const form = useForm<ShopkeeperFormData>({
    resolver: zodResolver(shopkeeperSchema),
    defaultValues: initialData ? { name: initialData.name } : { name: '' },
  });

  const handleSubmit = (data: ShopkeeperFormData) => {
    onSubmit(data);
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
        <div className="flex justify-end space-x-3">
          {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
          <Button type="submit">{initialData ? 'Save Changes' : 'Add Shopkeeper'}</Button>
        </div>
      </form>
    </Form>
  );
}
