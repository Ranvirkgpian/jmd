
"use client";

import React, { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardFooter, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, Trash2, Undo2, AlertTriangle, Calendar, ArrowUpRight, ArrowDownLeft, Store, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { ConfirmationDialog } from '@/components/dialogs/ConfirmationDialog';
import { Loader2 } from 'lucide-react';
import { Shopkeeper } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function RecycleBinPage() {
  const {
    deletedShopkeepers,
    deletedTransactions,
    deletedProducts,
    restoreShopkeeper,
    permanentlyDeleteShopkeeper,
    restoreTransaction,
    permanentlyDeleteTransaction,
    restoreProduct,
    permanentlyDeleteProduct,
    loadingShopkeepers,
    loadingTransactions,
    loadingProducts,
    getShopkeeperById,
    shopkeepers // We might need active shopkeepers if we are showing a deleted transaction for an active shopkeeper
  } = useData();

  const [isMounted, setIsMounted] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'shopkeeper' | 'transaction' | 'product' | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || loadingShopkeepers || loadingTransactions || loadingProducts) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />
        <p className="text-base font-medium">Loading recycled items...</p>
      </div>
    );
  }

  const handleDeleteClick = (id: string, type: 'shopkeeper' | 'transaction' | 'product') => {
    setDeleteId(id);
    setDeleteType(type);
  };

  const confirmDelete = async () => {
    if (deleteId && deleteType) {
      if (deleteType === 'shopkeeper') {
        await permanentlyDeleteShopkeeper(deleteId);
      } else if (deleteType === 'transaction') {
        await permanentlyDeleteTransaction(deleteId);
      } else if (deleteType === 'product') {
        await permanentlyDeleteProduct(deleteId);
      }
      setDeleteId(null);
      setDeleteType(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
       <div className="flex flex-col gap-2 border-b border-border/40 pb-6">
        <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Trash2 className="h-8 w-8 text-muted-foreground" />
          Recycle Bin
        </h2>
        <p className="text-muted-foreground">
          Items in the recycle bin are automatically deleted after 45 days.
        </p>
      </div>

      <Tabs defaultValue="shopkeepers" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-[600px]">
          <TabsTrigger value="shopkeepers">Shopkeepers ({deletedShopkeepers.length})</TabsTrigger>
          <TabsTrigger value="transactions">Transactions ({deletedTransactions.length})</TabsTrigger>
          <TabsTrigger value="products">Products ({deletedProducts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="shopkeepers" className="mt-6">
          <AnimatePresence mode="popLayout">
            {deletedShopkeepers.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/10 rounded-lg border border-dashed"
              >
                <div className="p-4 bg-muted rounded-full mb-3">
                  <Store className="h-8 w-8 text-muted-foreground" />
                </div>
                <p>No deleted shopkeepers found.</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {deletedShopkeepers.map((shopkeeper) => (
                  <motion.div
                    key={shopkeeper.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="flex flex-col h-full border-border/60 shadow-sm hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3 bg-muted/50 border-b border-border/10">
                        <CardTitle className="text-lg font-bold flex justify-between items-start">
                          <span className="line-clamp-1 text-foreground/80">{shopkeeper.name}</span>
                          {shopkeeper.deleted_at && (
                             <span className="text-xs font-normal text-red-500 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/20 whitespace-nowrap ml-2">
                               Deleted {format(parseISO(shopkeeper.deleted_at), 'MMM d')}
                             </span>
                          )}
                        </CardTitle>
                        <div className="space-y-1.5 pt-1">
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
                      <CardContent className="flex-grow pt-4">
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded p-3 text-xs text-amber-600 dark:text-amber-400 flex gap-2">
                            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                            <p>Restoring this shopkeeper will also restore their transaction history.</p>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-4 border-t bg-muted/5 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                          onClick={() => restoreShopkeeper(shopkeeper.id)}
                        >
                          <Undo2 className="mr-2 h-4 w-4" /> Restore
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex-1 hover:bg-red-600 shadow-sm"
                          onClick={() => handleDeleteClick(shopkeeper.id, 'shopkeeper')}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
           <AnimatePresence mode="popLayout">
            {deletedTransactions.length === 0 ? (
               <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/10 rounded-lg border border-dashed"
              >
                <div className="p-4 bg-muted rounded-full mb-3">
                  <Store className="h-8 w-8 text-muted-foreground" />
                </div>
                <p>No deleted transactions found.</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {deletedTransactions.map((transaction) => {
                  // Find shopkeeper details
                  // First check active shopkeepers
                  let shopkeeper = shopkeepers.find(s => s.id === transaction.shopkeeperId);
                  // If not found, check deleted shopkeepers
                  if (!shopkeeper) {
                    shopkeeper = deletedShopkeepers.find(s => s.id === transaction.shopkeeperId);
                  }

                  const shopkeeperName = shopkeeper ? shopkeeper.name : 'Unknown Shopkeeper';
                  const shopkeeperMobile = shopkeeper ? shopkeeper.mobileNumber : undefined;
                  const shopkeeperAddress = shopkeeper ? shopkeeper.address : undefined;

                  return (
                    <motion.div
                        key={transaction.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                    >
                      <Card className="flex flex-col h-full border-border/60 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3 bg-muted/50 border-b border-border/10">
                            {/* Mimicking Shopkeeper Card Header */}
                            <CardTitle className="text-lg font-bold flex justify-between items-start">
                            <span className="line-clamp-1 text-foreground/80">{shopkeeperName}</span>
                            {transaction.deleted_at && (
                                <span className="text-xs font-normal text-red-500 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/20 whitespace-nowrap ml-2">
                                Deleted {format(parseISO(transaction.deleted_at), 'MMM d')}
                                </span>
                            )}
                            </CardTitle>
                             <div className="space-y-1.5 pt-1">
                                {shopkeeperMobile ? (
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Phone className="mr-2 h-3.5 w-3.5 text-primary/70" />
                                    <span className="font-medium text-foreground/80">{shopkeeperMobile}</span>
                                </div>
                                ) : (
                                <div className="flex items-center text-sm text-muted-foreground/50">
                                    <Phone className="mr-2 h-3.5 w-3.5" />
                                    <span>No mobile number</span>
                                </div>
                                )}
                                {shopkeeperAddress && (
                                <div className="flex items-start text-sm text-muted-foreground">
                                    <MapPin className="mr-2 h-3.5 w-3.5 text-primary/70 mt-0.5 flex-shrink-0" />
                                    <span className="line-clamp-2">{shopkeeperAddress}</span>
                                </div>
                                )}
                            </div>
                        </CardHeader>

                        <CardContent className="flex-grow pt-4">
                            {/* Deleted Transaction Details */}
                             <div className="rounded-md border p-3 bg-background/50 space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center text-muted-foreground">
                                        <Calendar className="mr-2 h-4 w-4" />
                                        Date
                                    </div>
                                    <span className="font-medium">{format(parseISO(transaction.date), 'MMM d, yyyy')}</span>
                                </div>
                                <div className="h-px bg-border/50" />
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center text-emerald-600 dark:text-emerald-400">
                                        <ArrowUpRight className="mr-2 h-4 w-4" />
                                        Goods Given
                                    </div>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{transaction.goodsGiven}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center text-blue-600 dark:text-blue-400">
                                        <ArrowDownLeft className="mr-2 h-4 w-4" />
                                        Received
                                    </div>
                                    <span className="font-bold text-blue-600 dark:text-blue-400">₹{transaction.moneyReceived}</span>
                                </div>
                             </div>
                        </CardContent>

                        <CardFooter className="pt-4 border-t bg-muted/5 gap-2">
                            <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                            onClick={() => restoreTransaction(transaction.id)}
                            >
                            <Undo2 className="mr-2 h-4 w-4" /> Restore
                            </Button>
                            <Button
                            variant="destructive"
                            size="sm"
                            className="flex-1 hover:bg-red-600 shadow-sm"
                            onClick={() => handleDeleteClick(transaction.id, 'transaction')}
                            >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </Button>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
           </AnimatePresence>
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          <AnimatePresence mode="popLayout">
            {deletedProducts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/10 rounded-lg border border-dashed"
              >
                <div className="p-4 bg-muted rounded-full mb-3">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <p>No deleted products found.</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {deletedProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="flex flex-col h-full border-border/60 shadow-sm hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3 bg-muted/50 border-b border-border/10">
                        <CardTitle className="text-lg font-bold flex justify-between items-start">
                          <span className="line-clamp-1 text-foreground/80">{product.name}</span>
                          {product.deleted_at && (
                             <span className="text-xs font-normal text-red-500 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/20 whitespace-nowrap ml-2">
                               Deleted {format(parseISO(product.deleted_at), 'MMM d')}
                             </span>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow pt-4">
                        <div className="rounded-md border p-3 bg-background/50 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Cost Price</span>
                                <span className="font-medium">₹{product.cost_price?.toFixed(2) ?? '0.00'}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Selling Price</span>
                                <span className="font-medium">₹{product.selling_price?.toFixed(2) ?? '0.00'}</span>
                            </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-4 border-t bg-muted/5 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                          onClick={() => restoreProduct(product.id)}
                        >
                          <Undo2 className="mr-2 h-4 w-4" /> Restore
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex-1 hover:bg-red-600 shadow-sm"
                          onClick={() => handleDeleteClick(product.id, 'product')}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>

      <ConfirmationDialog
        isOpen={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Permanently Delete?"
        description="This action cannot be undone. This item will be removed from the database forever."
        confirmButtonText="Delete Permanently"
      />
    </div>
  );
}
