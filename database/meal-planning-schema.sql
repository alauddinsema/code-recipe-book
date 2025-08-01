-- Meal Planning Database Schema
-- Drag-and-drop meal planning calendar with automatic pantry checks and shopping list updates
-- Supports integrated workflow from meal planning to shopping

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- MEAL PLANS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'My Meal Plan',
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  plan_type TEXT CHECK (plan_type IN ('weekly', 'monthly', 'custom')) DEFAULT 'weekly',
  status TEXT CHECK (status IN ('draft', 'active', 'completed', 'archived')) DEFAULT 'draft',
  
  -- Meal planning preferences
  target_servings INTEGER DEFAULT 4,
  dietary_restrictions TEXT[],
  preferred_cuisines TEXT[],
  budget_target DECIMAL(10,2),
  prep_time_limit INTEGER, -- max prep time per meal in minutes
  
  -- Auto-generation settings
  auto_generate_shopping_list BOOLEAN DEFAULT true,
  auto_check_pantry BOOLEAN DEFAULT true,
  auto_suggest_recipes BOOLEAN DEFAULT true,
  
  -- Calculated fields
  total_recipes INTEGER DEFAULT 0,
  total_estimated_cost DECIMAL(10,2),
  total_prep_time INTEGER, -- total prep time for all meals
  pantry_coverage_percentage DECIMAL(5,2), -- % of ingredients already in pantry
  
  -- Shopping list integration
  generated_shopping_list_id UUID REFERENCES grocery_lists(id) ON DELETE SET NULL,
  shopping_list_generated_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- MEAL PLAN RECIPES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS meal_plan_recipes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE NOT NULL,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  
  -- Scheduling
  planned_date DATE NOT NULL,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'dessert')) NOT NULL,
  meal_order INTEGER DEFAULT 1, -- for multiple items in same meal
  
  -- Serving adjustments
  planned_servings INTEGER DEFAULT 4,
  serving_multiplier DECIMAL(3,2) DEFAULT 1.00, -- adjust recipe quantities
  
  -- Status tracking
  status TEXT CHECK (status IN ('planned', 'prepped', 'cooked', 'completed', 'skipped')) DEFAULT 'planned',
  prep_started_at TIMESTAMP WITH TIME ZONE,
  cooking_started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Pantry integration
  pantry_check_completed BOOLEAN DEFAULT false,
  missing_ingredients TEXT[],
  pantry_items_reserved UUID[], -- pantry items reserved for this meal
  
  -- User notes and modifications
  user_notes TEXT,
  recipe_modifications JSONB, -- track any changes to the recipe
  actual_prep_time INTEGER, -- actual time spent prepping
  actual_cook_time INTEGER, -- actual time spent cooking
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique recipe per meal per date
  UNIQUE(meal_plan_id, planned_date, meal_type, recipe_id)
);

-- ============================================================================
-- WEEKLY SCHEDULES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS weekly_schedules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE NOT NULL,
  week_start_date DATE NOT NULL, -- Monday of the week
  week_number INTEGER NOT NULL, -- week number in the meal plan
  
  -- Weekly summary
  total_meals INTEGER DEFAULT 0,
  total_recipes INTEGER DEFAULT 0,
  estimated_prep_time INTEGER DEFAULT 0,
  estimated_cost DECIMAL(10,2) DEFAULT 0.00,
  
  -- Weekly shopping
  shopping_list_id UUID REFERENCES grocery_lists(id) ON DELETE SET NULL,
  shopping_completed BOOLEAN DEFAULT false,
  shopping_completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Prep scheduling
  prep_day TEXT CHECK (prep_day IN ('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday')),
  prep_scheduled_time TIME,
  prep_completed BOOLEAN DEFAULT false,
  prep_completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Week status
  status TEXT CHECK (status IN ('planned', 'active', 'completed', 'skipped')) DEFAULT 'planned',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique week per meal plan
  UNIQUE(meal_plan_id, week_start_date)
);

-- ============================================================================
-- MEAL PLAN TEMPLATES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS meal_plan_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration_days INTEGER NOT NULL DEFAULT 7,
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  
  -- Template metadata
  cuisine_type TEXT,
  dietary_restrictions TEXT[],
  difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  estimated_cost_per_person DECIMAL(10,2),
  total_prep_time INTEGER,
  
  -- Template structure (JSON)
  template_structure JSONB, -- meal schedule structure
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- MEAL PLAN TEMPLATE RECIPES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS meal_plan_template_recipes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  template_id UUID REFERENCES meal_plan_templates(id) ON DELETE CASCADE NOT NULL,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  day_number INTEGER NOT NULL, -- 1-7 for weekly, 1-30 for monthly
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'dessert')) NOT NULL,
  meal_order INTEGER DEFAULT 1,
  recommended_servings INTEGER DEFAULT 4,
  is_optional BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique recipe per day/meal in template
  UNIQUE(template_id, day_number, meal_type, recipe_id)
);

-- ============================================================================
-- MEAL PLAN ANALYTICS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS meal_plan_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Planning metrics
  total_meal_plans INTEGER DEFAULT 0,
  active_meal_plans INTEGER DEFAULT 0,
  completed_meal_plans INTEGER DEFAULT 0,
  
  -- Recipe metrics
  total_planned_meals INTEGER DEFAULT 0,
  completed_meals INTEGER DEFAULT 0,
  skipped_meals INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0.00,
  
  -- Cost metrics
  planned_budget DECIMAL(10,2) DEFAULT 0.00,
  actual_spending DECIMAL(10,2) DEFAULT 0.00,
  budget_variance DECIMAL(10,2) DEFAULT 0.00,
  
  -- Time metrics
  planned_prep_time INTEGER DEFAULT 0, -- minutes
  actual_prep_time INTEGER DEFAULT 0, -- minutes
  time_variance INTEGER DEFAULT 0, -- minutes
  
  -- Pantry metrics
  pantry_usage_rate DECIMAL(5,2) DEFAULT 0.00, -- % of ingredients from pantry
  shopping_list_efficiency DECIMAL(5,2) DEFAULT 0.00, -- % of shopping list used
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint for daily analytics per user
  UNIQUE(user_id, date)
);

-- ============================================================================
-- CREATE PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_id ON meal_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_date_range ON meal_plans(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_meal_plans_status ON meal_plans(status);
CREATE INDEX IF NOT EXISTS idx_meal_plan_recipes_plan_id ON meal_plan_recipes(meal_plan_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_recipes_date ON meal_plan_recipes(planned_date);
CREATE INDEX IF NOT EXISTS idx_meal_plan_recipes_meal_type ON meal_plan_recipes(meal_type);
CREATE INDEX IF NOT EXISTS idx_meal_plan_recipes_status ON meal_plan_recipes(status);
CREATE INDEX IF NOT EXISTS idx_weekly_schedules_user_id ON weekly_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_schedules_week_start ON weekly_schedules(week_start_date);
CREATE INDEX IF NOT EXISTS idx_weekly_schedules_status ON weekly_schedules(status);
CREATE INDEX IF NOT EXISTS idx_meal_plan_templates_public ON meal_plan_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_meal_plan_templates_user ON meal_plan_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_analytics_user_date ON meal_plan_analytics(user_id, date DESC);

-- ============================================================================
-- CREATE UPDATE TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_meal_plan_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_meal_plans_updated_at
    BEFORE UPDATE ON meal_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_meal_plan_updated_at_column();

CREATE TRIGGER trigger_meal_plan_recipes_updated_at
    BEFORE UPDATE ON meal_plan_recipes
    FOR EACH ROW
    EXECUTE FUNCTION update_meal_plan_updated_at_column();

CREATE TRIGGER trigger_weekly_schedules_updated_at
    BEFORE UPDATE ON weekly_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_meal_plan_updated_at_column();

CREATE TRIGGER trigger_meal_plan_templates_updated_at
    BEFORE UPDATE ON meal_plan_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_meal_plan_updated_at_column();

-- ============================================================================
-- CREATE MEAL PLAN SUMMARY UPDATE FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION update_meal_plan_summary()
RETURNS TRIGGER AS $$
BEGIN
    -- Update meal plan totals when recipes are added/removed/updated
    UPDATE meal_plans SET
        total_recipes = (
            SELECT COUNT(*) FROM meal_plan_recipes 
            WHERE meal_plan_id = COALESCE(NEW.meal_plan_id, OLD.meal_plan_id)
        ),
        total_prep_time = (
            SELECT COALESCE(SUM(r.prep_time * mpr.serving_multiplier), 0)
            FROM meal_plan_recipes mpr
            JOIN recipes r ON r.id = mpr.recipe_id
            WHERE mpr.meal_plan_id = COALESCE(NEW.meal_plan_id, OLD.meal_plan_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.meal_plan_id, OLD.meal_plan_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_meal_plan_summary
    AFTER INSERT OR UPDATE OR DELETE ON meal_plan_recipes
    FOR EACH ROW
    EXECUTE FUNCTION update_meal_plan_summary();

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_template_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_analytics ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES
-- ============================================================================

-- Meal Plans
CREATE POLICY "Users can view their own meal plans" ON meal_plans
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own meal plans" ON meal_plans
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal plans" ON meal_plans
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal plans" ON meal_plans
    FOR DELETE USING (auth.uid() = user_id);

-- Meal Plan Recipes
CREATE POLICY "Users can view recipes in their meal plans" ON meal_plan_recipes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM meal_plans 
            WHERE meal_plans.id = meal_plan_recipes.meal_plan_id 
            AND meal_plans.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can add recipes to their meal plans" ON meal_plan_recipes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM meal_plans 
            WHERE meal_plans.id = meal_plan_recipes.meal_plan_id 
            AND meal_plans.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update recipes in their meal plans" ON meal_plan_recipes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM meal_plans 
            WHERE meal_plans.id = meal_plan_recipes.meal_plan_id 
            AND meal_plans.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can remove recipes from their meal plans" ON meal_plan_recipes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM meal_plans 
            WHERE meal_plans.id = meal_plan_recipes.meal_plan_id 
            AND meal_plans.user_id = auth.uid()
        )
    );

-- Weekly Schedules
CREATE POLICY "Users can view their own weekly schedules" ON weekly_schedules
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own weekly schedules" ON weekly_schedules
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly schedules" ON weekly_schedules
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weekly schedules" ON weekly_schedules
    FOR DELETE USING (auth.uid() = user_id);

-- Meal Plan Templates
CREATE POLICY "Anyone can view public meal plan templates" ON meal_plan_templates
    FOR SELECT USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Users can create their own meal plan templates" ON meal_plan_templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal plan templates" ON meal_plan_templates
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal plan templates" ON meal_plan_templates
    FOR DELETE USING (auth.uid() = user_id);

-- Meal Plan Template Recipes
CREATE POLICY "Users can view recipes in accessible templates" ON meal_plan_template_recipes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM meal_plan_templates 
            WHERE meal_plan_templates.id = meal_plan_template_recipes.template_id 
            AND (meal_plan_templates.is_public = true OR meal_plan_templates.user_id = auth.uid())
        )
    );

CREATE POLICY "Users can add recipes to their templates" ON meal_plan_template_recipes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM meal_plan_templates 
            WHERE meal_plan_templates.id = meal_plan_template_recipes.template_id 
            AND meal_plan_templates.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update recipes in their templates" ON meal_plan_template_recipes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM meal_plan_templates 
            WHERE meal_plan_templates.id = meal_plan_template_recipes.template_id 
            AND meal_plan_templates.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can remove recipes from their templates" ON meal_plan_template_recipes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM meal_plan_templates 
            WHERE meal_plan_templates.id = meal_plan_template_recipes.template_id 
            AND meal_plan_templates.user_id = auth.uid()
        )
    );

-- Meal Plan Analytics
CREATE POLICY "Users can view their own meal plan analytics" ON meal_plan_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own meal plan analytics" ON meal_plan_analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal plan analytics" ON meal_plan_analytics
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal plan analytics" ON meal_plan_analytics
    FOR DELETE USING (auth.uid() = user_id);

-- Success message
SELECT 'Meal Planning Database Schema Created Successfully! 📅' as status;
