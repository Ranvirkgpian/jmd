-- Create bill_customers table
CREATE TABLE IF NOT EXISTS public.bill_customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  mobile_number TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Create bills table
CREATE TABLE IF NOT EXISTS public.bills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_number SERIAL NOT NULL,
  customer_id UUID REFERENCES public.bill_customers(id),
  customer_name TEXT NOT NULL,
  date TIMESTAMPTZ DEFAULT NOW(),
  subtotal NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Create bill_items table
CREATE TABLE IF NOT EXISTS public.bill_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID REFERENCES public.bills(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 0,
  rate NUMERIC DEFAULT 0,
  amount NUMERIC DEFAULT 0
);

-- Create bill_settings table
CREATE TABLE IF NOT EXISTS public.bill_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT,
  company_logo TEXT,
  company_address TEXT,
  company_mobile TEXT,
  company_email TEXT,
  company_gst TEXT,
  payment_methods JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bill_customers_deleted_at ON public.bill_customers(deleted_at);
CREATE INDEX IF NOT EXISTS idx_bills_deleted_at ON public.bills(deleted_at);
CREATE INDEX IF NOT EXISTS idx_bills_customer_id ON public.bills(customer_id);
CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON public.bill_items(bill_id);

-- Enable RLS
ALTER TABLE public.bill_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable all access for bill_customers" ON public.bill_customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for bills" ON public.bills FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for bill_items" ON public.bill_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for bill_settings" ON public.bill_settings FOR ALL USING (true) WITH CHECK (true);
