
"use client";

import type { Shopkeeper, Transaction, DataContextType } from '@/lib/types';
import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/hooks/use-toast";
import { differenceInDays, parseISO } from 'date-fns';

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // Active Data
  const [shopkeepers, setShopkeepers] = useState<Shopkeeper[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Deleted Data
  const [deletedShopkeepers, setDeletedShopkeepers] = useState<Shopkeeper[]>([]);
  const [deletedTransactions, setDeletedTransactions] = useState<Transaction[]>([]);

  const [loadingShopkeepers, setLoadingShopkeepers] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(true);

  // Fetch initial data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setLoadingShopkeepers(true);
      setLoadingTransactions(true);

      // --- Fetch Shopkeepers ---
      const { data: shopkeepersData, error: shopkeepersError } = await supabase
        .from('shopkeepers')
        .select('*')
        .order('created_at', { ascending: false });

      if (shopkeepersError) {
        console.error('Error fetching shopkeepers:', shopkeepersError);
        toast({ 
          title: "Error Fetching Shopkeepers", 
          description: `Could not fetch shopkeepers. ${shopkeepersError.message}`,
          variant: "destructive" 
        });
        setShopkeepers([]);
        setDeletedShopkeepers([]);
      } else {
        const allShopkeepers = (shopkeepersData as Shopkeeper[]) || [];
        // Separate active and deleted
        setShopkeepers(allShopkeepers.filter(s => !s.deleted_at));
        setDeletedShopkeepers(allShopkeepers.filter(s => s.deleted_at));
      }
      setLoadingShopkeepers(false);

      // --- Fetch Transactions ---
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*') 
        .order('date', { ascending: false });
      
      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError);
        toast({ 
          title: "Error Fetching Transactions", 
          description: `Could not fetch transactions. ${transactionsError.message}`,
          variant: "destructive" 
        });
        setTransactions([]);
        setDeletedTransactions([]);
      } else {
        const allTransactions = (transactionsData as Transaction[]) || [];
        // Separate active and deleted
        setTransactions(allTransactions.filter(t => !t.deleted_at));
        setDeletedTransactions(allTransactions.filter(t => t.deleted_at));
      }
      setLoadingTransactions(false);
    };
    fetchData();
  }, [toast]);

  // --- Lazy Cleanup Logic (Auto-delete > 45 days) ---
  useEffect(() => {
    const cleanupOldData = async () => {
      if (loadingShopkeepers || loadingTransactions) return;

      const now = new Date();
      const thresholdDays = 45;

      // Identify old deleted shopkeepers
      const oldShopkeepers = deletedShopkeepers.filter(s => {
        if (!s.deleted_at) return false;
        const deletedDate = parseISO(s.deleted_at);
        return differenceInDays(now, deletedDate) > thresholdDays;
      });

      // Identify old deleted transactions
      const oldTransactions = deletedTransactions.filter(t => {
        if (!t.deleted_at) return false;
        const deletedDate = parseISO(t.deleted_at);
        return differenceInDays(now, deletedDate) > thresholdDays;
      });

      // Perform deletion
      if (oldShopkeepers.length > 0) {
        console.log(`Cleaning up ${oldShopkeepers.length} old shopkeepers...`);
        for (const s of oldShopkeepers) {
          await permanentlyDeleteShopkeeper(s.id);
        }
      }

      if (oldTransactions.length > 0) {
        console.log(`Cleaning up ${oldTransactions.length} old transactions...`);
        for (const t of oldTransactions) {
          await permanentlyDeleteTransaction(t.id);
        }
      }
    };

    // Run cleanup once data is loaded
    if (!loadingShopkeepers && !loadingTransactions) {
      cleanupOldData();
    }
  }, [loadingShopkeepers, loadingTransactions, deletedShopkeepers, deletedTransactions]); // eslint-disable-line react-hooks/exhaustive-deps


  // --- Shopkeeper Actions ---

  const addShopkeeper = async (name: string, mobileNumber?: string, address?: string) => {
    const { data: newShopkeeper, error } = await supabase
      .from('shopkeepers')
      .insert([{ name, mobileNumber: mobileNumber || null, address: address || null }])
      .select()
      .single();

    if (error) {
      console.error('Error adding shopkeeper:', error);
      toast({ 
        title: "Error Adding Shopkeeper", 
        description: error.message,
        variant: "destructive" 
      });
    } else if (newShopkeeper) {
      setShopkeepers(prev => [newShopkeeper as Shopkeeper, ...prev].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      toast({ title: "Success", description: "Shopkeeper added." });
    }
  };

  const updateShopkeeper = async (id: string, name: string, mobileNumber?: string, address?: string) => {
    const { data: updatedShopkeeper, error } = await supabase
      .from('shopkeepers')
      .update({ name, mobileNumber: mobileNumber || null, address: address || null })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating shopkeeper:', error);
      toast({ 
        title: "Error Updating Shopkeeper", 
        description: error.message,
        variant: "destructive" 
      });
    } else if (updatedShopkeeper) {
      setShopkeepers(prev => prev.map(s => s.id === id ? (updatedShopkeeper as Shopkeeper) : s));
      toast({ title: "Success", description: "Shopkeeper updated." });
    }
  };

  const deleteShopkeeper = async (id: string) => {
    // Soft delete
    const deletedAt = new Date().toISOString();
    const { data: softDeletedShopkeeper, error } = await supabase
      .from('shopkeepers')
      .update({ deleted_at: deletedAt })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error deleting shopkeeper:', error);
      toast({ 
        title: "Error Deleting Shopkeeper", 
        description: error.message,
        variant: "destructive" 
      });
    } else if (softDeletedShopkeeper) {
      // Remove from active
      setShopkeepers(prev => prev.filter(s => s.id !== id));
      // Add to deleted
      setDeletedShopkeepers(prev => [softDeletedShopkeeper as Shopkeeper, ...prev]);

      // Also soft delete associated transactions locally for consistency
      // In a real app, you might want to soft delete them in DB too, or rely on a cascade if DB supports it.
      // But for Soft Delete, DB Cascade usually deletes permanently.
      // So we should probably soft-delete all transactions for this shopkeeper manually.

      // Let's soft delete associated transactions
      const { error: transError } = await supabase
        .from('transactions')
        .update({ deleted_at: deletedAt })
        .eq('shopkeeperId', id);

      if (transError) {
        console.error("Error soft deleting shopkeeper transactions", transError);
      } else {
        // Move local transactions to deleted list
        const associatedTransactions = transactions.filter(t => t.shopkeeperId === id);
        const remainingTransactions = transactions.filter(t => t.shopkeeperId !== id);

        setTransactions(remainingTransactions);

        const updatedDeletedTransactions = associatedTransactions.map(t => ({ ...t, deleted_at: deletedAt }));
        setDeletedTransactions(prev => [...updatedDeletedTransactions, ...prev]);
      }

      toast({ title: "Success", description: "Shopkeeper moved to Recycle Bin." });
    }
  };

  const restoreShopkeeper = async (id: string) => {
    const { data: restoredShopkeeper, error } = await supabase
      .from('shopkeepers')
      .update({ deleted_at: null })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: "Could not restore shopkeeper.", variant: "destructive" });
    } else if (restoredShopkeeper) {
      // Move from deleted to active
      setDeletedShopkeepers(prev => prev.filter(s => s.id !== id));
      setShopkeepers(prev => [restoredShopkeeper as Shopkeeper, ...prev].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));

      // Also restore associated transactions?
      // Usually yes.
      const { error: transError } = await supabase
         .from('transactions')
         .update({ deleted_at: null })
         .eq('shopkeeperId', id)
         // Only restore those that were deleted at the same time?
         // For simplicity, we restore all transactions for this shopkeeper that are currently deleted.
         // Or strictly, we should assume if the shopkeeper is back, their transactions are back.

      if (!transError) {
         // Move local transactions
         // Find transactions for this shopkeeper in deleted list
         const myDeletedTransactions = deletedTransactions.filter(t => t.shopkeeperId === id);
         const otherDeletedTransactions = deletedTransactions.filter(t => t.shopkeeperId !== id);

         setDeletedTransactions(otherDeletedTransactions);

         const restoredTransactions = myDeletedTransactions.map(t => ({ ...t, deleted_at: null } as any)); // cast needed to remove undefined if strict
         setTransactions(prev => [...restoredTransactions, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }

      toast({ title: "Success", description: "Shopkeeper restored." });
    }
  };

  const permanentlyDeleteShopkeeper = async (id: string) => {
    const { error } = await supabase
      .from('shopkeepers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error permanently deleting shopkeeper:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setDeletedShopkeepers(prev => prev.filter(s => s.id !== id));
      // Transactions should cascade delete in DB if set up, but we also clear from local state just in case
      setDeletedTransactions(prev => prev.filter(t => t.shopkeeperId !== id));
      toast({ title: "Success", description: "Shopkeeper permanently deleted." });
    }
  };

  const getShopkeeperById = (id: string) => {
    // Check both lists? Usually just active.
    return shopkeepers.find(s => s.id === id);
  };


  // --- Transaction Actions ---

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'created_at' | 'deleted_at'>) => {
    const transactionData = { ...transaction };
    const { data: newTransaction, error } = await supabase
      .from('transactions')
      .insert([transactionData])
      .select()
      .single();

    if (error) {
      console.error('Error adding transaction:', error);
      toast({ 
        title: "Error Adding Transaction", 
        description: error.message,
        variant: "destructive" 
      });
    } else if (newTransaction) {
      setTransactions(prev => [...prev, newTransaction as Transaction].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      toast({ title: "Success", description: "Transaction added." });
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Omit<Transaction, 'id' | 'created_at' | 'shopkeeperId'>>) => {
    const { data: updatedTransaction, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating transaction:', error);
      toast({ 
        title: "Error Updating Transaction", 
        description: error.message,
        variant: "destructive" 
      });
    } else if (updatedTransaction) {
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...(updatedTransaction as Transaction) } : t).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      toast({ title: "Success", description: "Transaction updated." });
    }
  };

  const deleteTransaction = async (id: string) => {
    // Soft delete
    const deletedAt = new Date().toISOString();
    const { data: softDeletedTransaction, error } = await supabase
      .from('transactions')
      .update({ deleted_at: deletedAt })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error deleting transaction:', error);
      toast({ 
        title: "Error Deleting Transaction", 
        description: error.message,
        variant: "destructive" 
      });
    } else if (softDeletedTransaction) {
      setTransactions(prev => prev.filter(t => t.id !== id));
      setDeletedTransactions(prev => [softDeletedTransaction as Transaction, ...prev]);
      toast({ title: "Success", description: "Transaction moved to Recycle Bin." });
    }
  };

  const restoreTransaction = async (id: string) => {
    const { data: restoredTransaction, error } = await supabase
      .from('transactions')
      .update({ deleted_at: null })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: "Could not restore transaction.", variant: "destructive" });
    } else if (restoredTransaction) {
      setDeletedTransactions(prev => prev.filter(t => t.id !== id));
      setTransactions(prev => [restoredTransaction as Transaction, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      toast({ title: "Success", description: "Transaction restored." });
    }
  };

  const permanentlyDeleteTransaction = async (id: string) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error permanently deleting transaction:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setDeletedTransactions(prev => prev.filter(t => t.id !== id));
      toast({ title: "Success", description: "Transaction permanently deleted." });
    }
  };

  const getTransactionById = (id: string) => {
    return transactions.find(t => t.id === id);
  };
  
  const getTransactionsByShopkeeper = (shopkeeperId: string) => {
    return transactions.filter(t => t.shopkeeperId === shopkeeperId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };
  
  const contextValue = useMemo(() => ({
    shopkeepers,
    loadingShopkeepers,
    addShopkeeper,
    updateShopkeeper,
    deleteShopkeeper,
    getShopkeeperById,

    deletedShopkeepers,
    restoreShopkeeper,
    permanentlyDeleteShopkeeper,

    transactions,
    loadingTransactions,
    getTransactionsByShopkeeper,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionById,

    deletedTransactions,
    restoreTransaction,
    permanentlyDeleteTransaction,
  }), [
    shopkeepers, loadingShopkeepers, deletedShopkeepers,
    transactions, loadingTransactions, deletedTransactions
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
}

export function useData(): DataContextType {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
