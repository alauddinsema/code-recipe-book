-- Favorites and Collections Schema
-- This file contains the database schema for user favorites and recipe collections

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure a user can only favorite a recipe once
    UNIQUE(user_id, recipe_id)
);

-- Create collections table
CREATE TABLE IF NOT EXISTS collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create collection_recipes junction table
CREATE TABLE IF NOT EXISTS collection_recipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure a recipe can only be added to a collection once
    UNIQUE(collection_id, recipe_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_recipe_id ON favorites(recipe_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON favorites(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_is_public ON collections(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_collections_created_at ON collections(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_collection_recipes_collection_id ON collection_recipes(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_recipes_recipe_id ON collection_recipes(recipe_id);
CREATE INDEX IF NOT EXISTS idx_collection_recipes_added_at ON collection_recipes(added_at DESC);

-- Create trigger to update collections.updated_at when collection_recipes are modified
CREATE OR REPLACE FUNCTION update_collection_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE collections 
    SET updated_at = NOW() 
    WHERE id = COALESCE(NEW.collection_id, OLD.collection_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_collection_updated_at
    AFTER INSERT OR UPDATE OR DELETE ON collection_recipes
    FOR EACH ROW
    EXECUTE FUNCTION update_collection_updated_at();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_recipes ENABLE ROW LEVEL SECURITY;

-- Favorites policies
CREATE POLICY "Users can view their own favorites" ON favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites" ON favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" ON favorites
    FOR DELETE USING (auth.uid() = user_id);

-- Collections policies
CREATE POLICY "Users can view their own collections" ON collections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public collections" ON collections
    FOR SELECT USING (is_public = TRUE);

CREATE POLICY "Users can insert their own collections" ON collections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections" ON collections
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections" ON collections
    FOR DELETE USING (auth.uid() = user_id);

-- Collection recipes policies
CREATE POLICY "Users can view collection recipes for their collections" ON collection_recipes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM collections 
            WHERE collections.id = collection_recipes.collection_id 
            AND collections.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view collection recipes for public collections" ON collection_recipes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM collections 
            WHERE collections.id = collection_recipes.collection_id 
            AND collections.is_public = TRUE
        )
    );

CREATE POLICY "Users can insert into their own collections" ON collection_recipes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM collections 
            WHERE collections.id = collection_recipes.collection_id 
            AND collections.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete from their own collections" ON collection_recipes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM collections 
            WHERE collections.id = collection_recipes.collection_id 
            AND collections.user_id = auth.uid()
        )
    );

-- Create a view for collection statistics
CREATE OR REPLACE VIEW collection_stats AS
SELECT 
    c.id,
    c.name,
    c.description,
    c.user_id,
    c.is_public,
    c.created_at,
    c.updated_at,
    COUNT(cr.recipe_id) as recipe_count,
    p.full_name as author_name
FROM collections c
LEFT JOIN collection_recipes cr ON c.id = cr.collection_id
LEFT JOIN profiles p ON c.user_id = p.id
GROUP BY c.id, c.name, c.description, c.user_id, c.is_public, c.created_at, c.updated_at, p.full_name;

-- Grant necessary permissions
GRANT SELECT ON collection_stats TO authenticated;
GRANT ALL ON favorites TO authenticated;
GRANT ALL ON collections TO authenticated;
GRANT ALL ON collection_recipes TO authenticated;
