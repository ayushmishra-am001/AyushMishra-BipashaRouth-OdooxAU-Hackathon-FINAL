-- Rental Management System — full schema (owned by Step 0, later steps only ADD)

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin','customer')),
  phone TEXT,
  address TEXT,
  profile_image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  sku TEXT UNIQUE,
  image TEXT,
  base_price INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_variants (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  attribute_name TEXT NOT NULL,
  attribute_value TEXT NOT NULL,
  price_delta INTEGER NOT NULL DEFAULT 0,
  stock_qty INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS price_lists (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  valid_from DATE,
  valid_to DATE
);

CREATE TABLE IF NOT EXISTS price_list_items (
  id SERIAL PRIMARY KEY,
  price_list_id INTEGER NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  unit TEXT NOT NULL CHECK (unit IN ('hour','day','week','month')),
  price INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS rental_periods (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  min_duration INTEGER NOT NULL,
  max_duration INTEGER,
  unit TEXT NOT NULL CHECK (unit IN ('hour','day','week','month'))
);

CREATE TABLE IF NOT EXISTS carts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','converted'))
);

CREATE TABLE IF NOT EXISTS cart_items (
  id SERIAL PRIMARY KEY,
  cart_id INTEGER NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  variant_id INTEGER REFERENCES product_variants(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  price_snapshot INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  order_type TEXT NOT NULL DEFAULT 'online' CHECK (order_type IN ('online','offline')),
  status TEXT NOT NULL DEFAULT 'pending',
  delivery_mode TEXT NOT NULL CHECK (delivery_mode IN ('ship','store')),
  address TEXT,
  subtotal INTEGER NOT NULL,
  deposit_amount INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  variant_id INTEGER REFERENCES product_variants(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  price INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS security_deposits (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'held' CHECK (status IN ('held','refunded','partially_refunded')),
  refunded_amount INTEGER NOT NULL DEFAULT 0,
  refunded_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS late_fee_rules (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  rate_type TEXT NOT NULL CHECK (rate_type IN ('hourly','daily','weekly','monthly')),
  rate_amount INTEGER NOT NULL,
  grace_period_hours INTEGER NOT NULL DEFAULT 0,
  max_fee INTEGER
);

CREATE TABLE IF NOT EXISTS quotation_templates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  header_text TEXT,
  footer_text TEXT
);

CREATE TABLE IF NOT EXISTS quotations (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES users(id),
  customer_id INTEGER REFERENCES users(id),
  template_id INTEGER REFERENCES quotation_templates(id),
  items JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','confirmed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pickup_schedules (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','done')),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS return_records (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  returned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  condition_notes TEXT,
  damage_reported BOOLEAN NOT NULL DEFAULT false,
  late_hours INTEGER NOT NULL DEFAULT 0,
  late_fee_charged INTEGER,
  stock_updated BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('rental','penalty')),
  amount INTEGER NOT NULL,
  pdf_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- No demo/hardcoded products. The default price list is the only thing
-- seeded here (products need an active price list to show pricing) —
-- the admin adds all products, categories, and images themselves via
-- the Admin Products page.
-- ─────────────────────────────────────────────────────────────────────────

INSERT INTO price_lists (name, is_default, valid_from, valid_to)
SELECT 'Standard Pricing', true, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM price_lists WHERE is_default = true);