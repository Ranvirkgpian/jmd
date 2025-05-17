
export interface Shopkeeper {
  id: string;
  name: string;
  mobileNumber?: string;
  created_at: string; // ISO Date string, Supabase convention
}

export interface Transaction {
  id: string;
  shopkeeperId: string; // Foreign key to Shopkeeper
  date: string; // ISO Date string
  goodsGiven: number;
  moneyReceived: number;
  created_at: string; // ISO Date string, Supabase convention
}

export interface DataContextType {
  shopkeepers: Shopkeeper[];
  loadingShopkeepers: boolean;
  addShopkeeper: (name: string, mobileNumber?: string) => Promise<void>;
  updateShopkeeper: (id: string, name: string, mobileNumber?: string) => Promise<void>;
  deleteShopkeeper: (id: string) => Promise<void>;
  getShopkeeperById: (id: string) => Shopkeeper | undefined;
  
  transactions: Transaction[];
  loadingTransactions: boolean;
  getTransactionsByShopkeeper: (shopkeeperId: string) => Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'created_at'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Omit<Transaction, 'id' | 'created_at' | 'shopkeeperId'>>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  getTransactionById: (id: string) => Transaction | undefined;
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
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          mobileNumber?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          mobileNumber?: string | null;
          created_at?: string;
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
        };
        Insert: {
          id?: string;
          shopkeeperId: string;
          date: string;
          goodsGiven: number;
          moneyReceived: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          shopkeeperId?: string;
          date?: string;
          goodsGiven?: number;
          moneyReceived?: number;
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
