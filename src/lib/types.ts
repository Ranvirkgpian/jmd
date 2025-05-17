
export interface Shopkeeper {
  id: string;
  name: string;
  mobileNumber?: string; // Added optional mobile number
  createdAt: string; // ISO Date string
}

export interface Transaction {
  id: string;
  shopkeeperId: string;
  date: string; // ISO Date string
  // description?: string; // Commented out or removed as per previous request
  goodsGiven: number;
  moneyReceived: number;
  createdAt: string; // ISO Date string
}

export interface DataContextType {
  shopkeepers: Shopkeeper[];
  addShopkeeper: (name: string, mobileNumber?: string) => void; // Updated signature
  updateShopkeeper: (id: string, name: string, mobileNumber?: string) => void; // Updated signature
  deleteShopkeeper: (id: string) => void;
  getShopkeeperById: (id: string) => Shopkeeper | undefined;
  transactions: Transaction[];
  getTransactionsByShopkeeper: (shopkeeperId: string) => Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt' | 'shopkeeperId'>>) => void;
  deleteTransaction: (id: string) => void;
  getTransactionById: (id: string) => Transaction | undefined;
}
