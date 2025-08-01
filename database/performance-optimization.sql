-- Database Performance Optimization
-- Optimized indexes for PantryAI query patterns and performance requirements
-- Includes composite indexes, partial indexes, and query optimization

-- ============================================================================
-- COMPOSITE INDEXES FOR COMMON QUERY PATTERNS
-- ============================================================================

-- Recipe search and filtering (most common queries)
CREATE INDEX IF NOT EXISTS idx_recipes_user_category_difficulty ON recipes(user_id, category, difficulty);
CREATE INDEX IF NOT EXISTS idx_recipes_user_created_desc ON recipes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_public_rating ON recipes(is_public, average_rating DESC) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_recipes_prep_cook_time ON recipes(prep_time, cook_time) WHERE prep_time IS NOT NULL AND cook_time IS NOT NULL;

-- Pantry management queries
CREATE INDEX IF NOT EXISTS idx_pantry_items_user_category_location ON pantry_items(user_id, category_id, storage_location);
CREATE INDEX IF NOT EXISTS idx_pantry_items_user_expiration ON pantry_items(user_id, expiration_date) WHERE expiration_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pantry_items_user_low_stock ON pantry_items(user_id, is_running_low) WHERE is_running_low = true;
CREATE INDEX IF NOT EXISTS idx_pantry_items_user_quantity ON pantry_items(user_id, quantity) WHERE quantity > 0;

-- Grocery list optimization
CREATE INDEX IF NOT EXISTS idx_grocery_lists_user_status ON grocery_lists(user_id, status);
CREATE INDEX IF NOT EXISTS idx_grocery_items_list_category ON grocery_items(grocery_list_id, category_id);
CREATE INDEX IF NOT EXISTS idx_grocery_items_list_purchased ON grocery_items(grocery_list_id, is_purchased);

-- Meal planning queries
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_date_range ON meal_plans(user_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_meal_plan_recipes_plan_date_meal ON meal_plan_recipes(meal_plan_id, planned_date, meal_type);
CREATE INDEX IF NOT EXISTS idx_meal_plan_recipes_user_status ON meal_plan_recipes(meal_plan_id, status) 
    WHERE status IN ('planned', 'prepped', 'cooked');

-- Recipe import tracking
CREATE INDEX IF NOT EXISTS idx_recipe_imports_user_status_created ON recipe_imports(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipe_imports_domain_status ON recipe_imports(source_domain, status);

-- Expiration tracking (critical for notifications)
CREATE INDEX IF NOT EXISTS idx_expiration_tracking_user_date_status ON expiration_tracking(user_id, expiration_date, status);
CREATE INDEX IF NOT EXISTS idx_expiration_tracking_notification_pending ON expiration_tracking(user_id, notification_sent, expiration_date) 
    WHERE notification_sent = false;

-- ============================================================================
-- PARTIAL INDEXES FOR SPECIFIC CONDITIONS
-- ============================================================================

-- Active/current data only
CREATE INDEX IF NOT EXISTS idx_meal_plans_active ON meal_plans(user_id, start_date) 
    WHERE status IN ('draft', 'active');

CREATE INDEX IF NOT EXISTS idx_grocery_lists_active ON grocery_lists(user_id, created_at DESC) 
    WHERE status IN ('draft', 'active');

CREATE INDEX IF NOT EXISTS idx_pantry_items_available ON pantry_items(user_id, category_id) 
    WHERE quantity > 0;

-- Expired items for cleanup
CREATE INDEX IF NOT EXISTS idx_pantry_items_expired ON pantry_items(user_id, expiration_date) 
    WHERE expiration_date < CURRENT_DATE;

-- Failed imports for retry
CREATE INDEX IF NOT EXISTS idx_recipe_imports_failed ON recipe_imports(user_id, created_at DESC) 
    WHERE status = 'failed' AND retry_count < max_retries;

-- ============================================================================
-- FULL-TEXT SEARCH INDEXES
-- ============================================================================

-- Recipe full-text search
CREATE INDEX IF NOT EXISTS idx_recipes_search_vector ON recipes USING GIN(search_vector);

-- Ingredient search optimization
CREATE INDEX IF NOT EXISTS idx_ingredient_master_search_vector ON ingredient_master USING GIN(search_vector);

-- Recipe ingredient search (for "What Can I Make?" feature)
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_search ON recipe_ingredients USING GIN(to_tsvector('english', ingredient_name));

-- ============================================================================
-- FOREIGN KEY OPTIMIZATION
-- ============================================================================

-- Ensure all foreign key columns have indexes for join performance
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_instructions_recipe_id ON recipe_instructions(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_favorites_recipe_id ON recipe_favorites(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_favorites_user_id ON recipe_favorites(user_id);

-- Pantry relationships
CREATE INDEX IF NOT EXISTS idx_expiration_tracking_pantry_item ON expiration_tracking(pantry_item_id);
CREATE INDEX IF NOT EXISTS idx_pantry_usage_history_pantry_item ON pantry_usage_history(pantry_item_id);
CREATE INDEX IF NOT EXISTS idx_pantry_usage_history_recipe ON pantry_usage_history(recipe_id);

-- Grocery list relationships
CREATE INDEX IF NOT EXISTS idx_grocery_items_grocery_list ON grocery_items(grocery_list_id);
CREATE INDEX IF NOT EXISTS idx_grocery_list_template_items_template ON grocery_list_template_items(template_id);

-- Meal planning relationships
CREATE INDEX IF NOT EXISTS idx_weekly_schedules_meal_plan ON weekly_schedules(meal_plan_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_template_recipes_template ON meal_plan_template_recipes(template_id);

-- ============================================================================
-- ANALYTICS AND REPORTING INDEXES
-- ============================================================================

-- User activity analytics
CREATE INDEX IF NOT EXISTS idx_recipes_user_created_month ON recipes(user_id, date_trunc('month', created_at));
CREATE INDEX IF NOT EXISTS idx_pantry_items_user_created_month ON pantry_items(user_id, date_trunc('month', created_at));
CREATE INDEX IF NOT EXISTS idx_grocery_lists_user_created_month ON grocery_lists(user_id, date_trunc('month', created_at));

-- Cost tracking
CREATE INDEX IF NOT EXISTS idx_pantry_items_user_cost ON pantry_items(user_id, purchase_price) WHERE purchase_price IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_grocery_items_cost ON grocery_items(grocery_list_id, estimated_price) WHERE estimated_price IS NOT NULL;

-- Usage patterns
CREATE INDEX IF NOT EXISTS idx_ingredient_master_usage_desc ON ingredient_master(usage_count DESC, last_used_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipe_favorites_count ON recipe_favorites(recipe_id);

-- ============================================================================
-- COVERING INDEXES FOR COMMON QUERIES
-- ============================================================================

-- Recipe list with basic info (avoid table lookups)
CREATE INDEX IF NOT EXISTS idx_recipes_list_covering ON recipes(user_id, created_at DESC) 
    INCLUDE (title, description, prep_time, cook_time, servings, difficulty, image_url);

-- Pantry items with essential info
CREATE INDEX IF NOT EXISTS idx_pantry_items_covering ON pantry_items(user_id, category_id) 
    INCLUDE (name, quantity, unit, expiration_date, is_running_low);

-- Grocery list items with details
CREATE INDEX IF NOT EXISTS idx_grocery_items_covering ON grocery_items(grocery_list_id, category_id) 
    INCLUDE (name, quantity, unit, is_purchased, estimated_price);

-- ============================================================================
-- QUERY OPTIMIZATION FUNCTIONS
-- ============================================================================

-- Function to find recipes by available ingredients
CREATE OR REPLACE FUNCTION find_recipes_by_ingredients(
    p_user_id UUID,
    p_ingredient_names TEXT[],
    p_match_threshold DECIMAL DEFAULT 0.7
)
RETURNS TABLE (
    recipe_id UUID,
    recipe_title TEXT,
    match_percentage DECIMAL,
    missing_ingredients TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    WITH user_ingredients AS (
        SELECT DISTINCT lower(trim(unnest(p_ingredient_names))) as ingredient
    ),
    recipe_matches AS (
        SELECT 
            r.id,
            r.title,
            COUNT(ri.id) as total_ingredients,
            COUNT(CASE WHEN ui.ingredient IS NOT NULL THEN 1 END) as matched_ingredients,
            array_agg(
                CASE WHEN ui.ingredient IS NULL THEN ri.ingredient_name END
            ) FILTER (WHERE ui.ingredient IS NULL) as missing
        FROM recipes r
        JOIN recipe_ingredients ri ON r.id = ri.recipe_id
        LEFT JOIN user_ingredients ui ON lower(trim(ri.ingredient_name)) = ui.ingredient
        WHERE r.user_id = p_user_id OR r.is_public = true
        GROUP BY r.id, r.title
    )
    SELECT 
        rm.id,
        rm.title,
        (rm.matched_ingredients::DECIMAL / rm.total_ingredients) as match_pct,
        rm.missing
    FROM recipe_matches rm
    WHERE (rm.matched_ingredients::DECIMAL / rm.total_ingredients) >= p_match_threshold
    ORDER BY match_pct DESC, rm.title;
END;
$$ LANGUAGE plpgsql;

-- Function to get expiring items with notifications
CREATE OR REPLACE FUNCTION get_expiring_items(
    p_user_id UUID,
    p_days_ahead INTEGER DEFAULT 7
)
RETURNS TABLE (
    item_id UUID,
    item_name TEXT,
    expiration_date DATE,
    days_until_expiry INTEGER,
    storage_location TEXT,
    quantity DECIMAL,
    unit TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pi.id,
        pi.name,
        pi.expiration_date,
        (pi.expiration_date - CURRENT_DATE)::INTEGER,
        pi.storage_location,
        pi.quantity,
        pi.unit
    FROM pantry_items pi
    WHERE pi.user_id = p_user_id
        AND pi.expiration_date IS NOT NULL
        AND pi.expiration_date <= CURRENT_DATE + p_days_ahead
        AND pi.quantity > 0
    ORDER BY pi.expiration_date ASC, pi.name;
END;
$$ LANGUAGE plpgsql;

-- Function to optimize grocery list by store layout
CREATE OR REPLACE FUNCTION optimize_grocery_list_by_category(
    p_grocery_list_id UUID
)
RETURNS TABLE (
    category_name TEXT,
    category_color TEXT,
    items JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gc.name,
        gc.color,
        jsonb_agg(
            jsonb_build_object(
                'id', gi.id,
                'name', gi.name,
                'quantity', gi.quantity,
                'unit', gi.unit,
                'is_purchased', gi.is_purchased,
                'estimated_price', gi.estimated_price
            ) ORDER BY gi.name
        ) as items
    FROM grocery_items gi
    JOIN grocery_categories gc ON gi.category_id = gc.id
    WHERE gi.grocery_list_id = p_grocery_list_id
    GROUP BY gc.id, gc.name, gc.color, gc.sort_order
    ORDER BY gc.sort_order;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MAINTENANCE AND CLEANUP FUNCTIONS
-- ============================================================================

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Clean up ingredient recognition cache
    DELETE FROM ingredient_recognition_cache 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Clean up old analytics data (keep 2 years)
    DELETE FROM recipe_import_analytics 
    WHERE date < CURRENT_DATE - INTERVAL '2 years';
    
    DELETE FROM meal_plan_analytics 
    WHERE date < CURRENT_DATE - INTERVAL '2 years';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update search vectors for all recipes
CREATE OR REPLACE FUNCTION refresh_recipe_search_vectors()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE recipes SET search_vector = to_tsvector('english', 
        COALESCE(title, '') || ' ' ||
        COALESCE(description, '') || ' ' ||
        COALESCE(category, '') || ' ' ||
        COALESCE(array_to_string(tags, ' '), '')
    );
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PERFORMANCE MONITORING VIEWS
-- ============================================================================

-- View for monitoring slow queries and index usage
CREATE OR REPLACE VIEW performance_summary AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan,
    CASE 
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_tup_read = 0 THEN 'NEVER_READ'
        ELSE 'ACTIVE'
    END as index_status
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- View for table size monitoring
CREATE OR REPLACE VIEW table_sizes AS
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================================================
-- VACUUM AND ANALYZE RECOMMENDATIONS
-- ============================================================================

-- Create function to auto-vacuum high-activity tables
CREATE OR REPLACE FUNCTION auto_maintenance()
RETURNS TEXT AS $$
BEGIN
    -- Analyze frequently updated tables
    ANALYZE recipes;
    ANALYZE pantry_items;
    ANALYZE grocery_lists;
    ANALYZE grocery_items;
    ANALYZE meal_plans;
    ANALYZE meal_plan_recipes;
    ANALYZE recipe_imports;
    
    -- Clean up expired cache
    PERFORM cleanup_expired_cache();
    
    RETURN 'Database maintenance completed successfully';
END;
$$ LANGUAGE plpgsql;

-- Success message
SELECT 'Database Performance Optimization Completed Successfully! ⚡' as status,
       'Added ' || count(*) || ' performance indexes and optimization functions' as details
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%';
