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
import { PlusCircle, Edit3, Trash2, Eye, PackageSearch, Loader2, Search, Phone, MapPin, Store, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 10 },
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
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <Loader2 className="h-10 w-10 animate-spin mb-4 mx-auto text-primary" />
          <p className="text-base font-medium">Loading shopkeepers...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Section with Improved Search */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-border/40">
        <motion.div 
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="space-y-1"
        >
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Shopkeepers
            </h2>
            <Badge variant="secondary" className="text-sm sm:text-base px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">
              {shopkeepers.length}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Manage your shopkeepers and view their transaction history.
          </p>
        </motion.div>

        <motion.div 
          initial={{ x: 10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-col sm:flex-row items-stretch gap-3 w-full lg:w-auto"
        >
          <div className="relative w-full sm:w-[320px] group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <Input
              type="search"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 h-11 bg-background border-border focus:border-primary/50 shadow-sm transition-all hover:shadow-md"
            />
          </div>
          <Button 
            onClick={handleAddShopkeeper} 
            className="h-11 shadow-md bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] transition-all duration-200 font-semibold"
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Add Shopkeeper
          </Button>
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        {shopkeepers.length === 0 && !searchQuery ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="flex justify-center py-12"
          >
            <Card className="text-center py-12 px-6 shadow-sm border-dashed max-w-md w-full bg-secondary/20">
              <CardHeader className="space-y-4">
                <div className="mx-auto bg-background p-4 rounded-full shadow-sm ring-1 ring-border">
                  <Store className="h-10 w-10 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold">No Shopkeepers Yet</CardTitle>
                  <CardDescription className="mt-2">
                    Get started by adding your first shopkeeper to the system.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleAddShopkeeper}
                  className="w-full sm:w-auto mt-2"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add First Shopkeeper
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : filteredShopkeepers.length === 0 ? (
          <motion.div
            key="no-results"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex justify-center py-12"
          >
            <div className="text-center space-y-3">
              <div className="mx-auto bg-muted p-4 rounded-full w-fit">
                <PackageSearch className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No results found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                We couldn't find any shopkeepers matching "{searchQuery}". Try a different search term.
              </p>
              <Button
                variant="outline"
                onClick={() => setSearchQuery('')}
                className="mt-2"
              >
                Clear Search
              </Button>
            </div>
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
                  <Card className="group h-full flex flex-col hover:shadow-lg transition-all duration-300 border-border/60 hover:border-primary/30 relative overflow-hidden bg-card">

                    {/* Top Accent Line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-lg font-bold text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-1">
                          {shopkeeper.name}
                        </CardTitle>
                      </div>
                      <div className="space-y-1.5 pt-2">
                        {shopkeeper.mobileNumber ? (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Phone className="mr-2 h-3.5 w-3.5 text-primary/70" />
                            <span className="font-medium text-foreground/80">{shopkeeper.mobileNumber}</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-sm text-muted-foreground/50">
                             <Phone className="mr-2 h-3.5 w-3.5" />
                             <span>No mobile number</span>
                          </div>
                        )}

                        {shopkeeper.address ? (
                          <div className="flex items-start text-sm text-muted-foreground">
                            <MapPin className="mr-2 h-3.5 w-3.5 text-primary/70 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{shopkeeper.address}</span>
                          </div>
                        ) : (
                           <div className="flex items-start text-sm text-muted-foreground/50">
                            <MapPin className="mr-2 h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                            <span>No address provided</span>
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    <div className="flex-grow" /> {/* Spacer */}

                    <CardFooter className="pt-3 border-t bg-secondary/10 flex gap-2">
                      <Button 
                        variant="default"
                        size="sm" 
                        asChild 
                        className="flex-1 bg-white text-foreground hover:bg-white hover:text-primary border border-input shadow-sm hover:shadow transition-all group/btn"
                      >
                        <Link href={`/shopkeepers/${shopkeeper.id}`} className="flex items-center justify-center">
                          View Details
                          <ChevronRight className="ml-1 h-3.5 w-3.5 opacity-50 group-hover/btn:translate-x-0.5 transition-transform" />
                        </Link>
                      </Button>
                      <div className="flex gap-1 border-l pl-2 border-border/50">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditShopkeeper(shopkeeper)}
                          className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                          title="Edit"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteShopkeeper(shopkeeper)}
                          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
        description={`Are you sure you want to delete ${shopkeeperToDelete?.name}? This action will also delete all associated transactions.`}
        confirmButtonText="Delete"
      />
    </div>
  );
}
