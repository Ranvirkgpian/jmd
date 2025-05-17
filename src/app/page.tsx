
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useData } from '@/contexts/DataContext';
import type { Shopkeeper } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShopkeeperDialog } from '@/components/dialogs/ShopkeeperDialog';
import { ConfirmationDialog } from '@/components/dialogs/ConfirmationDialog';
import { PlusCircle, Edit3, Trash2, Eye, PackageSearch, Loader2, Search, Phone } from 'lucide-react';
import { format } from 'date-fns';

export default function HomePage() {
  const { shopkeepers, addShopkeeper, updateShopkeeper, deleteShopkeeper } = useData();
  const [isShopkeeperDialogOpen, setIsShopkeeperDialogOpen] = useState(false);
  const [editingShopkeeper, setEditingShopkeeper] = useState<Shopkeeper | null>(null);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [shopkeeperToDelete, setShopkeeperToDelete] = useState<Shopkeeper | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleAddShopkeeper = () => {
    setEditingShopkeeper(null);
    setIsShopkeeperDialogOpen(true);
  };

  const handleEditShopkeeper = (shopkeeper: Shopkeeper) => {
    setEditingShopkeeper(shopkeeper);
    setIsShopkeeperDialogOpen(true);
  };

  const handleDeleteShopkeeper = (shopkeeper: Shopkeeper) => {
    setShopkeeperToDelete(shopkeeper);
    setIsConfirmDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (shopkeeperToDelete) {
      deleteShopkeeper(shopkeeperToDelete.id);
      setShopkeeperToDelete(null);
    }
  };

  const handleShopkeeperFormSubmit = (data: { name: string; mobileNumber?: string }) => {
    if (editingShopkeeper) {
      updateShopkeeper(editingShopkeeper.id, data.name, data.mobileNumber);
    } else {
      addShopkeeper(data.name, data.mobileNumber);
    }
    setEditingShopkeeper(null);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const filteredShopkeepers = useMemo(() => {
    if (!searchQuery) {
      return shopkeepers;
    }
    return shopkeepers.filter(shopkeeper =>
      shopkeeper.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [shopkeepers, searchQuery]);


  if (!isMounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-muted-foreground">
        <Loader2 className="h-12 w-12 animate-spin mb-4" />
        <p className="text-lg">Loading shopkeepers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-semibold tracking-tight">Shopkeepers</h2>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search shopkeepers..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-9 shadow-sm w-full bg-secondary"
              aria-label="Search shopkeepers"
            />
          </div>
          <Button onClick={handleAddShopkeeper} className="shadow-md w-full sm:w-auto">
            <PlusCircle className="mr-2 h-5 w-5" /> Add Shopkeeper
          </Button>
        </div>
      </div>

      {shopkeepers.length === 0 && !searchQuery ? (
        <Card className="text-center py-12 shadow-lg">
          <CardHeader>
            <div className="mx-auto bg-secondary p-4 rounded-full w-fit">
              <PackageSearch className="h-12 w-12 text-muted-foreground" />
            </div>
            <CardTitle className="mt-4 text-2xl">No Shopkeepers Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Click "Add Shopkeeper" to get started.</p>
          </CardContent>
        </Card>
      ) : filteredShopkeepers.length === 0 ? (
        <Card className="text-center py-12 shadow-lg">
          <CardHeader>
            <div className="mx-auto bg-secondary p-4 rounded-full w-fit">
              <PackageSearch className="h-12 w-12 text-muted-foreground" />
            </div>
            <CardTitle className="mt-4 text-2xl">No Shopkeepers Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              No shopkeepers match your search criteria. Try a different search or add a new shopkeeper.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...filteredShopkeepers]
            .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((shopkeeper) => (
            <Card key={shopkeeper.id} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-xl">{shopkeeper.name}</CardTitle>
                <CardDescription>
                  Added: {format(new Date(shopkeeper.createdAt), "PPP")}
                </CardDescription>
                {shopkeeper.mobileNumber && (
                  <CardDescription className="flex items-center text-sm pt-1">
                    <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                    {shopkeeper.mobileNumber}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex-grow">
                {/* Future content related to shopkeeper summary can go here */}
              </CardContent>
              <CardFooter className="flex justify-end space-x-2 border-t pt-4">
                <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none">
                  <Link href={`/shopkeepers/${shopkeeper.id}`}>
                    <Eye className="mr-2 h-4 w-4" /> View Transactions
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleEditShopkeeper(shopkeeper)} aria-label="Edit shopkeeper">
                  <Edit3 className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteShopkeeper(shopkeeper)} aria-label="Delete shopkeeper" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-5 w-5" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <ShopkeeperDialog
        isOpen={isShopkeeperDialogOpen}
        onOpenChange={setIsShopkeeperDialogOpen}
        onSubmit={handleShopkeeperFormSubmit}
        initialData={editingShopkeeper}
      />
      <ConfirmationDialog
        isOpen={isConfirmDeleteDialogOpen}
        onOpenChange={setIsConfirmDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Shopkeeper"
        description={`Are you sure you want to delete ${shopkeeperToDelete?.name}? This action will also delete all associated transactions and cannot be undone.`}
        confirmButtonText="Delete"
      />
    </div>
  );
}
