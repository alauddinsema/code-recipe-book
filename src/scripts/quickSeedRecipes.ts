/**
 * Quick Recipe Seeder - Bypasses RLS by using direct SQL inserts
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

// Removed unused MealDBRecipe interface

// Sample recipes with code snippets
const SAMPLE_RECIPES = [
  {
    title: "Smart Chocolate Chip Cookies",
    description: "Classic cookies with temperature monitoring code for perfect baking",
    ingredients: ["2 cups all-purpose flour", "1 tsp baking soda", "1 tsp salt", "1 cup butter", "3/4 cup granulated sugar", "3/4 cup brown sugar", "2 large eggs", "2 tsp vanilla", "2 cups chocolate chips"],
    steps: ["Preheat oven to 375°F", "Mix dry ingredients", "Cream butter and sugars", "Add eggs and vanilla", "Combine wet and dry ingredients", "Fold in chocolate chips", "Drop on baking sheet", "Bake 9-11 minutes"],
    code_snippet: `// Smart oven temperature monitor
class SmartBaking {
  constructor(targetTemp = 375) {
    this.targetTemp = targetTemp;
    this.currentTemp = 0;
  }

  monitorTemperature() {
    setInterval(() => {
      // Simulate temperature reading
      this.currentTemp = this.targetTemp + (Math.random() - 0.5) * 10;
      
      if (Math.abs(this.currentTemp - this.targetTemp) > 15) {
        console.log(\`⚠️ Temperature alert: \${this.currentTemp}°F (target: \${this.targetTemp}°F)\`);
      }
    }, 30000); // Check every 30 seconds
  }

  setBakeTimer(minutes) {
    console.log(\`🍪 Cookies baking for \${minutes} minutes\`);
    setTimeout(() => {
      console.log('🔔 Cookies are ready!');
    }, minutes * 60000);
  }
}

const baking = new SmartBaking(375);
baking.monitorTemperature();
baking.setBakeTimer(10);`,
    language: "javascript",
    category: "dessert",
    difficulty: "easy",
    prep_time: 15,
    cook_time: 10,
    servings: 24,
    image_url: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800&h=600&fit=crop",
    tags: ["cookies", "dessert", "baking", "smart-cooking"]
  },
  {
    title: "Automated Pasta Timer",
    description: "Perfect al dente pasta with Python timing automation",
    ingredients: ["1 lb pasta", "Salt", "Water", "Olive oil"],
    steps: ["Boil large pot of salted water", "Add pasta", "Cook according to package directions", "Test for doneness", "Drain and serve"],
    code_snippet: `import time
import threading
from datetime import datetime

class PastaTimer:
    def __init__(self, pasta_type="spaghetti"):
        self.pasta_type = pasta_type
        self.cook_times = {
            "spaghetti": 8,
            "penne": 10,
            "fusilli": 12,
            "linguine": 9
        }
    
    def start_cooking(self):
        cook_time = self.cook_times.get(self.pasta_type, 10)
        print(f"🍝 Starting {self.pasta_type} - cooking for {cook_time} minutes")
        
        # Alert at 75% completion
        alert_time = int(cook_time * 0.75 * 60)
        threading.Timer(alert_time, self.almost_ready_alert).start()
        
        # Final alert
        threading.Timer(cook_time * 60, self.pasta_ready_alert).start()
    
    def almost_ready_alert(self):
        print("⏰ Pasta is almost ready! Start preparing sauce.")
    
    def pasta_ready_alert(self):
        print("✅ Pasta is ready! Time to drain and serve.")

# Usage
pasta = PastaTimer("spaghetti")
pasta.start_cooking()`,
    language: "python",
    category: "main",
    difficulty: "easy",
    prep_time: 5,
    cook_time: 10,
    servings: 4,
    image_url: "https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=800&h=600&fit=crop",
    tags: ["pasta", "main-course", "automated", "timing"]
  },
  {
    title: "IoT Slow Cooker Stew",
    description: "Hearty beef stew with IoT monitoring and control",
    ingredients: ["2 lbs beef chuck", "4 carrots", "3 potatoes", "1 onion", "2 cups beef broth", "2 tbsp tomato paste", "Salt and pepper", "Herbs"],
    steps: ["Brown beef in slow cooker", "Add vegetables", "Mix in broth and seasonings", "Cook on low 8 hours", "Serve hot"],
    code_snippet: `// IoT Slow Cooker Controller
class IoTSlowCooker {
  constructor(deviceId) {
    this.deviceId = deviceId;
    this.temperature = 200; // Low setting
    this.cookTime = 0;
    this.isRunning = false;
  }

  async startCooking(hours = 8) {
    console.log(\`🥘 Starting slow cooker for \${hours} hours\`);
    this.isRunning = true;
    
    // Send command to IoT device
    await this.sendCommand('START', { 
      temperature: this.temperature,
      duration: hours * 60 
    });
    
    // Monitor cooking progress
    this.monitorCooking(hours);
  }

  async sendCommand(action, params) {
    // Simulate IoT API call
    const payload = {
      deviceId: this.deviceId,
      action: action,
      parameters: params,
      timestamp: new Date().toISOString()
    };
    
    console.log('📡 Sending to IoT device:', payload);
    // In real implementation: await fetch('/api/iot/slowcooker', {...})
  }

  monitorCooking(totalHours) {
    const checkInterval = setInterval(() => {
      this.cookTime += 0.5;
      const remaining = totalHours - this.cookTime;
      
      if (remaining <= 0) {
        console.log('🔔 Stew is ready!');
        this.sendCommand('STOP');
        clearInterval(checkInterval);
      } else if (remaining <= 1) {
        console.log(\`⏰ \${remaining} hour remaining\`);
      }
    }, 30 * 60 * 1000); // Check every 30 minutes
  }
}

const slowCooker = new IoTSlowCooker('kitchen-slowcooker-01');
slowCooker.startCooking(8);`,
    language: "javascript",
    category: "main",
    difficulty: "medium",
    prep_time: 20,
    cook_time: 480,
    servings: 6,
    image_url: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&h=600&fit=crop",
    tags: ["stew", "slow-cooker", "iot", "beef", "comfort-food"]
  },
  {
    title: "Machine Learning Smoothie",
    description: "Nutritionally optimized smoothie with ML-powered ingredient balancing",
    ingredients: ["1 banana", "1 cup spinach", "1/2 cup blueberries", "1 cup almond milk", "1 tbsp chia seeds", "1 tsp honey"],
    steps: ["Add liquid to blender first", "Add soft fruits", "Add greens", "Add frozen fruits", "Blend until smooth", "Adjust consistency"],
    code_snippet: `import numpy as np
from sklearn.linear_model import LinearRegression

class SmoothieOptimizer:
    def __init__(self):
        # Nutritional data per 100g
        self.ingredients = {
            'banana': {'calories': 89, 'protein': 1.1, 'carbs': 23, 'fiber': 2.6},
            'spinach': {'calories': 23, 'protein': 2.9, 'carbs': 3.6, 'fiber': 2.2},
            'blueberries': {'calories': 57, 'protein': 0.7, 'carbs': 14, 'fiber': 2.4},
            'almond_milk': {'calories': 17, 'protein': 0.6, 'carbs': 0.6, 'fiber': 0.3},
            'chia_seeds': {'calories': 486, 'protein': 17, 'carbs': 42, 'fiber': 34}
        }
        
    def optimize_nutrition(self, target_calories=300, target_protein=15):
        \"\"\"Use ML to optimize ingredient ratios for nutrition goals\"\"\"
        
        # Create training data from various combinations
        X = []  # ingredient ratios
        y = []  # nutritional outcomes
        
        # Generate sample combinations
        for _ in range(1000):
            ratios = np.random.dirichlet(np.ones(5))  # Random ratios that sum to 1
            nutrition = self.calculate_nutrition(ratios)
            X.append(ratios)
            y.append([nutrition['calories'], nutrition['protein']])
        
        # Train model
        model = LinearRegression()
        model.fit(X, y)
        
        # Find optimal ratios
        best_ratios = self.find_optimal_ratios(model, target_calories, target_protein)
        return self.ratios_to_recipe(best_ratios)
    
    def calculate_nutrition(self, ratios):
        total_nutrition = {'calories': 0, 'protein': 0, 'carbs': 0, 'fiber': 0}
        ingredients = list(self.ingredients.keys())
        
        for i, ratio in enumerate(ratios):
            ingredient = ingredients[i]
            for nutrient in total_nutrition:
                total_nutrition[nutrient] += ratio * 100 * self.ingredients[ingredient][nutrient]
        
        return total_nutrition
    
    def ratios_to_recipe(self, ratios):
        ingredients = ['banana', 'spinach', 'blueberries', 'almond_milk', 'chia_seeds']
        base_amounts = [100, 30, 80, 250, 15]  # Base amounts in grams/ml
        
        recipe = {}
        for i, ingredient in enumerate(ingredients):
            recipe[ingredient] = f"{ratios[i] * base_amounts[i]:.0f}g"
        
        return recipe

# Usage
optimizer = SmoothieOptimizer()
optimal_recipe = optimizer.optimize_nutrition(target_calories=350, target_protein=20)
print("🥤 Optimized smoothie recipe:", optimal_recipe)`,
    language: "python",
    category: "beverage",
    difficulty: "hard",
    prep_time: 10,
    cook_time: 0,
    servings: 1,
    image_url: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&h=600&fit=crop",
    tags: ["smoothie", "healthy", "machine-learning", "nutrition", "optimization"]
  }
];

async function seedSampleRecipes() {
  try {
    console.log('🌱 Seeding sample recipes with code snippets...');
    
    const userId = '4639aad2-8543-4ed2-8b59-809cd2346ce5';
    const authorName = 'Jamshit (Recipe DB)';
    
    for (const recipe of SAMPLE_RECIPES) {
      try {
        // Create SQL insert statement to bypass RLS
        const sql = `
          INSERT INTO recipes (
            title, description, ingredients, steps, code_snippet, language,
            difficulty, category, prep_time, cook_time, servings, author_id,
            author_name, image_url, tags, average_rating, rating_count, total_rating_points
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 0, 0, 0
          )
        `;
        
        const { error } = await supabase.rpc('exec_sql', {
          sql: sql,
          params: [
            recipe.title,
            recipe.description,
            recipe.ingredients,
            recipe.steps,
            recipe.code_snippet,
            recipe.language,
            recipe.difficulty,
            recipe.category,
            recipe.prep_time,
            recipe.cook_time,
            recipe.servings,
            userId,
            authorName,
            recipe.image_url,
            recipe.tags
          ]
        });
        
        if (error) {
          console.error(`❌ Error inserting ${recipe.title}:`, error);
        } else {
          console.log(`✅ Added: ${recipe.title}`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${recipe.title}:`, error);
      }
    }
    
    console.log('🎉 Sample recipe seeding completed!');
    
  } catch (error) {
    console.error('❌ Error seeding recipes:', error);
  }
}

// Run the seeder
seedSampleRecipes();
