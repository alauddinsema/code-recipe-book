import React, { useState, useEffect } from 'react';
import { CalculatorIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import type { NutritionInfo } from '../../types';
import { NutritionService } from '../../services/nutrition';
import { Button } from '../ui';
import NutritionDisplay from './NutritionDisplay';

interface NutritionCalculatorProps {
  ingredients: string[];
  servings?: number;
  onNutritionCalculated?: (nutrition: NutritionInfo) => void;
  className?: string;
}

const NutritionCalculator: React.FC<NutritionCalculatorProps> = ({
  ingredients,
  servings = 1,
  onNutritionCalculated,
  className = ''
}) => {
  const [nutrition, setNutrition] = useState<NutritionInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [recognizedIngredients, setRecognizedIngredients] = useState<string[]>([]);
  const [unrecognizedIngredients, setUnrecognizedIngredients] = useState<string[]>([]);

  const calculateNutrition = async () => {
    if (ingredients.length === 0) return;

    setLoading(true);
    try {
      // Calculate nutrition for the recipe
      const calculatedNutrition = NutritionService.calculateRecipeNutrition(ingredients, servings);
      
      // Track which ingredients were recognized
      const recognized: string[] = [];
      const unrecognized: string[] = [];
      
      ingredients.forEach(ingredient => {
        const parsed = NutritionService.parseIngredient(ingredient);
        const nutritionData = NutritionService.findNutritionData(parsed.ingredient);
        
        if (nutritionData) {
          recognized.push(ingredient);
        } else {
          unrecognized.push(ingredient);
        }
      });
      
      setRecognizedIngredients(recognized);
      setUnrecognizedIngredients(unrecognized);
      setNutrition(calculatedNutrition);
      
      // Notify parent component
      if (onNutritionCalculated) {
        onNutritionCalculated(calculatedNutrition);
      }
    } catch (error) {
      console.error('Failed to calculate nutrition:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-calculate when ingredients change
  useEffect(() => {
    if (ingredients.length > 0) {
      calculateNutrition();
    }
  }, [ingredients, servings]);

  const hasNutritionData = nutrition && (nutrition.calories || 0) > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CalculatorIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Nutrition Calculator
          </h3>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={calculateNutrition}
          loading={loading}
          className="flex items-center space-x-2"
        >
          <ArrowPathIcon className="w-4 h-4" />
          <span>Recalculate</span>
        </Button>
      </div>

      {/* Calculation Status */}
      {ingredients.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <CalculatorIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Nutrition Analysis
              </h4>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <p>
                  Analyzed {ingredients.length} ingredient{ingredients.length !== 1 ? 's' : ''}
                  {recognizedIngredients.length > 0 && (
                    <span className="text-green-600 dark:text-green-400 ml-2">
                      • {recognizedIngredients.length} recognized
                    </span>
                  )}
                  {unrecognizedIngredients.length > 0 && (
                    <span className="text-amber-600 dark:text-amber-400 ml-2">
                      • {unrecognizedIngredients.length} unrecognized
                    </span>
                  )}
                </p>
                
                {unrecognizedIngredients.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300">
                      View unrecognized ingredients
                    </summary>
                    <ul className="mt-1 ml-4 space-y-1">
                      {unrecognizedIngredients.map((ingredient, index) => (
                        <li key={index} className="text-amber-700 dark:text-amber-300">
                          • {ingredient}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                      These ingredients weren't included in nutrition calculations. You can add their nutrition manually.
                    </p>
                  </details>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nutrition Display */}
      {hasNutritionData ? (
        <NutritionDisplay
          nutrition={nutrition}
          servings={servings}
          showDetails={true}
        />
      ) : ingredients.length > 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center">
          <CalculatorIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Nutrition Data Available
          </h4>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            We couldn't calculate nutrition for the current ingredients. This might be because:
          </p>
          <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1 mb-4">
            <li>• Ingredients aren't in our nutrition database</li>
            <li>• Ingredient amounts aren't specified</li>
            <li>• Ingredient names need to be more specific</li>
          </ul>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Try using common ingredient names like "chicken breast", "rice", "olive oil", etc.
          </p>
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center">
          <CalculatorIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Add Ingredients
          </h4>
          <p className="text-gray-600 dark:text-gray-400">
            Add ingredients to your recipe to calculate nutrition information automatically.
          </p>
        </div>
      )}

      {/* Tips */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
          💡 Tips for Better Nutrition Calculation
        </h4>
        <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
          <li>• Include amounts: "2 cups rice" instead of just "rice"</li>
          <li>• Use common names: "chicken breast" instead of "organic free-range chicken"</li>
          <li>• Specify units: "1 tbsp olive oil" instead of "olive oil"</li>
          <li>• Be specific: "bell pepper" instead of just "pepper"</li>
        </ul>
      </div>
    </div>
  );
};

export default NutritionCalculator;
