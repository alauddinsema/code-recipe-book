/**
 * Quick script to update existing recipes with images and improve their data
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xjclhzrhfxqvwzwqmupi.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseKey) {
  console.error('❌ VITE_SUPABASE_ANON_KEY is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// High-quality food images from Unsplash (free to use)
const RECIPE_IMAGES = {
  'Smart Pancakes with Timer': 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=800&h=600&fit=crop',
  'API-Driven Coffee Recipe': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop',
  'Savory Meat & Onion Frittata with a Twist': 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&h=600&fit=crop',
  'Spicy Chorizo and Potato Frittata with Roasted Tomatoes': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&h=600&fit=crop'
};

// Fallback images by category
const CATEGORY_IMAGES = {
  'breakfast': 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&h=600&fit=crop',
  'beverage': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop',
  'main': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&h=600&fit=crop',
  'dessert': 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&h=600&fit=crop',
  'default': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop'
};

async function updateExistingRecipes() {
  try {
    console.log('🔄 Updating existing recipes with images and improved data...');
    
    // Get all existing recipes
    const { data: recipes, error } = await supabase
      .from('recipes')
      .select('*');
    
    if (error) {
      console.error('❌ Error fetching recipes:', error);
      return;
    }
    
    if (!recipes || recipes.length === 0) {
      console.log('📝 No recipes found in database');
      return;
    }
    
    console.log(`📋 Found ${recipes.length} recipes to update`);
    
    // Update each recipe
    for (const recipe of recipes) {
      try {
        const updates: any = {};
        
        // Add image if missing
        if (!recipe.image_url) {
          const imageUrl = RECIPE_IMAGES[recipe.title as keyof typeof RECIPE_IMAGES] 
            || CATEGORY_IMAGES[recipe.category as keyof typeof CATEGORY_IMAGES] 
            || CATEGORY_IMAGES.default;
          
          updates.image_url = imageUrl;
          console.log(`🖼️ Adding image to: ${recipe.title}`);
        }
        
        // Add missing categories
        if (!recipe.category) {
          if (recipe.title.toLowerCase().includes('pancake') || recipe.title.toLowerCase().includes('breakfast')) {
            updates.category = 'breakfast';
          } else if (recipe.title.toLowerCase().includes('coffee') || recipe.title.toLowerCase().includes('drink')) {
            updates.category = 'beverage';
          } else if (recipe.title.toLowerCase().includes('frittata') || recipe.title.toLowerCase().includes('main')) {
            updates.category = 'main';
          } else {
            updates.category = 'main';
          }
          console.log(`📂 Adding category "${updates.category}" to: ${recipe.title}`);
        }
        
        // Add missing tags
        if (!recipe.tags || recipe.tags.length === 0) {
          const tags = [];
          
          // Add category-based tags
          if (recipe.category === 'breakfast' || updates.category === 'breakfast') {
            tags.push('breakfast', 'morning', 'quick');
          } else if (recipe.category === 'beverage' || updates.category === 'beverage') {
            tags.push('drink', 'beverage', 'coffee');
          } else {
            tags.push('main-course', 'dinner', 'hearty');
          }
          
          // Add cooking method tags
          if (recipe.code_snippet?.includes('timer') || recipe.title.toLowerCase().includes('timer')) {
            tags.push('smart-cooking', 'automated');
          }
          
          if (recipe.language) {
            tags.push(`${recipe.language}-code`, 'programming');
          }
          
          updates.tags = tags;
          console.log(`🏷️ Adding tags to: ${recipe.title}`);
        }
        
        // Add missing prep/cook times
        if (!recipe.prep_time) {
          updates.prep_time = recipe.title.toLowerCase().includes('coffee') ? 5 : 15;
        }
        
        if (!recipe.cook_time) {
          if (recipe.title.toLowerCase().includes('pancake')) {
            updates.cook_time = 10;
          } else if (recipe.title.toLowerCase().includes('coffee')) {
            updates.cook_time = 5;
          } else if (recipe.title.toLowerCase().includes('frittata')) {
            updates.cook_time = 25;
          } else {
            updates.cook_time = 20;
          }
        }
        
        // Add missing servings
        if (!recipe.servings) {
          updates.servings = 4;
        }
        
        // Update rating fields if missing
        if (recipe.average_rating === null || recipe.average_rating === undefined) {
          updates.average_rating = 0;
        }
        if (recipe.rating_count === null || recipe.rating_count === undefined) {
          updates.rating_count = 0;
        }
        if (recipe.total_rating_points === null || recipe.total_rating_points === undefined) {
          updates.total_rating_points = 0;
        }
        
        // Apply updates if any
        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
            .from('recipes')
            .update(updates)
            .eq('id', recipe.id);
          
          if (updateError) {
            console.error(`❌ Error updating ${recipe.title}:`, updateError);
          } else {
            console.log(`✅ Updated: ${recipe.title}`);
          }
        } else {
          console.log(`⏭️ No updates needed for: ${recipe.title}`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${recipe.title}:`, error);
      }
    }
    
    console.log('🎉 Recipe updates completed!');
    
    // Show final summary
    const { data: updatedRecipes } = await supabase
      .from('recipes')
      .select('id, title, image_url, category, tags')
      .order('created_at', { ascending: false });
    
    console.log('\n📊 Updated Recipe Summary:');
    updatedRecipes?.forEach(recipe => {
      console.log(`• ${recipe.title}`);
      console.log(`  📂 Category: ${recipe.category || 'None'}`);
      console.log(`  🖼️ Image: ${recipe.image_url ? '✅' : '❌'}`);
      console.log(`  🏷️ Tags: ${recipe.tags?.length || 0} tags`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error updating recipes:', error);
  }
}

// Run the update
updateExistingRecipes();
