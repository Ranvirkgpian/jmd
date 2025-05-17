
"use client";

import type { Shopkeeper, Transaction, DataContextType } from '@/lib/types';
import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import useLocalStorage from '@/hooks/use-local-storage'; // Still used for transactions
import { v4 as uuidv4 } from 'uuid';
import { formatISO } from 'date-fns';
import { supabase } from '@/lib/supabaseClient'; // Import Supabase client
import { useToast } from "@/hooks/use-toast";


const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [shopkeepers, setShopkeepers] = useState<Shopkeeper[]>([]);
  const [loadingShopkeepers, setLoadingShopkeepers] = useState(true);

  // TODO: Migrate transactions to Supabase
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', []);

  // Fetch initial shopkeepers from Supabase
  useEffect(() => {
    const fetchShopkeepers = async () => {
      setLoadingShopkeepers(true);
      const { data, error } = await supabase
        .from('shopkeepers')
        .select('id, name, mobileNumber, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching shopkeepers:', error);
        toast({ title: "Error", description: "Could not fetch shopkeepers.", variant: "destructive" });
        setShopkeepers([]);
      } else {
        setShopkeepers(data || []);
      }
      setLoadingShopkeepers(false);
    };
    fetchShopkeepers();
  }, [toast]);

  const addShopkeeper = async (name: string, mobileNumber?: string) => {
    const { data: newShopkeeper, error } = await supabase
      .from('shopkeepers')
      .insert([{ name, mobileNumber: mobileNumber || null }])
      .select()
      .single();

    if (error) {
      console.error('Error adding shopkeeper:', error);
      toast({ title: "Error", description: "Could not add shopkeeper.", variant: "destructive" });
    } else if (newShopkeeper) {
      setShopkeepers(prev => [newShopkeeper as Shopkeeper, ...prev]);
      toast({ title: "Success", description: "Shopkeeper added." });
    }
  };

  const updateShopkeeper = async (id: string, name: string, mobileNumber?: string) => {
    const { data: updatedShopkeeper, error } = await supabase
      .from('shopkeepers')
      .update({ name, mobileNumber: mobileNumber || null })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating shopkeeper:', error);
      toast({ title: "Error", description: "Could not update shopkeeper.", variant: "destructive" });
    } else if (updatedShopkeeper) {
      setShopkeepers(prev => prev.map(s => s.id === id ? (updatedShopkeeper as Shopkeeper) : s));
      toast({ title: "Success", description: "Shopkeeper updated." });
    }
  };

  const deleteShopkeeper = async (id: string) => {
    // First, delete associated transactions from localStorage (if any)
    // TODO: When transactions are in Supabase, delete them from Supabase first or handle via cascade.
    setTransactions(prev => prev.filter(t => t.shopkeeperId !== id));

    const { error } = await supabase
      .from('shopkeepers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting shopkeeper:', error);
      toast({ title: "Error", description: "Could not delete shopkeeper.", variant: "destructive" });
    } else {
      setShopkeepers(prev => prev.filter(s => s.id !== id));
      toast({ title: "Success", description: "Shopkeeper deleted." });
    }
  };
  
  const getShopkeeperById = (id: string) => {
    return shopkeepers.find(s => s.id === id);
  };

  // --- Transaction logic (still uses localStorage) ---
  // TODO: Migrate all transaction functions to use Supabase
  const addTransaction = (transaction: Omit<Transaction, 'id' | 'created_at'>) => {
    const newTransaction: Transaction = { ...transaction, id: uuidv4(), created_at: formatISO(new Date()) };
    setTransactions(prev => [...prev, newTransaction]);
    toast({ title: "Success", description: "Transaction added." });
  };

  const updateTransaction = (id: string, updates: Partial<Omit<Transaction, 'id' | 'created_at' | 'shopkeeperId'>>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    toast({ title: "Success", description: "Transaction updated." });
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    toast({ title: "Success", description: "Transaction deleted." });
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
    transactions, // Still from localStorage
    getTransactionsByShopkeeper, // Still from localStorage
    addTransaction, // Still for localStorage
    updateTransaction, // Still for localStorage
    deleteTransaction, // Still for localStorage
    getTransactionById, // Still for localStorage
  }), [shopkeepers, loadingShopkeepers, transactions, setTransactions, toast]); // eslint-disable-line react-hooks/exhaustive-deps

  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
}

export function useData(): DataContextType {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
