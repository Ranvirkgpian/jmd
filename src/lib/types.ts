
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
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
  };
}
