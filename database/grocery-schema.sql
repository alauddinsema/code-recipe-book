-- Grocery List Database Schema
-- CRITICAL FIX: Create missing grocery list tables that exist in TypeScript but not in database
-- This fixes the data persistence emergency identified in Phase 1 analysis

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create grocery categories table
CREATE TABLE IF NOT EXISTS grocery_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create grocery lists table
CREATE TABLE IF NOT EXISTS grocery_lists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipe_ids UUID[] DEFAULT '{}',
  total_estimated_price DECIMAL(10,2),
  is_shared BOOLEAN DEFAULT false,
  shared_with UUID[] DEFAULT '{}',
  status TEXT CHECK (status IN ('draft', 'active', 'shopping', 'completed', 'archived')) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create grocery items table
CREATE TABLE IF NOT EXISTS grocery_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  grocery_list_id UUID REFERENCES grocery_lists(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  quantity DECIMAL(10,3) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'piece',
  category_id TEXT REFERENCES grocery_categories(id) NOT NULL,
  estimated_price DECIMAL(10,2),
  is_checked BOOLEAN DEFAULT false,
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  recipe_title TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create grocery list templates table
CREATE TABLE IF NOT EXISTS grocery_list_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create grocery list template items table
CREATE TABLE IF NOT EXISTS grocery_list_template_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  template_id UUID REFERENCES grocery_list_templates(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  quantity DECIMAL(10,3) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'piece',
  category_id TEXT REFERENCES grocery_categories(id) NOT NULL,
  estimated_price DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shopping sessions table
CREATE TABLE IF NOT EXISTS shopping_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  grocery_list_id UUID REFERENCES grocery_lists(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  items_checked UUID[] DEFAULT '{}',
  total_spent DECIMAL(10,2),
  store_visited TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default grocery categories
INSERT INTO grocery_categories (id, name, icon, color, sort_order) VALUES
  ('produce', 'Produce', '🥬', '#10B981', 1),
  ('meat-seafood', 'Meat & Seafood', '🥩', '#EF4444', 2),
  ('dairy-eggs', 'Dairy & Eggs', '🥛', '#F59E0B', 3),
  ('pantry', 'Pantry', '🏺', '#8B5CF6', 4),
  ('grains-bread', 'Grains & Bread', '🍞', '#D97706', 5),
  ('frozen', 'Frozen', '🧊', '#06B6D4', 6),
  ('beverages', 'Beverages', '🥤', '#3B82F6', 7),
  ('snacks', 'Snacks', '🍿', '#F97316', 8),
  ('condiments', 'Condiments', '🍯', '#84CC16', 9),
  ('spices-herbs', 'Spices & Herbs', '🌿', '#22C55E', 10),
  ('baking', 'Baking', '🧁', '#EC4899', 11),
  ('household', 'Household', '🧽', '#6B7280', 12),
  ('other', 'Other', '📦', '#9CA3AF', 13)
ON CONFLICT (id) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_grocery_lists_user_id ON grocery_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_grocery_lists_status ON grocery_lists(status);
CREATE INDEX IF NOT EXISTS idx_grocery_lists_created_at ON grocery_lists(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_grocery_items_list_id ON grocery_items(grocery_list_id);
CREATE INDEX IF NOT EXISTS idx_grocery_items_category ON grocery_items(category_id);
CREATE INDEX IF NOT EXISTS idx_grocery_items_recipe_id ON grocery_items(recipe_id);
CREATE INDEX IF NOT EXISTS idx_grocery_items_checked ON grocery_items(is_checked);
CREATE INDEX IF NOT EXISTS idx_grocery_templates_public ON grocery_list_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_grocery_templates_created_by ON grocery_list_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_shopping_sessions_list_id ON shopping_sessions(grocery_list_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_grocery_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER trigger_grocery_lists_updated_at
    BEFORE UPDATE ON grocery_lists
    FOR EACH ROW
    EXECUTE FUNCTION update_grocery_updated_at_column();

CREATE TRIGGER trigger_grocery_items_updated_at
    BEFORE UPDATE ON grocery_items
    FOR EACH ROW
    EXECUTE FUNCTION update_grocery_updated_at_column();

CREATE TRIGGER trigger_grocery_templates_updated_at
    BEFORE UPDATE ON grocery_list_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_grocery_updated_at_column();

CREATE TRIGGER trigger_shopping_sessions_updated_at
    BEFORE UPDATE ON shopping_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_grocery_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE grocery_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_list_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_list_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for grocery_categories (public read)
CREATE POLICY "Anyone can view grocery categories" ON grocery_categories
    FOR SELECT USING (true);

-- RLS Policies for grocery_lists
CREATE POLICY "Users can view their own grocery lists" ON grocery_lists
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = ANY(shared_with));

CREATE POLICY "Users can create their own grocery lists" ON grocery_lists
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own grocery lists" ON grocery_lists
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own grocery lists" ON grocery_lists
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for grocery_items
CREATE POLICY "Users can view grocery items from their lists" ON grocery_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM grocery_lists 
            WHERE grocery_lists.id = grocery_items.grocery_list_id 
            AND (grocery_lists.user_id = auth.uid() OR auth.uid() = ANY(grocery_lists.shared_with))
        )
    );

CREATE POLICY "Users can create grocery items in their lists" ON grocery_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM grocery_lists 
            WHERE grocery_lists.id = grocery_items.grocery_list_id 
            AND grocery_lists.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update grocery items in their lists" ON grocery_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM grocery_lists 
            WHERE grocery_lists.id = grocery_items.grocery_list_id 
            AND grocery_lists.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete grocery items from their lists" ON grocery_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM grocery_lists 
            WHERE grocery_lists.id = grocery_items.grocery_list_id 
            AND grocery_lists.user_id = auth.uid()
        )
    );

-- RLS Policies for grocery_list_templates
CREATE POLICY "Anyone can view public templates" ON grocery_list_templates
    FOR SELECT USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create their own templates" ON grocery_list_templates
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own templates" ON grocery_list_templates
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own templates" ON grocery_list_templates
    FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for grocery_list_template_items
CREATE POLICY "Users can view template items from accessible templates" ON grocery_list_template_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM grocery_list_templates 
            WHERE grocery_list_templates.id = grocery_list_template_items.template_id 
            AND (grocery_list_templates.is_public = true OR grocery_list_templates.created_by = auth.uid())
        )
    );

CREATE POLICY "Users can create template items in their templates" ON grocery_list_template_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM grocery_list_templates 
            WHERE grocery_list_templates.id = grocery_list_template_items.template_id 
            AND grocery_list_templates.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update template items in their templates" ON grocery_list_template_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM grocery_list_templates 
            WHERE grocery_list_templates.id = grocery_list_template_items.template_id 
            AND grocery_list_templates.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete template items from their templates" ON grocery_list_template_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM grocery_list_templates 
            WHERE grocery_list_templates.id = grocery_list_template_items.template_id 
            AND grocery_list_templates.created_by = auth.uid()
        )
    );

-- RLS Policies for shopping_sessions
CREATE POLICY "Users can view shopping sessions from their lists" ON shopping_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM grocery_lists 
            WHERE grocery_lists.id = shopping_sessions.grocery_list_id 
            AND grocery_lists.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create shopping sessions for their lists" ON shopping_sessions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM grocery_lists 
            WHERE grocery_lists.id = shopping_sessions.grocery_list_id 
            AND grocery_lists.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update shopping sessions for their lists" ON shopping_sessions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM grocery_lists 
            WHERE grocery_lists.id = shopping_sessions.grocery_list_id 
            AND grocery_lists.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete shopping sessions from their lists" ON shopping_sessions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM grocery_lists 
            WHERE grocery_lists.id = shopping_sessions.grocery_list_id 
            AND grocery_lists.user_id = auth.uid()
        )
    );

-- Success message
SELECT 'Grocery List Database Schema Created Successfully! 🎉' as status;
