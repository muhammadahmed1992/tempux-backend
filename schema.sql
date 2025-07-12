CREATE SCHEMA IF NOT EXISTS users;
CREATE SCHEMA IF NOT EXISTS products;
CREATE SCHEMA IF NOT EXISTS orders;
CREATE SCHEMA IF NOT EXISTS shipments;
CREATE SCHEMA IF NOT EXISTS logistics;
CREATE SCHEMA IF NOT EXISTS payments;
CREATE SCHEMA IF NOT EXISTS finance;
CREATE SCHEMA IF NOT EXISTS customer_service;

-- USERS SCHEMA
CREATE TABLE IF NOT EXISTS users.user_type (
    id SMALLINT PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS users.users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(15) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    password VARCHAR(150) NOT NULL,
    user_type SMALLINT NOT NULL REFERENCES users.user_type(id),
    telephone VARCHAR(15),
    address VARCHAR(150),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT users_name_user_type_unique UNIQUE (name, user_type)
);

CREATE TABLE IF NOT EXISTS users.access_management (
    id SERIAL PRIMARY KEY,
    access VARCHAR(50) NOT NULL,
    description VARCHAR(200),
    user_type_id SMALLINT NOT NULL REFERENCES users.user_type(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false
);

-- PRODUCTS SCHEMA
CREATE TABLE IF NOT EXISTS products.category (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(150),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS products.product_size (
    id SMALLINT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(150),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS products.products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(150),
    sku VARCHAR(64) NOT NULL UNIQUE,
    image_url TEXT NOT NULL,
    slug TEXT,
    is_available BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    product_size_id SMALLINT REFERENCES products.product_size(id),
    is_excel_imported BOOLEAN NOT NULL DEFAULT false,
    excel_import_batch INTEGER,
    seller_id BIGINT REFERENCES users.users(id),
    created_by BIGINT NOT NULL REFERENCES users.users(id),
    updated_by BIGINT NOT NULL REFERENCES users.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS products.product_tags (
    id SMALLINT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(150),
    valid_from DATE NOT NULL,
    valid_to DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS products.product_tags_assignment (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products.products(id),
    product_tags_id SMALLINT NOT NULL REFERENCES products.product_tags(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS products.color (
    id SMALLINT PRIMARY KEY,
    name VARCHAR(20) NOT NULL,
    color_hex_code CHAR(7) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS products.product_color (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products.products(id),
    product_color_id SMALLINT NOT NULL REFERENCES products.color(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS products.product_review_ratings (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products.products(id),
    reviews TEXT NOT NULL,
    ratings DECIMAL(2,1) NOT NULL CHECK (ratings BETWEEN 0 AND 5),
    reviewed_by BIGINT NOT NULL REFERENCES users.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS products.products_inventory (
    product_id BIGINT PRIMARY KEY REFERENCES products.products(id),
    price DECIMAL(10, 2) NOT NULL,
    cost_price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL,
    discount DECIMAL(5, 2),
    created_by BIGINT NOT NULL REFERENCES users.users(id),
    updated_by BIGINT NOT NULL REFERENCES users.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS users.seller_profile_detail (
    id BIGSERIAL PRIMARY KEY,
    brand_name VARCHAR(50) NOT NULL,
    brand_description VARCHAR(100),
    user_id BIGINT NOT NULL REFERENCES users.users(id),
    vat_number VARCHAR(15),
    is_private BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    is_deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS users.seller_profile_rating (
    id BIGSERIAL PRIMARY KEY,
    rating_name VARCHAR(50) NOT NULL,
    rating_value DECIMAL(2,1) CHECK (rating_value BETWEEN 0 AND 5),
    seller_id BIGINT REFERENCES users.users(id),
    reviewed_by BIGINT REFERENCES users.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    is_deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS products.cart_items (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users.users(id),
  product_id BIGINT NOT NULL REFERENCES products.products(id),
  quantity SMALLINT NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS products.favorite_products (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users.users(id),
  product_id BIGINT NOT NULL REFERENCES products.products(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS users.saved_searches (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users.users(id),
  search_query JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS finance.tax_rules (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  tax_percentage DECIMAL(5, 2) NOT NULL,
  country_code CHAR(2) NOT NULL,
  region VARCHAR(100),
  tax_location GEOGRAPHY(Point, 4326),
  radius_km NUMERIC(5, 2),
  applies_to VARCHAR(50) DEFAULT 'product',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS products.product_tax_assignment (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT REFERENCES products.products(id),
  category_id BIGINT REFERENCES products.category(id),
  tax_rule_id INT NOT NULL REFERENCES finance.tax_rules(id),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (product_id IS NOT NULL OR category_id IS NOT NULL) AND
    NOT (product_id IS NOT NULL AND category_id IS NOT NULL)
  )
);

-- PAYMENTS
CREATE TABLE IF NOT EXISTS payments.payment_modes (
    id SMALLSERIAL PRIMARY KEY,
    name VARCHAR(30) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- ORDER SCHEMA
CREATE TABLE IF NOT EXISTS orders.orders (
    id BIGSERIAL PRIMARY KEY,
    buyer_id BIGINT NOT NULL REFERENCES users.users(id),
    total_amount NUMERIC(12,2) NOT NULL,
    total_tax NUMERIC(10,2) NOT NULL DEFAULT 0,
    discount NUMERIC(10,2) DEFAULT 0,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    escrow_status VARCHAR(20) NOT NULL DEFAULT 'held',
    order_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    payment_mode_id SMALLINT REFERENCES payments.payment_modes(id),
    order_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS orders.order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders.orders(id),
    product_id BIGINT NOT NULL REFERENCES products.products(id),
    seller_id BIGINT NOT NULL REFERENCES users.users(id),
    quantity INT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    tax_amount NUMERIC(10,2) DEFAULT 0,
    total_amount NUMERIC(12,2) GENERATED ALWAYS AS (quantity * price + COALESCE(tax_amount,0)) STORED,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    order_item_datetime TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS logistics.shipping_providers (
    id SMALLSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    api_endpoint TEXT,
    webhook_url TEXT,
    tracking_url_template TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS logistics.shipments (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders.orders(id),
    shipping_provider_id SMALLINT NOT NULL REFERENCES logistics.shipping_providers(id),
    tracking_number VARCHAR(50),
    shipped_by BIGINT,
    shipment_status VARCHAR(20) DEFAULT 'label_created',
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS logistics.shipment_items (
    id BIGSERIAL PRIMARY KEY,
    shipment_id BIGINT NOT NULL REFERENCES logistics.shipments(id),
    order_item_id BIGINT NOT NULL REFERENCES orders.order_items(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);


CREATE TABLE IF NOT EXISTS payments.payment_transactions (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders.orders(id),
    payment_mode_id SMALLINT NOT NULL REFERENCES payments.payment_modes(id),
    transaction_id VARCHAR(100),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(5) DEFAULT 'USD',
    status VARCHAR(20) NOT NULL,
    paid_at TIMESTAMPTZ,
    is_refunded BOOLEAN DEFAULT false,
    is_deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS orders.order_seller_escrow (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders.orders(id),
    seller_id BIGINT NOT NULL REFERENCES users.users(id),
    total_amount DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    commission_amount DECIMAL(10,2) DEFAULT 0,
    escrow_status VARCHAR(20) NOT NULL DEFAULT 'held',
    released_by BIGINT REFERENCES users.users(id),
    released_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE,
    UNIQUE (order_id, seller_id)
);

CREATE TABLE IF NOT EXISTS orders.escrow_releases (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders.orders(id),
    seller_id BIGINT NOT NULL REFERENCES users.users(id),
    released_by BIGINT NOT NULL REFERENCES users.users(id),
    release_amount DECIMAL(12,2),
    commission_amount DECIMAL(10,2) DEFAULT 0,
    released_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS orders.order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders.orders(id),
    product_id BIGINT NOT NULL REFERENCES products.products(id),
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS customer_service.return_reasons (
    id SMALLINT PRIMARY KEY,
    reason_text VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS customer_service.refund_methods (
    id SMALLINT PRIMARY KEY,
    method_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS customer_service.dispute_types (
    id SMALLINT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS customer_service.returns (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders.orders(id),
    order_item_id BIGINT NOT NULL REFERENCES orders.order_items(id),
    requested_by BIGINT NOT NULL REFERENCES users.users(id),
    return_reason_id SMALLINT NOT NULL REFERENCES customer_service.return_reasons(id),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    approved_by BIGINT REFERENCES users.users(id),
    approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS customer_service.refunds (
    id BIGSERIAL PRIMARY KEY,
    return_id BIGINT NOT NULL REFERENCES customer_service.returns(id),
    refund_amount DECIMAL(10, 2) NOT NULL,
    refund_method_id SMALLINT NOT NULL REFERENCES customer_service.refund_methods(id),
    refunded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_by BIGINT REFERENCES users.users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS customer_service.disputes (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders.orders(id),
    user_id BIGINT NOT NULL REFERENCES users.users(id),
    issue_type_id SMALLINT NOT NULL REFERENCES customer_service.dispute_types(id),
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    resolved_by BIGINT REFERENCES users.users(id),
    resolved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    related_return_id BIGINT REFERENCES customer_service.returns(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS customer_service.return_status_log (
    id BIGSERIAL PRIMARY KEY,
    return_id BIGINT NOT NULL REFERENCES customer_service.returns(id),
    previous_status VARCHAR(30) NOT NULL,
    new_status VARCHAR(30) NOT NULL,
    changed_by BIGINT REFERENCES users.users(id),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_service.return_attachments (
    id BIGSERIAL PRIMARY KEY,
    return_id BIGINT REFERENCES customer_service.returns(id),
    file_url TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_service.dispute_attachments (
    id BIGSERIAL PRIMARY KEY,
    dispute_id BIGINT REFERENCES customer_service.disputes(id),
    file_url TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);