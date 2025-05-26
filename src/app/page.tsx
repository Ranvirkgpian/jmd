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
import { PlusCircle, Edit3, Trash2, Eye, PackageSearch, Loader2, Search, Phone, MapPin, Store } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function HomePage() {
  const { 
    shopkeepers, 
    loadingShopkeepers, 
    addShopkeeper, 
    updateShopkeeper, 
    deleteShopkeeper 
  } = useData();
  const { toast } = useToast();

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

  const confirmDelete = async () => {
    if (shopkeeperToDelete) {
      await deleteShopkeeper(shopkeeperToDelete.id);
      setShopkeeperToDelete(null);
    }
  };

  const handleShopkeeperFormSubmit = async (data: { name: string; mobileNumber?: string; address?: string }) => {
    if (editingShopkeeper) {
      await updateShopkeeper(editingShopkeeper.id, data.name, data.mobileNumber, data.address);
    } else {
      await addShopkeeper(data.name, data.mobileNumber, data.address);
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


  if (!isMounted || loadingShopkeepers) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-muted-foreground">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin mb-4 mx-auto" />
          <p className="text-lg font-medium">Loading shopkeepers...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8 px-4 sm:px-6 max-w-7xl mx-auto py-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-baseline gap-3"
        >
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Shopkeepers
          </h2>
          <span className="text-xl font-medium text-muted-foreground">
            ({shopkeepers.length})
          </span>
        </motion.div>
        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto"
        >
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search shopkeepers..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 pr-4 h-11 w-full bg-background border-border/50 focus:border-primary shadow-sm hover:border-border transition-colors"
            />
          </div>
          <Button 
            onClick={handleAddShopkeeper} 
            className="h-11 shadow-md bg-primary hover:bg-primary/90 transition-colors duration-200"
          >
            <PlusCircle className="mr-2 h-5 w-5" /> Add Shopkeeper
          </Button>
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        {shopkeepers.length === 0 && !searchQuery ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="text-center py-16 shadow-lg border-dashed">
              <CardHeader>
                <div className="mx-auto bg-primary/10 p-6 rounded-full w-fit">
                  <Store className="h-16 w-16 text-primary" />
                </div>
                <CardTitle className="mt-6 text-2xl font-bold">No Shopkeepers Yet</CardTitle>
                <CardDescription className="mt-2 text-lg">
                  Get started by adding your first shopkeeper
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleAddShopkeeper}
                  className="mt-4 bg-primary hover:bg-primary/90 transition-colors duration-200"
                >
                  <PlusCircle className="mr-2 h-5 w-5" /> Add Your First Shopkeeper
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : filteredShopkeepers.length === 0 ? (
          <motion.div
            key="no-results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="text-center py-16 shadow-lg">
              <CardHeader>
                <div className="mx-auto bg-secondary p-6 rounded-full w-fit">
                  <PackageSearch className="h-16 w-16 text-muted-foreground" />
                </div>
                <CardTitle className="mt-6 text-2xl">No Results Found</CardTitle>
                <CardDescription className="mt-2 text-lg">
                  Try adjusting your search or add a new shopkeeper
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[...filteredShopkeepers]
              .sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .map((shopkeeper) => (
                <motion.div key={shopkeeper.id} variants={item}>
                  <Card className="group flex flex-col h-full shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <CardHeader>
                      <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors">
                        {shopkeeper.name}
                      </CardTitle>
                      {shopkeeper.mobileNumber && (
                        <CardDescription className="flex items-center text-sm pt-2">
                          <Phone className="mr-2 h-4 w-4 text-primary/70" />
                          {shopkeeper.mobileNumber}
                        </CardDescription>
                      )}
                      {shopkeeper.address && (
                        <CardDescription className="flex items-start text-sm pt-2">
                          <MapPin className="mr-2 h-4 w-4 text-primary/70 mt-0.5 flex-shrink-0" />
                          <span className="whitespace-pre-wrap">{shopkeeper.address}</span>
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="flex-grow">
                      {/* Future content */}
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2 border-t pt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        asChild 
                        className="flex-1 bg-background hover:bg-primary/5 transition-colors"
                      >
                        <Link href={`/shopkeepers/${shopkeeper.id}`}>
                          <Eye className="mr-2 h-4 w-4" /> View Transactions
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEditShopkeeper(shopkeeper)}
                        className="hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <Edit3 className="h-5 w-5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteShopkeeper(shopkeeper)}
                        className="hover:bg-destructive/10 hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
          </motion.div>
        )}
      </AnimatePresence>

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
    </motion.div>
  );
}
