'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useBill } from '@/contexts/BillContext';
import { useData } from '@/contexts/DataContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { format } from 'date-fns';
import { ArrowLeft, CalendarIcon, Plus, Trash2, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useToast } from '@/hooks/use-toast';
import { BillCustomer, Product } from '@/lib/types';

interface BillFormValues {
  customerId: string; // If existing
  customerName: string; // Display/Input name
  customerMobile: string;
  customerAddress: string;
  date: Date;
  items: {
    productName: string;
    quantity: number;
    rate: number;
    amount: number;
  }[];
  discount: number;
  tax: number;
  paidAmount: number;
  paymentMethod: string;
}

function CreateBillForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { customers, bills, addCustomer, addBill, updateBill, settings } = useBill();
  const { products, shopkeepers } = useData();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editBillId, setEditBillId] = useState<string | null>(null);

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<BillFormValues>({
    defaultValues: {
      date: new Date(),
      items: [{ productName: '', quantity: 1, rate: 0, amount: 0 }],
      discount: 0,
      tax: 0,
      paidAmount: 0,
      paymentMethod: 'Cash',
      customerName: '',
      customerMobile: '',
      customerAddress: '',
      customerId: '',
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  // Handle URL query param for customerId or edit
  useEffect(() => {
    const queryEditId = searchParams.get('edit');
    const queryCustomerId = searchParams.get('customerId');

    if (queryEditId) {
      // Edit Mode
      setEditMode(true);
      setEditBillId(queryEditId);
      const billToEdit = bills.find(b => b.id === queryEditId);

      if (billToEdit) {
        const customer = customers.find(c => c.id === billToEdit.customer_id);

        reset({
          customerId: billToEdit.customer_id,
          customerName: billToEdit.customer_name,
          customerMobile: customer?.mobile_number || '',
          customerAddress: customer?.address || '',
          date: new Date(billToEdit.date),
          items: billToEdit.items?.map(item => ({
            productName: item.product_name,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.amount
          })) || [],
          discount: billToEdit.discount_amount,
          tax: billToEdit.tax_amount,
          paidAmount: billToEdit.paid_amount,
          paymentMethod: billToEdit.payment_method || 'Cash'
        });
      }
    } else if (queryCustomerId) {
      // New Bill with Pre-filled Customer
      const existingCustomer = customers.find(c => c.id === queryCustomerId);
      if (existingCustomer) {
        setValue('customerId', existingCustomer.id);
        setValue('customerName', existingCustomer.name);
        setValue('customerMobile', existingCustomer.mobile_number || '');
        setValue('customerAddress', existingCustomer.address || '');
      }
    }
  }, [searchParams, customers, bills, setValue, reset]);

  // Watch values for calculations
  const items = watch('items');
  const discount = watch('discount') || 0;
  const tax = watch('tax') || 0;

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalAmount = subtotal - Number(discount) + Number(tax);

  // Auto-calculate row amount when qty or rate changes
  useEffect(() => {
    items.forEach((item, index) => {
      const calculated = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
      if (calculated !== item.amount) {
        setValue(`items.${index}.amount`, calculated);
      }
    });
  }, [items, setValue]);

  const onSubmit = async (data: BillFormValues) => {
    if (items.length === 0) {
      toast({ title: "Error", description: "Please add at least one item.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      let finalCustomerId = data.customerId;

      // Create customer if new (simple logic: if no ID but has name)
      if (!finalCustomerId && data.customerName) {
         // Check if customer name already exists in list to avoid duplicates if user just typed it
         const existing = customers.find(c => c.name.toLowerCase() === data.customerName.toLowerCase());
         if (existing) {
           finalCustomerId = existing.id;
         } else {
           const newCust = await addCustomer({
             name: data.customerName,
             mobile_number: data.customerMobile,
             address: data.customerAddress
           });
           if (newCust) finalCustomerId = newCust.id;
         }
      }

      const billPayload = {
        customer_id: finalCustomerId,
        customer_name: data.customerName,
        date: data.date.toISOString(),
        subtotal: subtotal,
        discount_amount: data.discount,
        tax_amount: data.tax,
        total_amount: totalAmount,
        paid_amount: data.paidAmount,
        payment_method: data.paymentMethod,
      };

      const itemsPayload = data.items.map(item => ({
        product_name: item.productName,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount
      }));

      if (editMode && editBillId) {
         await updateBill(editBillId, billPayload, itemsPayload);
         toast({
          title: "Bill Updated",
          description: "The bill has been successfully updated.",
        });
      } else {
        await addBill(billPayload, itemsPayload);
        toast({
          title: "Bill Created",
          description: "The bill has been successfully generated.",
        });
      }

      router.push('/bill-book/today'); // Redirect to today's bills
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: `Failed to ${editMode ? 'update' : 'create'} bill.`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Link href="/bill-book">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{editMode ? 'Edit Bill' : 'Create New Bill'}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Customer & Date Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Customer Name</Label>
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <Input
                    placeholder="Type customer name"
                    {...register('customerName', {
                      required: true,
                      onChange: (e) => {
                         setValue('customerId', '');
                      }
                    })}
                  />
                </div>
                <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" title="Search Existing Customer">
                      <Search className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="end">
                    <Command>
                      <CommandInput placeholder="Search customer..." />
                      <CommandList>
                        <CommandEmpty>No customer found.</CommandEmpty>

                        <CommandGroup heading="Bill Customers">
                          {customers.map((customer) => (
                            <CommandItem
                              key={customer.id}
                              value={`C:${customer.name}`}
                              onSelect={() => {
                                setValue('customerName', customer.name);
                                setValue('customerId', customer.id);
                                setValue('customerMobile', customer.mobile_number || '');
                                setValue('customerAddress', customer.address || '');
                                setCustomerSearchOpen(false);
                              }}
                            >
                              {customer.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>

                        <CommandSeparator />

                        <CommandGroup heading="Shopkeepers">
                          {shopkeepers.map((shopkeeper) => (
                            <CommandItem
                              key={shopkeeper.id}
                              value={`S:${shopkeeper.name}`}
                              onSelect={() => {
                                setValue('customerName', shopkeeper.name);
                                setValue('customerId', ''); // New to bill book
                                setValue('customerMobile', shopkeeper.mobileNumber || '');
                                setValue('customerAddress', shopkeeper.address || '');
                                setCustomerSearchOpen(false);
                              }}
                            >
                              {shopkeeper.name} (Shopkeeper)
                            </CommandItem>
                          ))}
                        </CommandGroup>

                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !watch('date') && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {watch('date') ? format(watch('date'), "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={watch('date')}
                    onSelect={(date) => {
                       if(date) setValue('date', date);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Mobile Number</Label>
              <Input {...register('customerMobile')} placeholder="+91..." />
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              <Input {...register('customerAddress')} placeholder="City / Address" />
            </div>
          </CardContent>
        </Card>

        {/* Product Items Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Items</CardTitle>
            <Button type="button" size="sm" onClick={() => append({ productName: '', quantity: 1, rate: 0, amount: 0 })}>
              <Plus className="w-4 h-4 mr-2" /> Add Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-2 items-end border-b pb-4 mb-4">
                <div className="col-span-12 md:col-span-4 space-y-1">
                  <Label className="text-xs">Product</Label>
                  <div className="relative">
                     {/* Simple autocomplete for products */}
                     <Input
                       {...register(`items.${index}.productName` as const, { required: true })}
                       placeholder="Product Name"
                       list={`products-list-${index}`}
                       autoComplete="off"
                       onChange={(e) => {
                          const val = e.target.value;
                          setValue(`items.${index}.productName`, val);
                          // Try to find product to auto-fill rate
                          const found = products.find(p => p.name.toLowerCase() === val.toLowerCase());
                          if (found) {
                             setValue(`items.${index}.rate`, found.selling_price);
                          }
                       }}
                     />
                     <datalist id={`products-list-${index}`}>
                        {products.map(p => <option key={p.id} value={p.name} />)}
                     </datalist>
                  </div>
                </div>

                <div className="col-span-4 md:col-span-2 space-y-1">
                  <Label className="text-xs">Qty</Label>
                  <Input
                    type="number"
                    min="1"
                    {...register(`items.${index}.quantity` as const, { required: true })}
                  />
                </div>

                <div className="col-span-4 md:col-span-2 space-y-1">
                  <Label className="text-xs">Rate</Label>
                  <Input
                    type="number"
                    min="0"
                    {...register(`items.${index}.rate` as const, { required: true })}
                  />
                </div>

                <div className="col-span-3 md:col-span-3 space-y-1">
                  <Label className="text-xs">Amount</Label>
                  <Input
                    type="number"
                    readOnly
                    className="bg-muted"
                    {...register(`items.${index}.amount` as const)}
                  />
                </div>

                <div className="col-span-1 md:col-span-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Totals & Payment */}
        <Card>
          <CardContent className="pt-6">
             <div className="flex flex-col md:flex-row justify-end gap-8">
                <div className="w-full md:w-1/3 space-y-4">
                   <div className="flex justify-between items-center">
                      <Label>Subtotal</Label>
                      <span className="font-semibold">{subtotal.toFixed(2)}</span>
                   </div>

                   <div className="flex items-center gap-2">
                      <Label className="w-20">Discount</Label>
                      <Input type="number" {...register('discount')} className="text-right" placeholder="0" />
                   </div>

                   <div className="flex items-center gap-2">
                      <Label className="w-20">Tax (+)</Label>
                      <Input type="number" {...register('tax')} className="text-right" placeholder="0" />
                   </div>

                   <div className="border-t pt-2 flex justify-between items-center text-lg font-bold">
                      <span>Total</span>
                      <span>{totalAmount.toFixed(2)}</span>
                   </div>

                   <div className="border-t pt-4 space-y-4">
                      <div className="space-y-2">
                        <Label>Paid Amount</Label>
                        <Input
                          type="number"
                          {...register('paidAmount')}
                          className="text-right font-medium"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Payment Method</Label>
                        <Select onValueChange={(val) => setValue('paymentMethod', val)} defaultValue="Cash">
                           <SelectTrigger>
                             <SelectValue placeholder="Select method" />
                           </SelectTrigger>
                           <SelectContent>
                             {settings?.payment_methods?.map((m: string) => (
                               <SelectItem key={m} value={m}>{m}</SelectItem>
                             )) || (
                               <>
                                 <SelectItem value="Cash">Cash</SelectItem>
                                 <SelectItem value="UPI">UPI</SelectItem>
                                 <SelectItem value="Card">Card</SelectItem>
                               </>
                             )}
                           </SelectContent>
                        </Select>
                      </div>

                      <div className="flex justify-between items-center text-red-600 font-medium">
                         <span>Balance Due</span>
                         <span>{(totalAmount - (watch('paidAmount') || 0)).toFixed(2)}</span>
                      </div>
                   </div>
                </div>
             </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
           <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
           <Button type="submit" size="lg" disabled={isSubmitting}>
             {isSubmitting && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
             {editMode ? 'Update Bill' : 'Save & Generate Bill'}
           </Button>
        </div>

      </form>
    </div>
  );
}

export default function CreateBillPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-10"><Loader2 className="animate-spin w-8 h-8 text-muted-foreground" /></div>}>
      <CreateBillForm />
    </Suspense>
  );
}
