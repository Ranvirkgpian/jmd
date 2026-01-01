
export interface Shopkeeper {
  id: string;
  name: string;
  mobileNumber?: string;
  address?: string; // Added address field
  created_at: string; // ISO Date string, Supabase convention
  deleted_at?: string | null; // For soft delete
}

export interface Transaction {
  id: string;
  shopkeeperId: string; // Foreign key to Shopkeeper
  date: string; // ISO Date string
  goodsGiven: number;
  moneyReceived: number;
  created_at: string; // ISO Date string, Supabase convention
  deleted_at?: string | null; // For soft delete
}

export interface Product {
  id: string;
  name: string;
  cost_price: number;
  selling_price: number;
  created_at: string;
  deleted_at?: string | null;
}

export interface DataContextType {
  shopkeepers: Shopkeeper[]; // Active shopkeepers
  loadingShopkeepers: boolean;
  addShopkeeper: (name: string, mobileNumber?: string, address?: string) => Promise<void>;
  updateShopkeeper: (id: string, name: string, mobileNumber?: string, address?: string) => Promise<void>;
  deleteShopkeeper: (id: string) => Promise<void>; // Soft delete
  getShopkeeperById: (id: string) => Shopkeeper | undefined;
  
  // Recycle Bin / Soft Delete for Shopkeepers
  deletedShopkeepers: Shopkeeper[];
  restoreShopkeeper: (id: string) => Promise<void>;
  permanentlyDeleteShopkeeper: (id: string) => Promise<void>;

  transactions: Transaction[]; // Active transactions
  loadingTransactions: boolean;
  getTransactionsByShopkeeper: (shopkeeperId: string) => Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'created_at' | 'deleted_at'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Omit<Transaction, 'id' | 'created_at' | 'shopkeeperId'>>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>; // Soft delete
  getTransactionById: (id: string) => Transaction | undefined;

  // Recycle Bin / Soft Delete for Transactions
  deletedTransactions: Transaction[];
  restoreTransaction: (id: string) => Promise<void>;
  permanentlyDeleteTransaction: (id: string) => Promise<void>;

  // Products
  products: Product[];
  loadingProducts: boolean;
  addProduct: (product: Omit<Product, 'id' | 'created_at' | 'deleted_at'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Omit<Product, 'id' | 'created_at'>>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>; // Soft delete

  // Recycle Bin / Soft Delete for Products
  deletedProducts: Product[];
  restoreProduct: (id: string) => Promise<void>;
  permanentlyDeleteProduct: (id: string) => Promise<void>;
}

// Bill Book Types
export interface BillCustomer {
  id: string;
  name: string;
  mobile_number?: string;
  address?: string;
  created_at: string;
  deleted_at?: string | null;
}

export interface BillItem {
  id: string;
  bill_id: string;
  product_name: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Bill {
  id: string;
  bill_number: number;
  customer_id: string;
  customer_name: string;
  date: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  payment_method?: string;
  items?: BillItem[]; // Hydrated
  created_at: string;
  deleted_at?: string | null;
}

export interface BillSettings {
  id: string;
  company_name: string;
  company_logo?: string;
  company_address?: string;
  company_mobile?: string;
  company_email?: string;
  company_gst?: string;
  payment_methods: string[];
  footer_message?: string;
}

export interface BillContextType {
  customers: BillCustomer[];
  loadingCustomers: boolean;
  addCustomer: (customer: Omit<BillCustomer, 'id' | 'created_at' | 'deleted_at'>) => Promise<BillCustomer | null>;

  bills: Bill[];
  loadingBills: boolean;
  addBill: (bill: Omit<Bill, 'id' | 'bill_number' | 'created_at' | 'deleted_at' | 'items'>, items: Omit<BillItem, 'id' | 'bill_id'>[]) => Promise<void>;
  updateBill: (id: string, bill: Omit<Bill, 'id' | 'bill_number' | 'created_at' | 'deleted_at' | 'items'>, items: Omit<BillItem, 'id' | 'bill_id'>[]) => Promise<void>;
  deleteBill: (id: string) => Promise<void>; // Soft delete

  settings: BillSettings | null;
  loadingSettings: boolean;
  updateSettings: (settings: Partial<BillSettings>) => Promise<void>;
}

// Placeholder for Supabase generated types. 
// You would typically generate this using `supabase gen types typescript > src/lib/types/supabase.ts`
export interface Database {
  public: {
    Tables: {
      shopkeepers: {
        Row: {
          id: string;
          name: string;
          mobileNumber: string | null;
          address: string | null;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          mobileNumber?: string | null;
          address?: string | null;
          created_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          mobileNumber?: string | null;
          address?: string | null;
          created_at?: string;
          deleted_at?: string | null;
        };
      };
      transactions: {
        Row: {
          id: string;
          shopkeeperId: string;
          date: string; 
          goodsGiven: number;
          moneyReceived: number;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          shopkeeperId: string;
          date: string;
          goodsGiven: number;
          moneyReceived: number;
          created_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          shopkeeperId?: string;
          date?: string;
          goodsGiven?: number;
          moneyReceived?: number;
          created_at?: string;
          deleted_at?: string | null;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          cost_price: number;
          selling_price: number;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          cost_price: number;
          selling_price: number;
          created_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          cost_price?: number;
          selling_price?: number;
          created_at?: string;
          deleted_at?: string | null;
        };
      };
      bill_customers: {
        Row: {
          id: string;
          name: string;
          mobile_number: string | null;
          address: string | null;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          mobile_number?: string | null;
          address?: string | null;
          created_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          mobile_number?: string | null;
          address?: string | null;
          created_at?: string;
          deleted_at?: string | null;
        };
      };
      bills: {
        Row: {
          id: string;
          bill_number: number;
          customer_id: string;
          customer_name: string;
          date: string;
          subtotal: number;
          discount_amount: number;
          tax_amount: number;
          total_amount: number;
          paid_amount: number;
          payment_method: string | null;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          bill_number?: number;
          customer_id: string;
          customer_name: string;
          date: string;
          subtotal: number;
          discount_amount: number;
          tax_amount: number;
          total_amount: number;
          paid_amount: number;
          payment_method?: string | null;
          created_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          bill_number?: number;
          customer_id?: string;
          customer_name?: string;
          date?: string;
          subtotal?: number;
          discount_amount?: number;
          tax_amount?: number;
          total_amount?: number;
          paid_amount?: number;
          payment_method?: string | null;
          created_at?: string;
          deleted_at?: string | null;
        };
      };
      bill_items: {
        Row: {
          id: string;
          bill_id: string;
          product_name: string;
          quantity: number;
          rate: number;
          amount: number;
        };
        Insert: {
          id?: string;
          bill_id: string;
          product_name: string;
          quantity: number;
          rate: number;
          amount: number;
        };
        Update: {
          id?: string;
          bill_id?: string;
          product_name?: string;
          quantity?: number;
          rate?: number;
          amount?: number;
        };
      };
      bill_settings: {
        Row: {
          id: string;
          company_name: string | null;
          company_logo: string | null;
          company_address: string | null;
          company_mobile: string | null;
          company_email: string | null;
          company_gst: string | null;
          payment_methods: unknown | null;
          footer_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_name?: string | null;
          company_logo?: string | null;
          company_address?: string | null;
          company_mobile?: string | null;
          company_email?: string | null;
          company_gst?: string | null;
          payment_methods?: unknown | null;
          footer_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_name?: string | null;
          company_logo?: string | null;
          company_address?: string | null;
          company_mobile?: string | null;
          company_email?: string | null;
          company_gst?: string | null;
          payment_methods?: unknown | null;
          footer_message?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
  };
}
