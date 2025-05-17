
"use client";

import type { Shopkeeper, Transaction, DataContextType } from '@/lib/types';
import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
// import useLocalStorage from '@/hooks/use-local-storage'; // No longer needed for transactions
import { v4 as uuidv4 } from 'uuid'; // Still potentially useful for client-side ID generation if needed before insert
import { formatISO } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/hooks/use-toast";

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [shopkeepers, setShopkeepers] = useState<Shopkeeper[]>([]);
  const [loadingShopkeepers, setLoadingShopkeepers] = useState(true);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);

  // Fetch initial data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setLoadingShopkeepers(true);
      setLoadingTransactions(true);

      const { data: shopkeepersData, error: shopkeepersError } = await supabase
        .from('shopkeepers')
        .select('id, name, mobileNumber, created_at')
        .order('created_at', { ascending: false });

      if (shopkeepersError) {
        console.error('Error fetching shopkeepers:', shopkeepersError);
        toast({ title: "Error", description: "Could not fetch shopkeepers.", variant: "destructive" });
        setShopkeepers([]);
      } else {
        setShopkeepers(shopkeepersData || []);
      }
      setLoadingShopkeepers(false);

      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*') // Select all columns
        .order('date', { ascending: false });
      
      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError);
        toast({ title: "Error", description: "Could not fetch transactions.", variant: "destructive" });
        setTransactions([]);
      } else {
        setTransactions(transactionsData || []);
      }
      setLoadingTransactions(false);
    };
    fetchData();
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
      setShopkeepers(prev => [newShopkeeper as Shopkeeper, ...prev].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
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
      setShopkeepers(prev => prev.map(s => s.id === id ? (updatedShopkeeper as Shopkeeper) : s).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      toast({ title: "Success", description: "Shopkeeper updated." });
    }
  };

  const deleteShopkeeper = async (id: string) => {
    // Assuming ON DELETE CASCADE is set up in Supabase for transactions foreign key.
    // If not, transactions for this shopkeeper would need to be deleted here first.
    // The local transactions state will update when all transactions are re-fetched or if filtered post-delete.
    // For now, we rely on Supabase cascade or the next fetch to update transactions.

    const { error } = await supabase
      .from('shopkeepers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting shopkeeper:', error);
      toast({ title: "Error", description: "Could not delete shopkeeper.", variant: "destructive" });
    } else {
      setShopkeepers(prev => prev.filter(s => s.id !== id));
      // Also filter out transactions locally for immediate UI update, 
      // assuming cascade delete will sync the backend.
      setTransactions(prev => prev.filter(t => t.shopkeeperId !== id));
      toast({ title: "Success", description: "Shopkeeper deleted." });
    }
  };
  
  const getShopkeeperById = (id: string) => {
    return shopkeepers.find(s => s.id === id);
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'created_at'>) => {
    const transactionData = { 
      ...transaction, 
      // Supabase can auto-generate id and created_at if columns are set up for it.
      // id: uuidv4(), // Not strictly needed if DB generates UUID
      // created_at: formatISO(new Date()), // Not strictly needed if DB generates timestamp
    };
    const { data: newTransaction, error } = await supabase
      .from('transactions')
      .insert([transactionData])
      .select()
      .single();

    if (error) {
      console.error('Error adding transaction:', error);
      toast({ title: "Error", description: `Could not add transaction: ${error.message}`, variant: "destructive" });
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
      toast({ title: "Error", description: "Could not update transaction.", variant: "destructive" });
    } else if (updatedTransaction) {
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...(updatedTransaction as Transaction) } : t).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      toast({ title: "Success", description: "Transaction updated." });
    }
  };

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting transaction:', error);
      toast({ title: "Error", description: "Could not delete transaction.", variant: "destructive" });
    } else {
      setTransactions(prev => prev.filter(t => t.id !== id));
      toast({ title: "Success", description: "Transaction deleted." });
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
    transactions,
    loadingTransactions,
    getTransactionsByShopkeeper,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionById,
  }), [shopkeepers, loadingShopkeepers, transactions, loadingTransactions, toast]); // eslint-disable-line react-hooks/exhaustive-deps

  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
}

export function useData(): DataContextType {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
