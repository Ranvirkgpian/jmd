
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ProductForm } from '@/components/forms/ProductForm';
import { useData } from '@/contexts/DataContext';

export function AddProductDialog() {
  const [open, setOpen] = React.useState(false);
  const { addProduct } = useData();

  const handleSubmit = async (data: { name: string; cost_price: number; selling_price: number }) => {
    await addProduct(data);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Enter the details of the new product here.
          </DialogDescription>
        </DialogHeader>
        <ProductForm onSubmit={handleSubmit} onCancel={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
