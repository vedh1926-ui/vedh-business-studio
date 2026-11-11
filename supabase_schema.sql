-- =============================================================================
-- VEDH BUSINESS STUDIO — PostgreSQL Database Schema for Supabase
-- High-end artisanal tracking: Orders, Inventory, Invoices, Expenses & CRM
-- =============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PRODUCTS TABLE
create table if not exists public.products (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    category text not null,
    collection text,
    price numeric(12, 2) not null check (price >= 0),
    estimated_cost numeric(12, 2) default 0 check (estimated_cost >= 0),
    stock integer default 0 check (stock >= 0),
    unit text default 'set',
    reorder_level integer default 5 check (reorder_level >= 0),
    image_url text,
    description text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. INVENTORY & WORKSHOP SUPPLIES TABLE
create table if not exists public.inventory (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    type text not null check (type in ('Finished Good', 'Raw Material', 'Packaging')),
    category text,
    stock numeric(12, 2) default 0 check (stock >= 0),
    unit text not null default 'pcs',
    reorder_level numeric(12, 2) default 5 check (reorder_level >= 0),
    avg_unit_cost numeric(12, 4),
    purchase_source text,
    supplier_name text,
    last_adjustment_reason text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. CUSTOMERS TABLE
create table if not exists public.customers (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    phone text,
    email text,
    city text,
    type text default 'Individual' check (type in ('Individual', 'Corporate', 'VIP')),
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. SUPPLIERS TABLE
create table if not exists public.suppliers (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    category text not null,
    phone text,
    email text,
    city text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. ORDERS TABLE
create table if not exists public.orders (
    id uuid default uuid_generate_v4() primary key,
    order_number text not null,
    customer_id uuid references public.customers(id) on delete set null,
    customer_name text not null,
    customer_phone text,
    customer_email text,
    status text not null default 'New',
    total_amount numeric(12, 2) not null check (total_amount >= 0),
    advance_paid numeric(12, 2) default 0 check (advance_paid >= 0),
    balance_due numeric(12, 2) default 0 check (balance_due >= 0),
    order_date date default current_date,
    target_delivery_date date,
    delivered_on date,
    deduct_stock boolean default true,
    occasion text,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. ORDER ITEMS (Bespoke line items)
create table if not exists public.order_items (
    id uuid default uuid_generate_v4() primary key,
    order_id uuid references public.orders(id) on delete cascade not null,
    product_id uuid references public.products(id) on delete set null,
    product_name text not null,
    quantity integer not null check (quantity > 0),
    unit_price numeric(12, 2) not null check (unit_price >= 0)
);

-- 7. PAYMENTS TABLE
create table if not exists public.payments (
    id uuid default uuid_generate_v4() primary key,
    order_id uuid references public.orders(id) on delete set null,
    order_number text,
    customer_name text not null,
    amount numeric(12, 2) not null check (amount > 0),
    payment_method text not null check (payment_method in ('UPI / GPay / PhonePe', 'Bank Transfer', 'Cash', 'Card')),
    status text default 'Received' check (status in ('Received', 'Pending Verification')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. EXPENSES & PURCHASES LEDGER TABLE
create table if not exists public.expenses (
    id uuid default uuid_generate_v4() primary key,
    order_id text,
    platform text,
    title text not null,
    dimensions text,
    category text not null,
    qty numeric(12, 4) default 1,
    pieces_per_pack numeric(12, 4) default 1,
    unit_price numeric(12, 4) default 0,
    shipping numeric(12, 2) default 0,
    amount numeric(12, 2) not null check (amount >= 0),
    order_date date default current_date,
    expected_delivery date,
    actual_delivery date,
    supplier_name text,
    payment_mode text default 'UPI',
    purchase_status text default 'Ordered',
    invoice_no text,
    receipt_file text,
    image_ref text,
    contact_details text,
    stock_item text,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. AUDIT HISTORY LOG TABLE
create table if not exists public.audit_logs (
    id uuid default uuid_generate_v4() primary key,
    category text not null check (category in ('All', 'Product', 'Order', 'Recipe', 'Inventory', 'Expense', 'Payment', 'Customer', 'Master List')),
    description text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. MASTER LISTS & PARAMETERS TABLE
create table if not exists public.master_lists (
    id text primary key,
    list_key text not null unique,
    name text not null,
    description text,
    used_in text[] default '{}',
    items jsonb default '[]'::jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. RECIPES (BILL OF MATERIALS) TABLE
create table if not exists public.recipes (
    id uuid default uuid_generate_v4() primary key,
    product_id uuid references public.products(id) on delete cascade,
    product_name text not null,
    material_id uuid references public.inventory(id) on delete set null,
    material_name text not null,
    qty_per_unit numeric(12, 4) not null check (qty_per_unit >= 0),
    unit text not null default 'pcs',
    override_unit_cost numeric(12, 4),
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ROW LEVEL SECURITY (RLS) POLICIES
alter table public.products enable row level security;
alter table public.inventory enable row level security;
alter table public.customers enable row level security;
alter table public.suppliers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.expenses enable row level security;
alter table public.audit_logs enable row level security;
alter table public.master_lists enable row level security;
alter table public.recipes enable row level security;

-- Default open access for authenticated studio users:
create policy "Allow authenticated full access to products" on public.products for all using (auth.role() = 'authenticated');
create policy "Allow authenticated full access to inventory" on public.inventory for all using (auth.role() = 'authenticated');
create policy "Allow authenticated full access to orders" on public.orders for all using (auth.role() = 'authenticated');
create policy "Allow authenticated full access to customers" on public.customers for all using (auth.role() = 'authenticated');
create policy "Allow authenticated full access to payments" on public.payments for all using (auth.role() = 'authenticated');
create policy "Allow authenticated full access to expenses" on public.expenses for all using (auth.role() = 'authenticated');
create policy "Allow authenticated full access to suppliers" on public.suppliers for all using (auth.role() = 'authenticated');
create policy "Allow authenticated full access to audit_logs" on public.audit_logs for all using (auth.role() = 'authenticated');
create policy "Allow authenticated full access to master_lists" on public.master_lists for all using (auth.role() = 'authenticated');
create policy "Allow authenticated full access to recipes" on public.recipes for all using (auth.role() = 'authenticated');
