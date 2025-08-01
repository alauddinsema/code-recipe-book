-- Recipe Import Tracking Database Schema
-- Track imported recipes, source URLs, import status, and metadata
-- Supports Universal Recipe Importer feature with AI parsing

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- RECIPE IMPORTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS recipe_imports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source_url TEXT NOT NULL,
  source_domain TEXT, -- extracted from URL for analytics
  import_method TEXT CHECK (import_method IN ('url_parse', 'manual_entry', 'ai_generate', 'bulk_import')) DEFAULT 'url_parse',
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',
  
  -- Original scraped data
  raw_html TEXT,
  scraped_title TEXT,
  scraped_description TEXT,
  scraped_ingredients TEXT[],
  scraped_instructions TEXT[],
  scraped_image_url TEXT,
  scraped_prep_time INTEGER,
  scraped_cook_time INTEGER,
  scraped_servings INTEGER,
  scraped_difficulty TEXT,
  scraped_category TEXT,
  scraped_tags TEXT[],
  
  -- AI processing results
  ai_processed BOOLEAN DEFAULT false,
  ai_confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  ai_processing_time_ms INTEGER,
  ai_model_used TEXT DEFAULT 'gemini-2.5-flash',
  ai_tokens_used INTEGER,
  
  -- Final recipe data (after AI enhancement)
  final_recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  final_title TEXT,
  final_description TEXT,
  final_ingredients TEXT[],
  final_instructions TEXT[],
  final_image_url TEXT,
  final_prep_time INTEGER,
  final_cook_time INTEGER,
  final_servings INTEGER,
  final_difficulty TEXT,
  final_category TEXT,
  final_tags TEXT[],
  
  -- Import metadata
  import_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  import_completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  error_details JSONB,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- User interaction
  user_approved BOOLEAN DEFAULT false,
  user_modifications JSONB, -- track what user changed
  user_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- RECIPE IMPORT SOURCES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS recipe_import_sources (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  domain TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL, -- "AllRecipes", "Food Network", etc.
  logo_url TEXT,
  is_supported BOOLEAN DEFAULT true,
  parsing_rules JSONB, -- custom parsing rules for this source
  success_rate DECIMAL(5,2) DEFAULT 0.00, -- percentage of successful imports
  total_imports INTEGER DEFAULT 0,
  successful_imports INTEGER DEFAULT 0,
  average_processing_time_ms INTEGER,
  last_successful_import TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- RECIPE IMPORT ANALYTICS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS recipe_import_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  source_domain TEXT,
  total_attempts INTEGER DEFAULT 0,
  successful_imports INTEGER DEFAULT 0,
  failed_imports INTEGER DEFAULT 0,
  average_processing_time_ms INTEGER,
  total_ai_tokens_used INTEGER DEFAULT 0,
  total_ai_cost_usd DECIMAL(10,4) DEFAULT 0.0000,
  unique_users INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Composite unique constraint for daily analytics per domain
  UNIQUE(date, source_domain)
);

-- ============================================================================
-- RECIPE IMPORT QUEUE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS recipe_import_queue (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipe_import_id UUID REFERENCES recipe_imports(id) ON DELETE CASCADE NOT NULL,
  priority INTEGER DEFAULT 1, -- 1=high, 2=medium, 3=low
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processing_started_at TIMESTAMP WITH TIME ZONE,
  processing_completed_at TIMESTAMP WITH TIME ZONE,
  worker_id TEXT, -- which background worker is processing
  status TEXT CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')) DEFAULT 'queued',
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INSERT DEFAULT RECIPE IMPORT SOURCES
-- ============================================================================
INSERT INTO recipe_import_sources (domain, name, is_supported, parsing_rules) VALUES
  ('allrecipes.com', 'AllRecipes', true, '{"title_selector": "h1.recipe-summary__h1", "ingredients_selector": ".recipe-ingred_txt"}'),
  ('food.com', 'Food.com', true, '{"title_selector": "h1.recipe-title", "ingredients_selector": ".recipe-ingredients li"}'),
  ('foodnetwork.com', 'Food Network', true, '{"title_selector": "h1.o-AssetTitle__a-HeadlineText", "ingredients_selector": ".o-RecipeIngredient__a-Ingredient"}'),
  ('epicurious.com', 'Epicurious', true, '{"title_selector": "h1[data-testid=\"ContentHeaderHed\"]", "ingredients_selector": ".ingredient"}'),
  ('bonappetit.com', 'Bon Appétit', true, '{"title_selector": "h1[data-testid=\"ContentHeaderHed\"]", "ingredients_selector": ".ingredient"}'),
  ('seriouseats.com', 'Serious Eats', true, '{"title_selector": "h1.heading__title", "ingredients_selector": ".structured-ingredients__list-item"}'),
  ('tasty.co', 'Tasty', true, '{"title_selector": "h1.recipe-name", "ingredients_selector": ".ingredient"}'),
  ('yummly.com', 'Yummly', true, '{"title_selector": "h1.recipe-title", "ingredients_selector": ".IngredientLine"}'),
  ('delish.com', 'Delish', true, '{"title_selector": "h1.content-hed", "ingredients_selector": ".ingredient-item"}'),
  ('eatingwell.com', 'EatingWell', true, '{"title_selector": "h1.headline", "ingredients_selector": ".mntl-structured-ingredients__list-item"}'),
  ('generic', 'Generic Parser', true, '{"title_selector": "h1, .recipe-title, [class*=\"title\"]", "ingredients_selector": ".ingredient, [class*=\"ingredient\"]"}')
ON CONFLICT (domain) DO NOTHING;

-- ============================================================================
-- CREATE PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_recipe_imports_user_id ON recipe_imports(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_imports_status ON recipe_imports(status);
CREATE INDEX IF NOT EXISTS idx_recipe_imports_source_domain ON recipe_imports(source_domain);
CREATE INDEX IF NOT EXISTS idx_recipe_imports_created_at ON recipe_imports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipe_imports_final_recipe ON recipe_imports(final_recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_import_sources_domain ON recipe_import_sources(domain);
CREATE INDEX IF NOT EXISTS idx_recipe_import_sources_supported ON recipe_import_sources(is_supported);
CREATE INDEX IF NOT EXISTS idx_recipe_import_analytics_date ON recipe_import_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_recipe_import_analytics_domain ON recipe_import_analytics(source_domain);
CREATE INDEX IF NOT EXISTS idx_recipe_import_queue_status ON recipe_import_queue(status);
CREATE INDEX IF NOT EXISTS idx_recipe_import_queue_priority ON recipe_import_queue(priority);
CREATE INDEX IF NOT EXISTS idx_recipe_import_queue_scheduled ON recipe_import_queue(scheduled_for);

-- ============================================================================
-- CREATE UPDATE TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_recipe_import_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_recipe_imports_updated_at
    BEFORE UPDATE ON recipe_imports
    FOR EACH ROW
    EXECUTE FUNCTION update_recipe_import_updated_at_column();

CREATE TRIGGER trigger_recipe_import_sources_updated_at
    BEFORE UPDATE ON recipe_import_sources
    FOR EACH ROW
    EXECUTE FUNCTION update_recipe_import_updated_at_column();

CREATE TRIGGER trigger_recipe_import_queue_updated_at
    BEFORE UPDATE ON recipe_import_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_recipe_import_updated_at_column();

-- ============================================================================
-- CREATE ANALYTICS UPDATE FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION update_import_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update daily analytics when import status changes to completed or failed
    IF NEW.status IN ('completed', 'failed') AND OLD.status != NEW.status THEN
        INSERT INTO recipe_import_analytics (
            date, source_domain, total_attempts, 
            successful_imports, failed_imports,
            average_processing_time_ms, total_ai_tokens_used
        ) VALUES (
            CURRENT_DATE, NEW.source_domain, 1,
            CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
            CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END,
            NEW.ai_processing_time_ms, COALESCE(NEW.ai_tokens_used, 0)
        )
        ON CONFLICT (date, source_domain) DO UPDATE SET
            total_attempts = recipe_import_analytics.total_attempts + 1,
            successful_imports = recipe_import_analytics.successful_imports + 
                CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
            failed_imports = recipe_import_analytics.failed_imports + 
                CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END,
            total_ai_tokens_used = recipe_import_analytics.total_ai_tokens_used + COALESCE(NEW.ai_tokens_used, 0);
        
        -- Update source success rate
        UPDATE recipe_import_sources SET
            total_imports = total_imports + 1,
            successful_imports = successful_imports + 
                CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
            success_rate = (successful_imports + CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END) * 100.0 / (total_imports + 1),
            last_successful_import = CASE WHEN NEW.status = 'completed' THEN NOW() ELSE last_successful_import END
        WHERE domain = NEW.source_domain;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_import_analytics
    AFTER UPDATE ON recipe_imports
    FOR EACH ROW
    EXECUTE FUNCTION update_import_analytics();

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE recipe_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_import_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_import_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_import_queue ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES
-- ============================================================================

-- Recipe Imports
CREATE POLICY "Users can view their own recipe imports" ON recipe_imports
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own recipe imports" ON recipe_imports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recipe imports" ON recipe_imports
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recipe imports" ON recipe_imports
    FOR DELETE USING (auth.uid() = user_id);

-- Recipe Import Sources (public read)
CREATE POLICY "Anyone can view recipe import sources" ON recipe_import_sources
    FOR SELECT USING (true);

-- Recipe Import Analytics (public read for aggregate data)
CREATE POLICY "Anyone can view recipe import analytics" ON recipe_import_analytics
    FOR SELECT USING (true);

-- Recipe Import Queue
CREATE POLICY "Users can view their own import queue items" ON recipe_import_queue
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own import queue items" ON recipe_import_queue
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own import queue items" ON recipe_import_queue
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own import queue items" ON recipe_import_queue
    FOR DELETE USING (auth.uid() = user_id);

-- Success message
SELECT 'Recipe Import Tracking Database Schema Created Successfully! 📥' as status;
