
"use client";

import type { Shopkeeper, Transaction, DataContextType } from '@/lib/types';
import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
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
        .select('id, name, mobileNumber, address, created_at') // Added address
        .order('created_at', { ascending: false });

      if (shopkeepersError) {
        console.error('Error fetching shopkeepers:', shopkeepersError);
        toast({ 
          title: "Error Fetching Shopkeepers", 
          description: `Could not fetch shopkeepers. ${shopkeepersError.message || 'Please check console.'}`, 
          variant: "destructive" 
        });
        setShopkeepers([]);
      } else {
        setShopkeepers(shopkeepersData || []);
      }
      setLoadingShopkeepers(false);

      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*') 
        .order('date', { ascending: false });
      
      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError);
        toast({ 
          title: "Error Fetching Transactions", 
          description: `Could not fetch transactions. ${transactionsError.message || 'Please check console.'}`, 
          variant: "destructive" 
        });
        setTransactions([]);
      } else {
        setTransactions(transactionsData || []);
      }
      setLoadingTransactions(false);
    };
    fetchData();
  }, [toast]);

  const addShopkeeper = async (name: string, mobileNumber?: string, address?: string) => {
    const { data: newShopkeeper, error } = await supabase
      .from('shopkeepers')
      .insert([{ name, mobileNumber: mobileNumber || null, address: address || null }]) // Added address
      .select()
      .single();

    if (error) {
      console.error('Error adding shopkeeper:', error);
      if (error.message) console.error('Supabase error message:', error.message);
      if (error.details) console.error('Supabase error details:', error.details);
      if (error.hint) console.error('Supabase error hint:', error.hint);
      if (error.code) console.error('Supabase error code:', error.code);
      toast({ 
        title: "Error Adding Shopkeeper", 
        description: `Could not add shopkeeper. ${error.message || 'RLS policy? Please check console.'}`, 
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
      .update({ name, mobileNumber: mobileNumber || null, address: address || null }) // Added address
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating shopkeeper:', error);
      if (error.message) console.error('Supabase error message:', error.message);
      toast({ 
        title: "Error Updating Shopkeeper", 
        description: `Could not update shopkeeper. ${error.message || 'Please check console.'}`, 
        variant: "destructive" 
      });
    } else if (updatedShopkeeper) {
      setShopkeepers(prev => prev.map(s => s.id === id ? (updatedShopkeeper as Shopkeeper) : s).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      toast({ title: "Success", description: "Shopkeeper updated." });
    }
  };

  const deleteShopkeeper = async (id: string) => {
    // Transactions associated with this shopkeeper should be deleted by Supabase 
    // if "ON DELETE CASCADE" is set on the foreign key in the transactions table.
    const { error } = await supabase
      .from('shopkeepers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting shopkeeper:', error);
      if (error.message) console.error('Supabase error message:', error.message);
      toast({ 
        title: "Error Deleting Shopkeeper", 
        description: `Could not delete shopkeeper. ${error.message || 'Please check console.'}`, 
        variant: "destructive" 
      });
    } else {
      setShopkeepers(prev => prev.filter(s => s.id !== id));
      // Also remove transactions for this shopkeeper from local state if Supabase handles cascade
      setTransactions(prev => prev.filter(t => t.shopkeeperId !== id)); 
      toast({ title: "Success", description: "Shopkeeper deleted." });
    }
  };
  
  const getShopkeeperById = (id: string) => {
    return shopkeepers.find(s => s.id === id);
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'created_at'>) => {
    const transactionData = { ...transaction };
    const { data: newTransaction, error } = await supabase
      .from('transactions')
      .insert([transactionData])
      .select()
      .single();

    if (error) {
      console.error('Error adding transaction:', error);
      if (error.message) console.error('Supabase error message:', error.message);
      if (error.details) console.error('Supabase error details:', error.details);
      if (error.hint) console.error('Supabase error hint:', error.hint);
      if (error.code) console.error('Supabase error code:', error.code);
      toast({ 
        title: "Error Adding Transaction", 
        description: `Could not add transaction. ${error.message || 'RLS policy? Please check console.'}`, 
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
      if (error.message) console.error('Supabase error message:', error.message);
      toast({ 
        title: "Error Updating Transaction", 
        description: `Could not update transaction. ${error.message || 'Please check console.'}`, 
        variant: "destructive" 
      });
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
      if (error.message) console.error('Supabase error message:', error.message);
      toast({ 
        title: "Error Deleting Transaction", 
        description: `Could not delete transaction. ${error.message || 'Please check console.'}`, 
        variant: "destructive" 
      });
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
  }), [shopkeepers, loadingShopkeepers, transactions, loadingTransactions]); // eslint-disable-line react-hooks/exhaustive-deps

  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
}

export function useData(): DataContextType {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
