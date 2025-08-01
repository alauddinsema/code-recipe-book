-- Pantry Management Database Schema
-- Digital pantry system for tracking ingredients, quantities, and expiration dates
-- Supports real-time inventory management and smart notifications

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PANTRY CATEGORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS pantry_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  storage_location TEXT, -- 'refrigerator', 'freezer', 'pantry', 'counter'
  typical_shelf_life_days INTEGER, -- default shelf life for items in this category
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PANTRY ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS pantry_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  quantity DECIMAL(10,3) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'piece',
  category_id TEXT REFERENCES pantry_categories(id) NOT NULL,
  purchase_date DATE,
  expiration_date DATE,
  opened_date DATE,
  storage_location TEXT, -- override category default
  barcode TEXT,
  purchase_price DECIMAL(10,2),
  store_purchased TEXT,
  notes TEXT,
  is_running_low BOOLEAN DEFAULT false,
  low_stock_threshold DECIMAL(10,3) DEFAULT 1,
  auto_add_to_shopping BOOLEAN DEFAULT true,
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL, -- if added from recipe
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- EXPIRATION TRACKING TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS expiration_tracking (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pantry_item_id UUID REFERENCES pantry_items(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  expiration_date DATE NOT NULL,
  notification_sent BOOLEAN DEFAULT false,
  notification_date TIMESTAMP WITH TIME ZONE,
  days_before_expiry INTEGER DEFAULT 3, -- when to send notification
  status TEXT CHECK (status IN ('fresh', 'expiring_soon', 'expired', 'consumed')) DEFAULT 'fresh',
  consumed_date DATE,
  waste_reason TEXT, -- if expired and thrown away
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PANTRY USAGE HISTORY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS pantry_usage_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pantry_item_id UUID REFERENCES pantry_items(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  recipe_title TEXT,
  quantity_used DECIMAL(10,3) NOT NULL,
  unit TEXT NOT NULL,
  usage_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  remaining_quantity DECIMAL(10,3),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PANTRY SHOPPING SUGGESTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS pantry_shopping_suggestions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pantry_item_id UUID REFERENCES pantry_items(id) ON DELETE CASCADE,
  suggested_item_name TEXT NOT NULL,
  suggested_quantity DECIMAL(10,3) DEFAULT 1,
  suggested_unit TEXT DEFAULT 'piece',
  category_id TEXT REFERENCES pantry_categories(id) NOT NULL,
  reason TEXT, -- 'running_low', 'expired', 'recipe_needed', 'ai_suggestion'
  priority INTEGER DEFAULT 1, -- 1=high, 2=medium, 3=low
  is_added_to_shopping BOOLEAN DEFAULT false,
  grocery_list_id UUID REFERENCES grocery_lists(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- ============================================================================
-- INSERT DEFAULT PANTRY CATEGORIES
-- ============================================================================
INSERT INTO pantry_categories (id, name, icon, color, sort_order, storage_location, typical_shelf_life_days) VALUES
  ('fresh-produce', 'Fresh Produce', '🥬', '#10B981', 1, 'refrigerator', 7),
  ('meat-poultry', 'Meat & Poultry', '🥩', '#EF4444', 2, 'refrigerator', 3),
  ('dairy', 'Dairy Products', '🥛', '#F59E0B', 3, 'refrigerator', 7),
  ('frozen-foods', 'Frozen Foods', '🧊', '#06B6D4', 4, 'freezer', 90),
  ('canned-goods', 'Canned Goods', '🥫', '#8B5CF6', 5, 'pantry', 730),
  ('dry-goods', 'Dry Goods', '🌾', '#D97706', 6, 'pantry', 365),
  ('spices-seasonings', 'Spices & Seasonings', '🌿', '#22C55E', 7, 'pantry', 1095),
  ('oils-vinegars', 'Oils & Vinegars', '🫒', '#84CC16', 8, 'pantry', 365),
  ('baking-supplies', 'Baking Supplies', '🧁', '#EC4899', 9, 'pantry', 365),
  ('beverages', 'Beverages', '🥤', '#3B82F6', 10, 'pantry', 180),
  ('snacks', 'Snacks', '🍿', '#F97316', 11, 'pantry', 90),
  ('condiments-sauces', 'Condiments & Sauces', '🍯', '#F59E0B', 12, 'refrigerator', 180),
  ('bread-bakery', 'Bread & Bakery', '🍞', '#D97706', 13, 'counter', 5),
  ('leftovers', 'Leftovers', '🍽️', '#6B7280', 14, 'refrigerator', 3)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- CREATE PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_pantry_items_user_id ON pantry_items(user_id);
CREATE INDEX IF NOT EXISTS idx_pantry_items_category ON pantry_items(category_id);
CREATE INDEX IF NOT EXISTS idx_pantry_items_expiration ON pantry_items(expiration_date);
CREATE INDEX IF NOT EXISTS idx_pantry_items_running_low ON pantry_items(is_running_low);
CREATE INDEX IF NOT EXISTS idx_pantry_items_storage ON pantry_items(storage_location);
CREATE INDEX IF NOT EXISTS idx_expiration_tracking_user ON expiration_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_expiration_tracking_date ON expiration_tracking(expiration_date);
CREATE INDEX IF NOT EXISTS idx_expiration_tracking_status ON expiration_tracking(status);
CREATE INDEX IF NOT EXISTS idx_pantry_usage_user ON pantry_usage_history(user_id);
CREATE INDEX IF NOT EXISTS idx_pantry_usage_date ON pantry_usage_history(usage_date DESC);
CREATE INDEX IF NOT EXISTS idx_pantry_usage_recipe ON pantry_usage_history(recipe_id);
CREATE INDEX IF NOT EXISTS idx_shopping_suggestions_user ON pantry_shopping_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_suggestions_priority ON pantry_shopping_suggestions(priority);
CREATE INDEX IF NOT EXISTS idx_shopping_suggestions_expires ON pantry_shopping_suggestions(expires_at);

-- ============================================================================
-- CREATE UPDATE TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_pantry_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pantry_categories_updated_at
    BEFORE UPDATE ON pantry_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_pantry_updated_at_column();

CREATE TRIGGER trigger_pantry_items_updated_at
    BEFORE UPDATE ON pantry_items
    FOR EACH ROW
    EXECUTE FUNCTION update_pantry_updated_at_column();

CREATE TRIGGER trigger_expiration_tracking_updated_at
    BEFORE UPDATE ON expiration_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_pantry_updated_at_column();

-- ============================================================================
-- CREATE EXPIRATION STATUS UPDATE FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION update_expiration_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update status based on expiration date
    IF NEW.expiration_date <= CURRENT_DATE THEN
        NEW.status = 'expired';
    ELSIF NEW.expiration_date <= CURRENT_DATE + INTERVAL '3 days' THEN
        NEW.status = 'expiring_soon';
    ELSE
        NEW.status = 'fresh';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_expiration_status
    BEFORE INSERT OR UPDATE ON expiration_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_expiration_status();

-- ============================================================================
-- CREATE LOW STOCK DETECTION FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Update is_running_low based on quantity vs threshold
    IF NEW.quantity <= NEW.low_stock_threshold THEN
        NEW.is_running_low = true;
        
        -- Auto-create shopping suggestion if enabled
        IF NEW.auto_add_to_shopping = true THEN
            INSERT INTO pantry_shopping_suggestions (
                user_id, pantry_item_id, suggested_item_name, 
                suggested_quantity, suggested_unit, category_id, reason, priority
            ) VALUES (
                NEW.user_id, NEW.id, NEW.name,
                NEW.low_stock_threshold * 2, NEW.unit, NEW.category_id, 
                'running_low', 1
            ) ON CONFLICT DO NOTHING;
        END IF;
    ELSE
        NEW.is_running_low = false;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_low_stock
    BEFORE INSERT OR UPDATE ON pantry_items
    FOR EACH ROW
    EXECUTE FUNCTION check_low_stock();

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE pantry_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expiration_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE pantry_usage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE pantry_shopping_suggestions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES
-- ============================================================================

-- Pantry Categories (public read)
CREATE POLICY "Anyone can view pantry categories" ON pantry_categories
    FOR SELECT USING (true);

-- Pantry Items
CREATE POLICY "Users can view their own pantry items" ON pantry_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pantry items" ON pantry_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pantry items" ON pantry_items
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pantry items" ON pantry_items
    FOR DELETE USING (auth.uid() = user_id);

-- Expiration Tracking
CREATE POLICY "Users can view their own expiration tracking" ON expiration_tracking
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own expiration tracking" ON expiration_tracking
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expiration tracking" ON expiration_tracking
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expiration tracking" ON expiration_tracking
    FOR DELETE USING (auth.uid() = user_id);

-- Pantry Usage History
CREATE POLICY "Users can view their own usage history" ON pantry_usage_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own usage history" ON pantry_usage_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage history" ON pantry_usage_history
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own usage history" ON pantry_usage_history
    FOR DELETE USING (auth.uid() = user_id);

-- Pantry Shopping Suggestions
CREATE POLICY "Users can view their own shopping suggestions" ON pantry_shopping_suggestions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own shopping suggestions" ON pantry_shopping_suggestions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shopping suggestions" ON pantry_shopping_suggestions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shopping suggestions" ON pantry_shopping_suggestions
    FOR DELETE USING (auth.uid() = user_id);

-- Success message
SELECT 'Pantry Management Database Schema Created Successfully! 🏺' as status;
