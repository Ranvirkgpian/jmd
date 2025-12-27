'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Bill, BillCustomer, BillItem, BillSettings, BillContextType } from '@/lib/types';

const BillContext = createContext<BillContextType | undefined>(undefined);

export const BillProvider = ({ children }: { children: ReactNode }) => {
  const [customers, setCustomers] = useState<BillCustomer[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [settings, setSettings] = useState<BillSettings | null>(null);

  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingBills, setLoadingBills] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('bill_customers')
        .select('*')
        .is('deleted_at', null)
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchBills = async () => {
    try {
      const { data, error } = await supabase
        .from('bills')
        .select(`
          *,
          items:bill_items(*)
        `)
        .is('deleted_at', null)
        .order('date', { ascending: false });

      if (error) throw error;
      setBills(data as unknown as Bill[] || []);
    } catch (error) {
      console.error('Error fetching bills:', error);
    } finally {
      setLoadingBills(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('bill_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "The result contains 0 rows"
        throw error;
      }
      setSettings(data as BillSettings | null);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchBills();
    fetchSettings();
  }, []);

  const addCustomer = async (customer: Omit<BillCustomer, 'id' | 'created_at' | 'deleted_at'>) => {
    try {
      const { data, error } = await supabase
        .from('bill_customers')
        .insert([customer])
        .select()
        .single();

      if (error) throw error;
      setCustomers(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Error adding customer:', error);
      return null;
    }
  };

  const addBill = async (
    billData: Omit<Bill, 'id' | 'bill_number' | 'created_at' | 'deleted_at' | 'items'>,
    itemsData: Omit<BillItem, 'id' | 'bill_id'>[]
  ) => {
    try {
      // 1. Insert Bill Header
      const { data: bill, error: billError } = await supabase
        .from('bills')
        .insert([{
          customer_id: billData.customer_id,
          customer_name: billData.customer_name,
          date: billData.date,
          subtotal: billData.subtotal,
          discount_amount: billData.discount_amount,
          tax_amount: billData.tax_amount,
          total_amount: billData.total_amount,
          paid_amount: billData.paid_amount,
          payment_method: billData.payment_method
        }])
        .select()
        .single();

      if (billError) throw billError;
      if (!bill) throw new Error('Failed to create bill');

      // 2. Insert Bill Items
      const itemsWithBillId = itemsData.map(item => ({
        ...item,
        bill_id: bill.id
      }));

      const { data: items, error: itemsError } = await supabase
        .from('bill_items')
        .insert(itemsWithBillId)
        .select();

      if (itemsError) throw itemsError;

      // 3. Update Local State
      const newBill: Bill = {
        ...bill,
        items: items as BillItem[]
      };

      setBills(prev => [newBill, ...prev]);

    } catch (error) {
      console.error('Error adding bill:', error);
      throw error;
    }
  };

  const deleteBill = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bills')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      setBills(prev => prev.filter(b => b.id !== id));
    } catch (error) {
      console.error('Error deleting bill:', error);
      throw error;
    }
  };

  const updateSettings = async (newSettings: Partial<BillSettings>) => {
    try {
      if (settings?.id) {
        // Update
        const { data, error } = await supabase
          .from('bill_settings')
          .update(newSettings)
          .eq('id', settings.id)
          .select()
          .single();

        if (error) throw error;
        setSettings(data as BillSettings);
      } else {
        // Insert first time
        const { data, error } = await supabase
          .from('bill_settings')
          .insert([newSettings])
          .select()
          .single();

        if (error) throw error;
        setSettings(data as BillSettings);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  };

  return (
    <BillContext.Provider value={{
      customers,
      loadingCustomers,
      addCustomer,
      bills,
      loadingBills,
      addBill,
      deleteBill,
      settings,
      loadingSettings,
      updateSettings
    }}>
      {children}
    </BillContext.Provider>
  );
};

export const useBill = () => {
  const context = useContext(BillContext);
  if (context === undefined) {
    throw new Error('useBill must be used within a BillProvider');
  }
  return context;
};
