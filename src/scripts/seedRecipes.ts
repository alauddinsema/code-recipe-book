/**
 * Recipe Database Seeder
 * Fetches recipes from TheMealDB API and seeds the Supabase database
 * Includes automatic code snippet generation for each recipe
 */

import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
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

interface MealDBRecipe {
  idMeal: string;
  strMeal: string;
  strDrinkAlternate?: string;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strMealThumb: string;
  strTags?: string;
  strYoutube?: string;
  [key: string]: any; // For dynamic ingredient/measure properties
}

interface CodeSnippetTemplate {
  language: string;
  template: string;
}

class RecipeSeeder {
  private readonly MEALDB_BASE_URL = 'https://www.themealdb.com/api/json/v1/1';
  private readonly BATCH_SIZE = 5;
  private readonly DELAY_MS = 1000; // Rate limiting

  // Code snippet templates for different recipe types
  private codeTemplates: Record<string, CodeSnippetTemplate[]> = {
    'Breakfast': [
      {
        language: 'python',
        template: `import time
import threading

def breakfast_timer(prep_time_minutes):
    """Perfect timing for breakfast preparation"""
    print(f"🍳 Starting breakfast prep - {prep_time_minutes} minutes")
    
    # Convert to seconds for precise timing
    total_seconds = prep_time_minutes * 60
    
    # Alert at 75% completion
    alert_time = int(total_seconds * 0.75)
    
    def alert():
        time.sleep(alert_time)
        print("⏰ Almost ready! Final touches needed.")
    
    # Start alert timer
    threading.Thread(target=alert).start()
    
    # Main timer
    time.sleep(total_seconds)
    print("✅ Breakfast is ready to serve!")

# Usage
breakfast_timer({{prep_time}})`
      },
      {
        language: 'javascript',
        template: `class BreakfastAssistant {
  constructor(recipeName) {
    this.recipe = recipeName;
    this.startTime = new Date();
  }

  calculateNutrition(servings) {
    // Estimated nutrition calculator
    const baseCalories = 350; // Average breakfast calories
    return {
      calories: baseCalories * servings,
      protein: Math.round(baseCalories * 0.15 / 4), // 15% protein
      carbs: Math.round(baseCalories * 0.55 / 4),   // 55% carbs
      fat: Math.round(baseCalories * 0.30 / 9)      // 30% fat
    };
  }

  setReminder(minutes) {
    setTimeout(() => {
      console.log(\`🔔 \${this.recipe} reminder: Check your food!\`);
    }, minutes * 60000);
  }
}

const breakfast = new BreakfastAssistant("{{recipe_name}}");
console.log(breakfast.calculateNutrition({{servings}}));`
      }
    ],
    'Dessert': [
      {
        language: 'python',
        template: `class DessertCalculator:
    def __init__(self, recipe_name, base_servings):
        self.recipe = recipe_name
        self.base_servings = base_servings
    
    def scale_ingredients(self, new_servings):
        """Scale dessert ingredients for different serving sizes"""
        ratio = new_servings / self.base_servings
        return {
            'scaling_factor': ratio,
            'new_servings': new_servings,
            'baking_time_adjustment': self.calculate_baking_adjustment(ratio)
        }
    
    def calculate_baking_adjustment(self, ratio):
        """Adjust baking time based on portion size"""
        if ratio > 1.5:
            return "Increase baking time by 10-15%"
        elif ratio < 0.7:
            return "Decrease baking time by 10-15%"
        return "No adjustment needed"
    
    def temperature_converter(self, fahrenheit):
        """Convert Fahrenheit to Celsius for international users"""
        celsius = (fahrenheit - 32) * 5/9
        return f"{fahrenheit}°F = {celsius:.0f}°C"

# Usage
dessert = DessertCalculator("{{recipe_name}}", {{servings}})
print(dessert.scale_ingredients(8))
print(dessert.temperature_converter(350))`
      }
    ],
    'Main Course': [
      {
        language: 'javascript',
        template: `class SmartCookingAssistant {
  constructor(dishName, cookingMethod) {
    this.dish = dishName;
    this.method = cookingMethod;
    this.startTime = null;
  }

  startCooking(totalMinutes) {
    this.startTime = new Date();
    console.log(\`🔥 Starting to cook \${this.dish}\`);
    
    // Set milestone alerts
    const milestones = [0.25, 0.5, 0.75, 1.0];
    
    milestones.forEach(milestone => {
      const alertTime = totalMinutes * milestone * 60000;
      setTimeout(() => {
        const percentage = Math.round(milestone * 100);
        console.log(\`📊 \${percentage}% complete - \${this.getStageMessage(milestone)}\`);
      }, alertTime);
    });
  }

  getStageMessage(milestone) {
    const messages = {
      0.25: "Initial cooking phase",
      0.5: "Halfway there! Check seasoning",
      0.75: "Almost done! Prepare sides",
      1.0: "🎉 Cooking complete!"
    };
    return messages[milestone] || "Keep cooking!";
  }

  calculateServingSize(originalServings, newServings) {
    const ratio = newServings / originalServings;
    return {
      ingredientMultiplier: ratio,
      cookingTimeAdjustment: ratio > 2 ? "Add 25% more time" : "Same cooking time"
    };
  }
}

const cooking = new SmartCookingAssistant("{{recipe_name}}", "{{cooking_method}}");
cooking.startCooking({{cook_time}});`
      }
    ]
  };

  /**
   * Fetch random recipes from TheMealDB
   */
  async fetchRecipesFromAPI(count: number = 20): Promise<MealDBRecipe[]> {
    const recipes: MealDBRecipe[] = [];
    
    console.log(`🔍 Fetching ${count} recipes from TheMealDB...`);
    
    for (let i = 0; i < count; i++) {
      try {
        const response = await axios.get(`${this.MEALDB_BASE_URL}/random.php`);
        const meal = response.data.meals[0];
        
        if (meal) {
          recipes.push(meal);
          console.log(`✅ Fetched: ${meal.strMeal}`);
        }
        
        // Rate limiting
        await this.delay(this.DELAY_MS);
      } catch (error) {
        console.error(`❌ Error fetching recipe ${i + 1}:`, error);
      }
    }
    
    return recipes;
  }

  /**
   * Convert MealDB recipe to our Recipe format
   */
  convertToRecipeFormat(meal: MealDBRecipe, authorId: string): any {
    // Extract ingredients and measurements
    const ingredients: string[] = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      
      if (ingredient && ingredient.trim()) {
        const fullIngredient = measure && measure.trim() 
          ? `${measure.trim()} ${ingredient.trim()}`
          : ingredient.trim();
        ingredients.push(fullIngredient);
      }
    }

    // Convert instructions to steps array
    const steps = meal.strInstructions
      .split(/\r?\n/)
      .filter(step => step.trim().length > 0)
      .map(step => step.trim());

    // Generate code snippet
    const codeSnippet = this.generateCodeSnippet(meal);

    // Extract tags
    const tags = meal.strTags 
      ? meal.strTags.split(',').map(tag => tag.trim().toLowerCase())
      : [meal.strCategory.toLowerCase(), meal.strArea.toLowerCase()];

    return {
      title: meal.strMeal,
      description: `Authentic ${meal.strArea} ${meal.strCategory.toLowerCase()} recipe with a modern tech twist.`,
      ingredients,
      steps,
      code_snippet: codeSnippet.code,
      language: codeSnippet.language,
      difficulty: this.determineDifficulty(steps.length, ingredients.length),
      category: meal.strCategory.toLowerCase(),
      prep_time: this.estimatePrepTime(ingredients.length),
      cook_time: this.estimateCookTime(meal.strInstructions),
      servings: 4, // Default serving size
      author_id: authorId,
      author_name: 'Jamshit (Recipe DB)',
      image_url: meal.strMealThumb,
      tags
    };
  }

  /**
   * Generate appropriate code snippet for recipe
   */
  generateCodeSnippet(meal: MealDBRecipe): { code: string; language: string } {
    const category = meal.strCategory;
    const templates = this.codeTemplates[category] || this.codeTemplates['Main Course'];
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // Replace placeholders in template
    let code = template.template
      .replace(/\{\{recipe_name\}\}/g, meal.strMeal)
      .replace(/\{\{servings\}\}/g, '4')
      .replace(/\{\{prep_time\}\}/g, this.estimatePrepTime(10).toString())
      .replace(/\{\{cook_time\}\}/g, this.estimateCookTime(meal.strInstructions).toString())
      .replace(/\{\{cooking_method\}\}/g, this.extractCookingMethod(meal.strInstructions));

    return {
      code,
      language: template.language
    };
  }

  /**
   * Determine recipe difficulty based on complexity
   */
  determineDifficulty(stepCount: number, ingredientCount: number): 'easy' | 'medium' | 'hard' {
    const complexity = stepCount + (ingredientCount * 0.5);
    
    if (complexity <= 8) return 'easy';
    if (complexity <= 15) return 'medium';
    return 'hard';
  }

  /**
   * Estimate preparation time based on ingredient count
   */
  estimatePrepTime(ingredientCount: number): number {
    return Math.max(10, ingredientCount * 2);
  }

  /**
   * Estimate cooking time from instructions
   */
  estimateCookTime(instructions: string): number {
    const timeMatches = instructions.match(/(\d+)\s*(minutes?|mins?|hours?|hrs?)/gi);
    
    if (timeMatches && timeMatches.length > 0) {
      // Extract the largest time mentioned
      let maxTime = 0;
      timeMatches.forEach(match => {
        const num = parseInt(match.match(/\d+/)?.[0] || '0');
        const unit = match.toLowerCase();
        
        if (unit.includes('hour') || unit.includes('hr')) {
          maxTime = Math.max(maxTime, num * 60);
        } else {
          maxTime = Math.max(maxTime, num);
        }
      });
      
      return maxTime || 30;
    }
    
    return 30; // Default 30 minutes
  }

  /**
   * Extract primary cooking method from instructions
   */
  extractCookingMethod(instructions: string): string {
    const methods = ['bake', 'fry', 'boil', 'grill', 'roast', 'steam', 'sauté'];
    const lowerInstructions = instructions.toLowerCase();
    
    for (const method of methods) {
      if (lowerInstructions.includes(method)) {
        return method;
      }
    }
    
    return 'cook';
  }

  /**
   * Seed recipes into Supabase database
   */
  async seedDatabase(recipeCount: number = 20): Promise<void> {
    try {
      console.log('🚀 Starting recipe database seeding...');
      
      // Use existing user for seeded recipes
      const systemUserId = '4639aad2-8543-4ed2-8b59-809cd2346ce5';
      
      // Fetch recipes from API
      const mealDbRecipes = await this.fetchRecipesFromAPI(recipeCount);
      
      if (mealDbRecipes.length === 0) {
        console.error('❌ No recipes fetched from API');
        return;
      }
      
      // Convert to our format
      const recipes = mealDbRecipes.map(meal => 
        this.convertToRecipeFormat(meal, systemUserId)
      );
      
      // Insert in batches
      console.log(`📝 Inserting ${recipes.length} recipes into database...`);
      
      for (let i = 0; i < recipes.length; i += this.BATCH_SIZE) {
        const batch = recipes.slice(i, i + this.BATCH_SIZE);
        
        const { error } = await supabase
          .from('recipes')
          .insert(batch)
          .select();
        
        if (error) {
          console.error(`❌ Error inserting batch ${i / this.BATCH_SIZE + 1}:`, error);
        } else {
          console.log(`✅ Inserted batch ${i / this.BATCH_SIZE + 1} (${batch.length} recipes)`);
        }
        
        // Small delay between batches
        await this.delay(500);
      }
      
      console.log('🎉 Recipe seeding completed successfully!');
      
    } catch (error) {
      console.error('❌ Error during recipe seeding:', error);
    }
  }

  /**
   * Update existing recipes with images
   */
  async updateExistingRecipesWithImages(): Promise<void> {
    try {
      console.log('🖼️ Updating existing recipes with images...');
      
      // Get existing recipes without images
      const { data: existingRecipes, error } = await supabase
        .from('recipes')
        .select('id, title, category')
        .is('image_url', null);
      
      if (error) {
        console.error('❌ Error fetching existing recipes:', error);
        return;
      }
      
      if (!existingRecipes || existingRecipes.length === 0) {
        console.log('✅ All recipes already have images');
        return;
      }
      
      console.log(`🔍 Found ${existingRecipes.length} recipes without images`);
      
      // Search for similar recipes on TheMealDB and add images
      for (const recipe of existingRecipes) {
        try {
          // Search by name
          const searchResponse = await axios.get(
            `${this.MEALDB_BASE_URL}/search.php?s=${encodeURIComponent(recipe.title)}`
          );
          
          if (searchResponse.data.meals && searchResponse.data.meals.length > 0) {
            const meal = searchResponse.data.meals[0];
            
            // Update recipe with image
            const { error: updateError } = await supabase
              .from('recipes')
              .update({ image_url: meal.strMealThumb })
              .eq('id', recipe.id);
            
            if (updateError) {
              console.error(`❌ Error updating recipe ${recipe.title}:`, updateError);
            } else {
              console.log(`✅ Updated ${recipe.title} with image`);
            }
          }
          
          await this.delay(this.DELAY_MS);
        } catch (error) {
          console.error(`❌ Error searching for ${recipe.title}:`, error);
        }
      }
      
      console.log('🎉 Image update completed!');
      
    } catch (error) {
      console.error('❌ Error updating recipes with images:', error);
    }
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export for use in scripts
export default RecipeSeeder;

// CLI usage
const seeder = new RecipeSeeder();

const args = process.argv.slice(2);
const command = args[0];
const count = parseInt(args[1]) || 10;

switch (command) {
  case 'seed':
    seeder.seedDatabase(count);
    break;
  case 'update-images':
    seeder.updateExistingRecipesWithImages();
    break;
  default:
    console.log(`
🍳 Recipe Seeder Commands:

npx tsx src/scripts/seedRecipes.ts seed [count]     - Seed database with new recipes (default: 10)
npx tsx src/scripts/seedRecipes.ts update-images    - Update existing recipes with images

Examples:
npx tsx src/scripts/seedRecipes.ts seed 20          - Add 20 new recipes
npx tsx src/scripts/seedRecipes.ts update-images    - Add images to existing recipes
    `);
}
