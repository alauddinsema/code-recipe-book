-- Ingredient Master Data Database Schema
-- Standardized ingredient management across pantry, recipes, and shopping lists
-- Supports AI-powered ingredient recognition and normalization

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- INGREDIENT CATEGORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS ingredient_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  parent_category_id TEXT REFERENCES ingredient_categories(id),
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  -- Storage and shelf life defaults
  default_storage_location TEXT CHECK (default_storage_location IN ('refrigerator', 'freezer', 'pantry', 'counter')),
  default_shelf_life_days INTEGER,
  
  -- Nutritional category
  nutritional_category TEXT, -- 'protein', 'carbohydrate', 'fat', 'vegetable', 'fruit', 'dairy', 'grain'
  
  -- AI processing hints
  common_aliases TEXT[], -- alternative names for this category
  search_keywords TEXT[], -- keywords for AI categorization
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INGREDIENT MASTER TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS ingredient_master (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  normalized_name TEXT NOT NULL, -- standardized lowercase name
  category_id TEXT REFERENCES ingredient_categories(id) NOT NULL,
  
  -- Alternative names and aliases
  common_names TEXT[], -- "tomato", "roma tomato", "cherry tomato"
  brand_names TEXT[], -- specific brand variations
  regional_names TEXT[], -- regional/cultural variations
  scientific_name TEXT, -- botanical/scientific name
  
  -- Physical properties
  density DECIMAL(8,4), -- g/ml for volume-weight conversions
  default_unit TEXT NOT NULL DEFAULT 'piece',
  common_units TEXT[] DEFAULT '{"piece", "cup", "tablespoon", "teaspoon", "pound", "ounce", "gram"}',
  
  -- Storage information
  storage_location TEXT CHECK (storage_location IN ('refrigerator', 'freezer', 'pantry', 'counter')),
  shelf_life_days INTEGER,
  freezer_life_days INTEGER,
  
  -- Nutritional information (per 100g)
  calories_per_100g DECIMAL(8,2),
  protein_g DECIMAL(8,2),
  carbs_g DECIMAL(8,2),
  fat_g DECIMAL(8,2),
  fiber_g DECIMAL(8,2),
  sugar_g DECIMAL(8,2),
  sodium_mg DECIMAL(8,2),
  
  -- Cost estimation
  average_price_per_unit DECIMAL(10,4),
  price_currency TEXT DEFAULT 'USD',
  price_last_updated DATE,
  seasonal_availability TEXT[], -- months when typically available/cheaper
  
  -- AI and search optimization
  search_vector tsvector, -- full-text search
  ai_confidence_score DECIMAL(3,2) DEFAULT 1.00, -- confidence in data accuracy
  verification_status TEXT CHECK (verification_status IN ('verified', 'pending', 'needs_review')) DEFAULT 'pending',
  
  -- Usage statistics
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  data_source TEXT, -- 'user_input', 'ai_generated', 'usda_database', 'manual_entry'
  barcode TEXT, -- UPC/EAN for product identification
  image_url TEXT,
  description TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INGREDIENT CONVERSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS ingredient_conversions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ingredient_id UUID REFERENCES ingredient_master(id) ON DELETE CASCADE NOT NULL,
  from_unit TEXT NOT NULL,
  to_unit TEXT NOT NULL,
  conversion_factor DECIMAL(12,6) NOT NULL, -- multiply by this to convert
  
  -- Conversion metadata
  accuracy TEXT CHECK (accuracy IN ('exact', 'approximate', 'estimated')) DEFAULT 'approximate',
  notes TEXT,
  data_source TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique conversion pairs
  UNIQUE(ingredient_id, from_unit, to_unit)
);

-- ============================================================================
-- INGREDIENT SUBSTITUTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS ingredient_substitutions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  original_ingredient_id UUID REFERENCES ingredient_master(id) ON DELETE CASCADE NOT NULL,
  substitute_ingredient_id UUID REFERENCES ingredient_master(id) ON DELETE CASCADE NOT NULL,
  substitution_ratio DECIMAL(8,4) DEFAULT 1.0000, -- how much substitute to use
  
  -- Substitution context
  recipe_type TEXT[], -- 'baking', 'cooking', 'sauce', 'marinade'
  dietary_reason TEXT[], -- 'vegan', 'gluten_free', 'dairy_free', 'low_sodium'
  flavor_impact TEXT CHECK (flavor_impact IN ('none', 'minimal', 'moderate', 'significant')),
  texture_impact TEXT CHECK (texture_impact IN ('none', 'minimal', 'moderate', 'significant')),
  
  -- Quality and confidence
  substitution_quality INTEGER CHECK (substitution_quality >= 1 AND substitution_quality <= 5) DEFAULT 3,
  user_rating DECIMAL(3,2), -- average user rating
  usage_count INTEGER DEFAULT 0,
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent self-substitution
  CHECK (original_ingredient_id != substitute_ingredient_id)
);

-- ============================================================================
-- INGREDIENT ALIASES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS ingredient_aliases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ingredient_id UUID REFERENCES ingredient_master(id) ON DELETE CASCADE NOT NULL,
  alias TEXT NOT NULL,
  alias_type TEXT CHECK (alias_type IN ('common_name', 'brand_name', 'regional_name', 'misspelling', 'abbreviation')) NOT NULL,
  language TEXT DEFAULT 'en',
  confidence DECIMAL(3,2) DEFAULT 1.00,
  usage_frequency INTEGER DEFAULT 0, -- how often this alias is used
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique aliases
  UNIQUE(alias, language)
);

-- ============================================================================
-- INGREDIENT RECOGNITION CACHE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS ingredient_recognition_cache (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  input_text TEXT NOT NULL,
  normalized_text TEXT NOT NULL,
  recognized_ingredient_id UUID REFERENCES ingredient_master(id) ON DELETE CASCADE,
  confidence_score DECIMAL(3,2) NOT NULL,
  
  -- Parsing results
  extracted_quantity DECIMAL(10,3),
  extracted_unit TEXT,
  extracted_modifiers TEXT[], -- 'fresh', 'dried', 'chopped', 'organic'
  
  -- AI processing metadata
  ai_model_used TEXT DEFAULT 'gemini-2.5-flash',
  processing_time_ms INTEGER,
  tokens_used INTEGER,
  
  -- Cache management
  hit_count INTEGER DEFAULT 1,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint for caching
  UNIQUE(input_text, normalized_text)
);

-- ============================================================================
-- INSERT DEFAULT INGREDIENT CATEGORIES
-- ============================================================================
INSERT INTO ingredient_categories (id, name, parent_category_id, icon, color, sort_order, default_storage_location, default_shelf_life_days, nutritional_category) VALUES
  ('vegetables', 'Vegetables', NULL, '🥬', '#10B981', 1, 'refrigerator', 7, 'vegetable'),
  ('fruits', 'Fruits', NULL, '🍎', '#F59E0B', 2, 'counter', 5, 'fruit'),
  ('proteins', 'Proteins', NULL, '🥩', '#EF4444', 3, 'refrigerator', 3, 'protein'),
  ('dairy', 'Dairy & Eggs', NULL, '🥛', '#F59E0B', 4, 'refrigerator', 7, 'dairy'),
  ('grains', 'Grains & Cereals', NULL, '🌾', '#D97706', 5, 'pantry', 365, 'carbohydrate'),
  ('legumes', 'Legumes & Beans', NULL, '🫘', '#8B5CF6', 6, 'pantry', 730, 'protein'),
  ('nuts-seeds', 'Nuts & Seeds', NULL, '🥜', '#92400E', 7, 'pantry', 180, 'fat'),
  ('herbs-spices', 'Herbs & Spices', NULL, '🌿', '#22C55E', 8, 'pantry', 1095, NULL),
  ('oils-fats', 'Oils & Fats', NULL, '🫒', '#84CC16', 9, 'pantry', 365, 'fat'),
  ('sweeteners', 'Sweeteners', NULL, '🍯', '#F59E0B', 10, 'pantry', 730, 'carbohydrate'),
  ('beverages', 'Beverages', NULL, '🥤', '#3B82F6', 11, 'pantry', 180, NULL),
  ('condiments', 'Condiments & Sauces', NULL, '🍅', '#EF4444', 12, 'refrigerator', 180, NULL),
  ('baking', 'Baking Ingredients', NULL, '🧁', '#EC4899', 13, 'pantry', 365, NULL),
  ('frozen', 'Frozen Foods', NULL, '🧊', '#06B6D4', 14, 'freezer', 90, NULL),
  ('canned', 'Canned & Preserved', NULL, '🥫', '#6B7280', 15, 'pantry', 730, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- CREATE PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_ingredient_master_name ON ingredient_master(name);
CREATE INDEX IF NOT EXISTS idx_ingredient_master_normalized ON ingredient_master(normalized_name);
CREATE INDEX IF NOT EXISTS idx_ingredient_master_category ON ingredient_master(category_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_master_search ON ingredient_master USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_ingredient_master_usage ON ingredient_master(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_ingredient_conversions_ingredient ON ingredient_conversions(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_conversions_units ON ingredient_conversions(from_unit, to_unit);
CREATE INDEX IF NOT EXISTS idx_ingredient_substitutions_original ON ingredient_substitutions(original_ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_substitutions_substitute ON ingredient_substitutions(substitute_ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_aliases_ingredient ON ingredient_aliases(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_aliases_alias ON ingredient_aliases(alias);
CREATE INDEX IF NOT EXISTS idx_ingredient_recognition_input ON ingredient_recognition_cache(input_text);
CREATE INDEX IF NOT EXISTS idx_ingredient_recognition_expires ON ingredient_recognition_cache(expires_at);

-- ============================================================================
-- CREATE FULL-TEXT SEARCH UPDATE TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION update_ingredient_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', 
        COALESCE(NEW.name, '') || ' ' ||
        COALESCE(array_to_string(NEW.common_names, ' '), '') || ' ' ||
        COALESCE(array_to_string(NEW.brand_names, ' '), '') || ' ' ||
        COALESCE(array_to_string(NEW.regional_names, ' '), '') || ' ' ||
        COALESCE(NEW.scientific_name, '') || ' ' ||
        COALESCE(NEW.description, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ingredient_search_vector
    BEFORE INSERT OR UPDATE ON ingredient_master
    FOR EACH ROW
    EXECUTE FUNCTION update_ingredient_search_vector();

-- ============================================================================
-- CREATE UPDATE TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_ingredient_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ingredient_categories_updated_at
    BEFORE UPDATE ON ingredient_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_ingredient_updated_at_column();

CREATE TRIGGER trigger_ingredient_master_updated_at
    BEFORE UPDATE ON ingredient_master
    FOR EACH ROW
    EXECUTE FUNCTION update_ingredient_updated_at_column();

-- ============================================================================
-- CREATE USAGE TRACKING FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION track_ingredient_usage()
RETURNS TRIGGER AS $$
BEGIN
    -- Update usage statistics when ingredient is referenced
    UPDATE ingredient_master SET
        usage_count = usage_count + 1,
        last_used_at = NOW()
    WHERE id = NEW.ingredient_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: This trigger would be added to tables that reference ingredients
-- CREATE TRIGGER trigger_track_ingredient_usage
--     AFTER INSERT ON pantry_items
--     FOR EACH ROW
--     EXECUTE FUNCTION track_ingredient_usage();

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE ingredient_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_substitutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_recognition_cache ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES (PUBLIC READ FOR MASTER DATA)
-- ============================================================================

-- Ingredient Categories (public read)
CREATE POLICY "Anyone can view ingredient categories" ON ingredient_categories
    FOR SELECT USING (true);

-- Ingredient Master (public read)
CREATE POLICY "Anyone can view ingredient master data" ON ingredient_master
    FOR SELECT USING (true);

-- Ingredient Conversions (public read)
CREATE POLICY "Anyone can view ingredient conversions" ON ingredient_conversions
    FOR SELECT USING (true);

-- Ingredient Substitutions (public read)
CREATE POLICY "Anyone can view ingredient substitutions" ON ingredient_substitutions
    FOR SELECT USING (true);

-- Ingredient Aliases (public read)
CREATE POLICY "Anyone can view ingredient aliases" ON ingredient_aliases
    FOR SELECT USING (true);

-- Ingredient Recognition Cache (public read/write for performance)
CREATE POLICY "Anyone can view ingredient recognition cache" ON ingredient_recognition_cache
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create ingredient recognition cache entries" ON ingredient_recognition_cache
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update ingredient recognition cache entries" ON ingredient_recognition_cache
    FOR UPDATE USING (true);

-- Success message
SELECT 'Ingredient Master Data Database Schema Created Successfully! 🥕' as status;
