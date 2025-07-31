/**
 * Advanced Recipe Seeding System
 * Scales up to 300+ recipes with comprehensive categorization
 */

import { supabase } from '../lib/supabase';

// Comprehensive category system
export const RECIPE_CATEGORIES = {
  BREAKFAST: {
    name: 'Breakfast',
    description: 'Start your day right with these morning favorites',
    tags: ['morning', 'breakfast', 'quick', 'energizing'],
    codeThemes: ['timer', 'nutrition-calculator', 'meal-planner']
  },
  FAST_COOK: {
    name: 'Fast to Cook',
    description: 'Quick meals ready in under 30 minutes',
    tags: ['quick', 'fast', 'under-30-min', 'busy-lifestyle'],
    codeThemes: ['timer', 'efficiency', 'automation']
  },
  LUNCH: {
    name: 'Lunch',
    description: 'Satisfying midday meals',
    tags: ['lunch', 'midday', 'filling', 'balanced'],
    codeThemes: ['portion-calculator', 'meal-prep', 'nutrition']
  },
  DINNER: {
    name: 'Dinner',
    description: 'Hearty evening meals for the whole family',
    tags: ['dinner', 'evening', 'family', 'hearty'],
    codeThemes: ['temperature-monitor', 'serving-calculator', 'timing']
  },
  DESSERT: {
    name: 'Desserts',
    description: 'Sweet treats and indulgent desserts',
    tags: ['dessert', 'sweet', 'treat', 'indulgent'],
    codeThemes: ['baking-calculator', 'temperature-control', 'timer']
  },
  BEVERAGE: {
    name: 'Beverages',
    description: 'Refreshing drinks and specialty beverages',
    tags: ['drink', 'beverage', 'refreshing', 'liquid'],
    codeThemes: ['mixing-calculator', 'temperature-control', 'ratio-calculator']
  },
  SNACK: {
    name: 'Snacks',
    description: 'Light bites and appetizers',
    tags: ['snack', 'appetizer', 'light', 'bite-sized'],
    codeThemes: ['portion-control', 'batch-calculator', 'storage-timer']
  },
  VEGETARIAN: {
    name: 'Vegetarian',
    description: 'Plant-based recipes without meat',
    tags: ['vegetarian', 'plant-based', 'no-meat', 'healthy'],
    codeThemes: ['nutrition-tracker', 'protein-calculator', 'vitamin-analyzer']
  },
  VEGAN: {
    name: 'Vegan',
    description: 'Completely plant-based recipes',
    tags: ['vegan', 'plant-based', 'dairy-free', 'no-animal-products'],
    codeThemes: ['nutrition-optimizer', 'substitute-finder', 'b12-tracker']
  },
  HEALTHY: {
    name: 'Healthy',
    description: 'Nutritious and wholesome recipes',
    tags: ['healthy', 'nutritious', 'wholesome', 'balanced'],
    codeThemes: ['calorie-counter', 'macro-calculator', 'health-tracker']
  },
  COMFORT_FOOD: {
    name: 'Comfort Food',
    description: 'Soul-warming comfort classics',
    tags: ['comfort', 'classic', 'warming', 'traditional'],
    codeThemes: ['slow-cooker', 'temperature-monitor', 'timing-optimizer']
  },
  INTERNATIONAL: {
    name: 'International',
    description: 'Flavors from around the world',
    tags: ['international', 'world-cuisine', 'exotic', 'cultural'],
    codeThemes: ['conversion-calculator', 'spice-ratio', 'authenticity-checker']
  }
} as const;

// Code snippet templates for different categories
export const CODE_TEMPLATES = {
  timer: {
    javascript: `// Smart cooking timer with notifications
class CookingTimer {
  constructor(recipeName, totalTime) {
    this.recipeName = recipeName;
    this.totalTime = totalTime;
    this.elapsed = 0;
    this.interval = null;
  }

  start() {
    console.log(\`Starting timer for \${this.recipeName}: \${this.totalTime} minutes\`);
    this.interval = setInterval(() => {
      this.elapsed++;
      const remaining = this.totalTime - this.elapsed;
      
      if (remaining === 5) {
        console.log('⏰ 5 minutes remaining!');
      } else if (remaining === 0) {
        console.log('🔔 Cooking complete!');
        this.stop();
      }
    }, 60000); // 1 minute intervals
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

const timer = new CookingTimer('{{RECIPE_NAME}}', {{COOK_TIME}});
timer.start();`,
    
    python: `# Smart cooking timer with temperature monitoring
import time
import threading
from datetime import datetime, timedelta

class SmartCookingTimer:
    def __init__(self, recipe_name, cook_time_minutes):
        self.recipe_name = recipe_name
        self.cook_time = cook_time_minutes
        self.start_time = None
        self.is_running = False
    
    def start(self):
        self.start_time = datetime.now()
        self.is_running = True
        print(f"🍳 Starting timer for {self.recipe_name}: {self.cook_time} minutes")
        
        # Schedule notifications
        threading.Timer(max(0, (self.cook_time - 5) * 60), self.five_minute_warning).start()
        threading.Timer(self.cook_time * 60, self.cooking_complete).start()
    
    def five_minute_warning(self):
        if self.is_running:
            print("⏰ 5 minutes remaining!")
    
    def cooking_complete(self):
        self.is_running = False
        print("🔔 Cooking complete! Time to serve.")

# Usage
timer = SmartCookingTimer("{{RECIPE_NAME}}", {{COOK_TIME}})
timer.start()`
  },

  'nutrition-calculator': {
    javascript: `// Nutrition calculator for recipe analysis
class NutritionCalculator {
  constructor() {
    this.nutritionDB = {
      // Calories per 100g
      'chicken breast': { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
      'rice': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
      'broccoli': { calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
      'olive oil': { calories: 884, protein: 0, carbs: 0, fat: 100 }
    };
  }

  calculateRecipeNutrition(ingredients) {
    let totalNutrition = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    
    ingredients.forEach(ingredient => {
      const [amount, unit, ...nameParts] = ingredient.split(' ');
      const name = nameParts.join(' ').toLowerCase();
      const nutrition = this.nutritionDB[name];
      
      if (nutrition) {
        const grams = this.convertToGrams(parseFloat(amount), unit);
        const factor = grams / 100;
        
        totalNutrition.calories += nutrition.calories * factor;
        totalNutrition.protein += nutrition.protein * factor;
        totalNutrition.carbs += nutrition.carbs * factor;
        totalNutrition.fat += nutrition.fat * factor;
      }
    });
    
    return totalNutrition;
  }

  convertToGrams(amount, unit) {
    const conversions = {
      'g': 1, 'grams': 1,
      'kg': 1000, 'kilograms': 1000,
      'cup': 240, 'cups': 240,
      'tbsp': 15, 'tablespoon': 15,
      'tsp': 5, 'teaspoon': 5
    };
    return amount * (conversions[unit.toLowerCase()] || 100);
  }
}

const calculator = new NutritionCalculator();
const ingredients = {{INGREDIENTS_ARRAY}};
const nutrition = calculator.calculateRecipeNutrition(ingredients);
console.log('Recipe Nutrition:', nutrition);`,

    python: `# Advanced nutrition calculator with macro tracking
class NutritionCalculator:
    def __init__(self):
        self.nutrition_db = {
            'chicken breast': {'calories': 165, 'protein': 31, 'carbs': 0, 'fat': 3.6, 'fiber': 0},
            'rice': {'calories': 130, 'protein': 2.7, 'carbs': 28, 'fat': 0.3, 'fiber': 0.4},
            'broccoli': {'calories': 34, 'protein': 2.8, 'carbs': 7, 'fat': 0.4, 'fiber': 2.6},
            'olive oil': {'calories': 884, 'protein': 0, 'carbs': 0, 'fat': 100, 'fiber': 0}
        }
    
    def calculate_recipe_nutrition(self, ingredients, servings=1):
        total_nutrition = {'calories': 0, 'protein': 0, 'carbs': 0, 'fat': 0, 'fiber': 0}
        
        for ingredient in ingredients:
            parts = ingredient.split()
            if len(parts) >= 2:
                try:
                    amount = float(parts[0])
                    unit = parts[1].lower()
                    name = ' '.join(parts[2:]).lower()
                    
                    if name in self.nutrition_db:
                        grams = self.convert_to_grams(amount, unit)
                        factor = grams / 100
                        
                        for nutrient in total_nutrition:
                            total_nutrition[nutrient] += self.nutrition_db[name][nutrient] * factor
                except ValueError:
                    continue
        
        # Calculate per serving
        per_serving = {k: round(v / servings, 2) for k, v in total_nutrition.items()}
        return per_serving
    
    def convert_to_grams(self, amount, unit):
        conversions = {
            'g': 1, 'grams': 1, 'gram': 1,
            'kg': 1000, 'kilograms': 1000, 'kilogram': 1000,
            'cup': 240, 'cups': 240,
            'tbsp': 15, 'tablespoon': 15, 'tablespoons': 15,
            'tsp': 5, 'teaspoon': 5, 'teaspoons': 5,
            'oz': 28.35, 'ounce': 28.35, 'ounces': 28.35,
            'lb': 453.6, 'pound': 453.6, 'pounds': 453.6
        }
        return amount * conversions.get(unit, 100)

# Usage
calculator = NutritionCalculator()
ingredients = {{INGREDIENTS_ARRAY}}
nutrition = calculator.calculate_recipe_nutrition(ingredients, {{SERVINGS}})
print(f"Nutrition per serving: {nutrition}")

# Calculate daily value percentages
daily_values = {'protein': 50, 'carbs': 300, 'fat': 65, 'fiber': 25}
percentages = {k: round((nutrition[k] / daily_values[k]) * 100, 1) 
               for k in daily_values if k in nutrition}
print(f"Daily value percentages: {percentages}")`
  },

  'temperature-monitor': {
    javascript: `// IoT temperature monitoring for cooking
class TemperatureMonitor {
  constructor(targetTemp, recipeName) {
    this.targetTemp = targetTemp;
    this.recipeName = recipeName;
    this.currentTemp = 20; // Room temperature start
    this.isMonitoring = false;
    this.tempHistory = [];
  }

  startMonitoring() {
    this.isMonitoring = true;
    console.log(\`🌡️ Monitoring temperature for \${this.recipeName}\`);
    console.log(\`Target temperature: \${this.targetTemp}°C\`);
    
    this.monitoringInterval = setInterval(() => {
      this.simulateTemperatureReading();
    }, 5000); // Check every 5 seconds
  }

  simulateTemperatureReading() {
    // Simulate gradual temperature increase
    this.currentTemp += Math.random() * 10 - 2; // Random fluctuation
    this.tempHistory.push({
      time: new Date(),
      temperature: Math.round(this.currentTemp * 10) / 10
    });

    console.log(\`Current temperature: \${this.currentTemp.toFixed(1)}°C\`);

    if (this.currentTemp >= this.targetTemp * 0.9) {
      console.log('🔥 Approaching target temperature!');
    }

    if (this.currentTemp >= this.targetTemp) {
      console.log('✅ Target temperature reached!');
      this.stopMonitoring();
    }

    if (this.currentTemp > this.targetTemp * 1.1) {
      console.log('⚠️ Temperature too high! Reduce heat.');
    }
  }

  stopMonitoring() {
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    console.log('Temperature monitoring stopped.');
  }

  getTemperatureHistory() {
    return this.tempHistory;
  }
}

const monitor = new TemperatureMonitor({{TARGET_TEMP}}, '{{RECIPE_NAME}}');
monitor.startMonitoring();`
  }
};

// Recipe sources configuration
export const RECIPE_SOURCES = {
  THEMEALDB: {
    name: 'TheMealDB',
    baseUrl: 'https://www.themealdb.com/api/json/v1/1',
    endpoints: {
      categories: '/categories.php',
      byCategory: '/filter.php?c=',
      byId: '/lookup.php?i=',
      random: '/random.php',
      search: '/search.php?s='
    },
    rateLimit: 1000, // 1 second between requests
    maxRecipes: 200
  },
  SPOONACULAR: {
    name: 'Spoonacular',
    baseUrl: 'https://api.spoonacular.com/recipes',
    rateLimit: 1000,
    maxRecipes: 100,
    requiresApiKey: true
  },
  MANUAL: {
    name: 'Manual Recipes',
    maxRecipes: 50
  }
};

export interface RecipeSeedingOptions {
  maxRecipes: number;
  sources: (keyof typeof RECIPE_SOURCES)[];
  categories: (keyof typeof RECIPE_CATEGORIES)[];
  batchSize: number;
  delayBetweenBatches: number;
  generateImages: boolean;
  skipExisting: boolean;
}

export const DEFAULT_SEEDING_OPTIONS: RecipeSeedingOptions = {
  maxRecipes: 300,
  sources: ['THEMEALDB', 'MANUAL'],
  categories: Object.keys(RECIPE_CATEGORIES) as (keyof typeof RECIPE_CATEGORIES)[],
  batchSize: 10,
  delayBetweenBatches: 2000,
  generateImages: true,
  skipExisting: true
};
