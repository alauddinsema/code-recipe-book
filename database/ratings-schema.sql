-- Recipe Rating and Review System Schema
-- This file contains the database schema for recipe ratings and reviews

-- Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure a user can only rate a recipe once
    UNIQUE(user_id, recipe_id)
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    rating_id UUID REFERENCES ratings(id) ON DELETE CASCADE,
    title VARCHAR(200),
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure a user can only review a recipe once
    UNIQUE(user_id, recipe_id)
);

-- Add rating statistics columns to recipes table
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_rating_points INTEGER DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_recipe_id ON ratings(recipe_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rating ON ratings(rating);
CREATE INDEX IF NOT EXISTS idx_ratings_created_at ON ratings(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_recipe_id ON reviews(recipe_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recipes_average_rating ON recipes(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_rating_count ON recipes(rating_count DESC);

-- Create function to update recipe rating statistics
CREATE OR REPLACE FUNCTION update_recipe_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
    recipe_uuid UUID;
    avg_rating DECIMAL(3,2);
    rating_cnt INTEGER;
    total_points INTEGER;
BEGIN
    -- Get the recipe_id from the affected row
    recipe_uuid := COALESCE(NEW.recipe_id, OLD.recipe_id);
    
    -- Calculate new statistics
    SELECT 
        COALESCE(AVG(rating), 0)::DECIMAL(3,2),
        COUNT(*),
        COALESCE(SUM(rating), 0)
    INTO avg_rating, rating_cnt, total_points
    FROM ratings 
    WHERE recipe_id = recipe_uuid;
    
    -- Update the recipes table
    UPDATE recipes 
    SET 
        average_rating = avg_rating,
        rating_count = rating_cnt,
        total_rating_points = total_points,
        updated_at = NOW()
    WHERE id = recipe_uuid;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update rating statistics
CREATE TRIGGER trigger_update_recipe_rating_stats_insert
    AFTER INSERT ON ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_recipe_rating_stats();

CREATE TRIGGER trigger_update_recipe_rating_stats_update
    AFTER UPDATE ON ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_recipe_rating_stats();

CREATE TRIGGER trigger_update_recipe_rating_stats_delete
    AFTER DELETE ON ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_recipe_rating_stats();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER trigger_ratings_updated_at
    BEFORE UPDATE ON ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on tables
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Ratings policies
CREATE POLICY "Anyone can view ratings" ON ratings
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own ratings" ON ratings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings" ON ratings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings" ON ratings
    FOR DELETE USING (auth.uid() = user_id);

-- Reviews policies
CREATE POLICY "Anyone can view reviews" ON reviews
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own reviews" ON reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON reviews
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON reviews
    FOR DELETE USING (auth.uid() = user_id);

-- Create views for easy querying

-- Recipe ratings summary view
CREATE OR REPLACE VIEW recipe_ratings_summary AS
SELECT 
    r.id as recipe_id,
    r.title as recipe_title,
    r.average_rating,
    r.rating_count,
    r.total_rating_points,
    CASE 
        WHEN r.rating_count >= 10 AND r.average_rating >= 4.0 THEN 'highly_rated'
        WHEN r.rating_count >= 5 AND r.average_rating >= 3.5 THEN 'well_rated'
        WHEN r.rating_count >= 1 THEN 'rated'
        ELSE 'unrated'
    END as rating_category
FROM recipes r;

-- User reviews with profile info
CREATE OR REPLACE VIEW user_reviews_with_profile AS
SELECT 
    rv.id,
    rv.recipe_id,
    rv.user_id,
    rv.title,
    rv.comment,
    rv.created_at,
    rv.updated_at,
    rt.rating,
    p.full_name as reviewer_name,
    p.avatar_url as reviewer_avatar
FROM reviews rv
LEFT JOIN ratings rt ON rv.rating_id = rt.id
LEFT JOIN profiles p ON rv.user_id = p.id;

-- Popular recipes view (based on ratings)
CREATE OR REPLACE VIEW popular_recipes AS
SELECT 
    r.*,
    CASE 
        WHEN r.rating_count = 0 THEN 0
        ELSE (r.average_rating * LOG(r.rating_count + 1))
    END as popularity_score
FROM recipes r
WHERE r.rating_count > 0
ORDER BY popularity_score DESC, r.average_rating DESC, r.rating_count DESC;

-- Grant necessary permissions
GRANT SELECT ON recipe_ratings_summary TO authenticated, anon;
GRANT SELECT ON user_reviews_with_profile TO authenticated, anon;
GRANT SELECT ON popular_recipes TO authenticated, anon;
GRANT ALL ON ratings TO authenticated;
GRANT ALL ON reviews TO authenticated;

-- Update existing recipes to have default rating values
UPDATE recipes 
SET 
    average_rating = 0,
    rating_count = 0,
    total_rating_points = 0
WHERE average_rating IS NULL OR rating_count IS NULL OR total_rating_points IS NULL;
