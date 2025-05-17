
"use client";

import type { Shopkeeper, Transaction, DataContextType } from '@/lib/types';
import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import useLocalStorage from '@/hooks/use-local-storage';
import { v4 as uuidv4 } from 'uuid';
import { formatISO } from 'date-fns';

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [shopkeepers, setShopkeepers] = useLocalStorage<Shopkeeper[]>('shopkeepers', []);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', []);

  const addShopkeeper = (name: string, mobileNumber?: string) => {
    const newShopkeeper: Shopkeeper = { 
      id: uuidv4(), 
      name, 
      mobileNumber: mobileNumber || undefined, // Store as undefined if empty
      createdAt: formatISO(new Date()) 
    };
    setShopkeepers(prev => [...prev, newShopkeeper]);
  };

  const updateShopkeeper = (id: string, name: string, mobileNumber?: string) => {
    setShopkeepers(prev => prev.map(s => s.id === id ? { ...s, name, mobileNumber: mobileNumber || undefined } : s));
  };

  const deleteShopkeeper = (id: string) => {
    setShopkeepers(prev => prev.filter(s => s.id !== id));
    // Also delete transactions associated with this shopkeeper
    setTransactions(prev => prev.filter(t => t.shopkeeperId !== id));
  };
  
  const getShopkeeperById = (id: string) => {
    return shopkeepers.find(s => s.id === id);
  };

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTransaction: Transaction = { ...transaction, id: uuidv4(), createdAt: formatISO(new Date()) };
    setTransactions(prev => [...prev, newTransaction]);
  };

  const updateTransaction = (id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt' | 'shopkeeperId'>>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const getTransactionById = (id: string) => {
    return transactions.find(t => t.id === id);
  };
  
  const getTransactionsByShopkeeper = (shopkeeperId: string) => {
    return transactions.filter(t => t.shopkeeperId === shopkeeperId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };
  
  const contextValue = useMemo(() => ({
    shopkeepers,
    addShopkeeper,
    updateShopkeeper,
    deleteShopkeeper,
    getShopkeeperById,
    transactions,
    getTransactionsByShopkeeper,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionById,
  }), [shopkeepers, transactions]); // eslint-disable-line react-hooks/exhaustive-deps
  // Removed functions from dependency array as they are stable due to useLocalStorage & direct set calls

  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
}

export function useData(): DataContextType {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
