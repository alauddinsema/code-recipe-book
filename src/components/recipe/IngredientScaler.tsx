import React, { useState, useMemo } from 'react';
import { CalculatorIcon, ArrowPathIcon, BookmarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui';

interface IngredientScalerProps {
  ingredients: string[];
  originalServings: number;
  onScaledIngredientsChange?: (scaledIngredients: string[]) => void;
  onSaveScaledRecipe?: (scaledIngredients: string[], targetServings: number) => void;
  className?: string;
}

interface ParsedIngredient {
  original: string;
  amount?: number;
  unit?: string;
  ingredient: string;
  scaled?: string;
}

const IngredientScaler: React.FC<IngredientScalerProps> = ({
  ingredients,
  originalServings,
  onScaledIngredientsChange,
  onSaveScaledRecipe,
  className = ''
}) => {
  const [targetServings, setTargetServings] = useState(originalServings);
  const [showScaled, setShowScaled] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Unit conversion mappings
  const unitConversions = {
    // Volume conversions (to ml)
    'tsp': 4.92892,
    'teaspoon': 4.92892,
    'teaspoons': 4.92892,
    'tbsp': 14.7868,
    'tablespoon': 14.7868,
    'tablespoons': 14.7868,
    'cup': 236.588,
    'cups': 236.588,
    'fl oz': 29.5735,
    'fluid ounce': 29.5735,
    'fluid ounces': 29.5735,
    'pint': 473.176,
    'pints': 473.176,
    'quart': 946.353,
    'quarts': 946.353,
    'gallon': 3785.41,
    'gallons': 3785.41,
    'ml': 1,
    'milliliter': 1,
    'milliliters': 1,
    'l': 1000,
    'liter': 1000,
    'liters': 1000,

    // Weight conversions (to grams)
    'oz': 28.3495,
    'ounce': 28.3495,
    'ounces': 28.3495,
    'lb': 453.592,
    'pound': 453.592,
    'pounds': 453.592,
    'g': 1,
    'gram': 1,
    'grams': 1,
    'kg': 1000,
    'kilogram': 1000,
    'kilograms': 1000
  };

  // Ingredient-specific weight conversions (cup to grams)
  const ingredientWeights: { [key: string]: number } = {
    'flour': 120,
    'all-purpose flour': 120,
    'bread flour': 120,
    'cake flour': 100,
    'sugar': 200,
    'brown sugar': 220,
    'powdered sugar': 120,
    'butter': 227,
    'rice': 185,
    'oats': 80,
    'milk': 240,
    'water': 240,
    'oil': 220,
    'honey': 340,
    'cocoa powder': 85,
    'baking powder': 4,
    'baking soda': 4,
    'salt': 300,
    'vanilla extract': 240
  };

  // Ingredients that don't scale well or need special handling
  const scalingWarnings: { [key: string]: string } = {
    'salt': 'Salt may not scale linearly - taste and adjust',
    'pepper': 'Pepper may not scale linearly - taste and adjust',
    'spices': 'Spices may not scale linearly - taste and adjust',
    'baking powder': 'Baking powder scaling may affect texture',
    'baking soda': 'Baking soda scaling may affect texture',
    'yeast': 'Yeast scaling may affect rise time',
    'vanilla': 'Vanilla extract may not need full scaling',
    'extract': 'Extracts may not need full scaling'
  };

  const parseIngredient = (ingredient: string): ParsedIngredient => {
    // Common patterns for ingredient parsing
    const patterns = [
      // "2 cups flour" or "2 cup flour"
      /^(\d+(?:\.\d+)?(?:\/\d+)?)\s+(cups?|tbsp|tablespoons?|tsp|teaspoons?|oz|ounces?|lb|pounds?|g|grams?|kg|kilograms?|ml|milliliters?|l|liters?|fl\s+oz|fluid\s+ounces?|pints?|quarts?|gallons?)\s+(.+)$/i,
      // "1/2 cup flour"
      /^(\d+\/\d+)\s+(cups?|tbsp|tablespoons?|tsp|teaspoons?|oz|ounces?|lb|pounds?|g|grams?|kg|kilograms?|ml|milliliters?|l|liters?|fl\s+oz|fluid\s+ounces?|pints?|quarts?|gallons?)\s+(.+)$/i,
      // "2.5 cups flour"
      /^(\d+\.\d+)\s+(cups?|tbsp|tablespoons?|tsp|teaspoons?|oz|ounces?|lb|pounds?|g|grams?|kg|kilograms?|ml|milliliters?|l|liters?|fl\s+oz|fluid\s+ounces?|pints?|quarts?|gallons?)\s+(.+)$/i,
      // "flour, 2 cups" (ingredient first)
      /^(.+),\s*(\d+(?:\.\d+)?(?:\/\d+)?)\s+(cups?|tbsp|tablespoons?|tsp|teaspoons?|oz|ounces?|lb|pounds?|g|grams?|kg|kilograms?|ml|milliliters?|l|liters?|fl\s+oz|fluid\s+ounces?|pints?|quarts?|gallons?)$/i,
      // "2 large eggs" or "3 medium onions"
      /^(\d+(?:\.\d+)?)\s+(large|medium|small|whole|fresh|dried|chopped|diced|sliced|minced)?\s*(.+)$/i,
      // Just "2 eggs"
      /^(\d+(?:\.\d+)?)\s+(.+)$/i
    ];

    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      const match = ingredient.match(pattern);
      if (match) {
        let amount: number;
        let unit: string | undefined;
        let ingredientName: string;

        // Handle "flour, 2 cups" pattern (index 3)
        if (i === 3) {
          ingredientName = match[1].trim();
          const amountStr = match[2];
          unit = match[3].toLowerCase();

          if (amountStr.includes('/')) {
            const [numerator, denominator] = amountStr.split('/').map(Number);
            amount = numerator / denominator;
          } else {
            amount = parseFloat(amountStr);
          }

          return {
            original: ingredient,
            amount,
            unit,
            ingredient: ingredientName
          };
        }

        // Handle fractions
        if (match[1].includes('/')) {
          const [numerator, denominator] = match[1].split('/').map(Number);
          amount = numerator / denominator;
        } else {
          amount = parseFloat(match[1]);
        }

        // Check if second group is a unit or descriptor
        const secondGroup = match[2]?.toLowerCase();
        const isUnit = secondGroup && Object.keys(unitConversions).some(unit =>
          unit.toLowerCase() === secondGroup || unit.toLowerCase() === secondGroup.replace(/s$/, '')
        );

        if (isUnit) {
          return {
            original: ingredient,
            amount,
            unit: secondGroup,
            ingredient: match[3]
          };
        } else {
          return {
            original: ingredient,
            amount,
            ingredient: match[2] ? `${match[2]} ${match[3] || ''}`.trim() : match[2]
          };
        }
      }
    }

    return {
      original: ingredient,
      ingredient: ingredient
    };
  };

  const scaleAmount = (amount: number, unit?: string, ingredientName?: string): { amount: number; unit: string } => {
    const scaleFactor = targetServings / originalServings;
    let scaledAmount = amount * scaleFactor;

    if (!unit) {
      return { amount: scaledAmount, unit: '' };
    }

    // Special handling for spices and seasonings (scale less aggressively)
    if (ingredientName) {
      const lowerIngredient = ingredientName.toLowerCase();
      if (lowerIngredient.includes('salt') || lowerIngredient.includes('pepper') ||
          lowerIngredient.includes('spice') || lowerIngredient.includes('extract') ||
          lowerIngredient.includes('vanilla')) {
        // Scale spices/seasonings by square root for better flavor balance
        scaledAmount = amount * Math.sqrt(scaleFactor);
      }
    }

    // For whole items (like eggs), round to nearest whole number if close
    if (!Object.keys(unitConversions).includes(unit.toLowerCase())) {
      const rounded = Math.round(scaledAmount);
      if (Math.abs(scaledAmount - rounded) < 0.1) {
        return { amount: rounded, unit };
      }
      return { amount: Math.round(scaledAmount * 4) / 4, unit }; // Round to nearest quarter
    }

    return { amount: Math.round(scaledAmount * 100) / 100, unit };
  };

  const formatAmount = (amount: number): string => {
    // Convert decimals to fractions for common cooking measurements
    const fractions: { [key: number]: string } = {
      0.125: '1/8',
      0.25: '1/4',
      0.33: '1/3',
      0.375: '3/8',
      0.5: '1/2',
      0.625: '5/8',
      0.67: '2/3',
      0.75: '3/4',
      0.875: '7/8'
    };

    const whole = Math.floor(amount);
    const decimal = amount - whole;

    // Find closest fraction
    let closestFraction = '';
    let closestDiff = Infinity;
    
    for (const [dec, frac] of Object.entries(fractions)) {
      const diff = Math.abs(decimal - parseFloat(dec));
      if (diff < closestDiff && diff < 0.05) {
        closestDiff = diff;
        closestFraction = frac;
      }
    }

    if (closestFraction && whole > 0) {
      return `${whole} ${closestFraction}`;
    } else if (closestFraction) {
      return closestFraction;
    } else if (amount < 1) {
      return amount.toFixed(2);
    } else {
      return amount % 1 === 0 ? amount.toString() : amount.toFixed(1);
    }
  };

  const scaledIngredients = useMemo(() => {
    const newWarnings: string[] = [];

    const scaled = ingredients.map(ingredient => {
      const parsed = parseIngredient(ingredient);

      if (parsed.amount !== undefined) {
        const scaled = scaleAmount(parsed.amount, parsed.unit, parsed.ingredient);
        const formattedAmount = formatAmount(scaled.amount);

        parsed.scaled = `${formattedAmount}${scaled.unit ? ` ${scaled.unit}` : ''} ${parsed.ingredient}`.trim();

        // Check for scaling warnings
        const lowerIngredient = parsed.ingredient.toLowerCase();
        for (const [warningKey, warningMessage] of Object.entries(scalingWarnings)) {
          if (lowerIngredient.includes(warningKey) && !newWarnings.includes(warningMessage)) {
            newWarnings.push(warningMessage);
          }
        }
      } else {
        parsed.scaled = parsed.ingredient;
      }

      return parsed;
    });

    setWarnings(newWarnings);
    return scaled;
  }, [ingredients, targetServings, originalServings]);

  // Notify parent component of scaled ingredients
  React.useEffect(() => {
    if (onScaledIngredientsChange && showScaled) {
      onScaledIngredientsChange(scaledIngredients.map(item => item.scaled || item.original));
    }
  }, [scaledIngredients, showScaled, onScaledIngredientsChange]);

  const resetServings = () => {
    setTargetServings(originalServings);
    setShowScaled(false);
  };

  const scaleFactor = targetServings / originalServings;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <CalculatorIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Ingredient Scaler
          </h3>
        </div>
        <button
          type="button"
          onClick={resetServings}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center space-x-1"
        >
          <ArrowPathIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Serving Size Controls */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-3">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Original:
            </label>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {originalServings} servings
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <label htmlFor="target-servings" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Scale to:
            </label>
            <input
              id="target-servings"
              type="number"
              min="1"
              max="50"
              value={targetServings}
              onChange={(e) => {
                const value = Math.max(1, parseInt(e.target.value) || 1);
                setTargetServings(value);
                setShowScaled(value !== originalServings);
              }}
              className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="1"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">servings</span>
          </div>
        </div>

        {scaleFactor !== 1 && (
          <div className="text-sm text-primary-600 dark:text-primary-400 mb-3">
            Scale factor: {scaleFactor.toFixed(2)}x
            {scaleFactor > 1 ? ' (increasing)' : ' (decreasing)'}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showScaled"
              checked={showScaled}
              onChange={(e) => setShowScaled(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="showScaled" className="text-sm text-gray-700 dark:text-gray-300">
              Show scaled ingredients
            </label>
          </div>

          {onSaveScaledRecipe && showScaled && scaleFactor !== 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSaveScaledRecipe(scaledIngredients.map(item => item.scaled || item.original), targetServings)}
              className="flex items-center space-x-2"
            >
              <BookmarkIcon className="w-4 h-4" />
              <span>Save Scaled Recipe</span>
            </Button>
          )}
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && showScaled && scaleFactor !== 1 && (
        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start space-x-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                Scaling Notes
              </h4>
              <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                {warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Ingredients List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900 dark:text-white">
            Ingredients {showScaled && scaleFactor !== 1 ? '(Scaled)' : '(Original)'}
          </h4>
          {showScaled && scaleFactor !== 1 && (
            <span className="text-xs text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded-full">
              {scaleFactor.toFixed(2)}x scale
            </span>
          )}
        </div>

        <div className="max-h-64 overflow-y-auto">
          <ul className="space-y-2">
            {(showScaled && scaleFactor !== 1 ? scaledIngredients : ingredients.map(ing => ({ original: ing, ingredient: ing, scaled: ing }))).map((item, index) => (
              <li key={index} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <span className="flex-shrink-0 w-2 h-2 bg-primary-500 rounded-full mt-2"></span>
                <span className="text-gray-700 dark:text-gray-300 flex-1">
                  {showScaled && scaleFactor !== 1 ? (item.scaled || item.original) : item.original}
                </span>
                {showScaled && scaleFactor !== 1 && item.amount && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                    was: {formatAmount(item.amount)}{item.unit ? ` ${item.unit}` : ''}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Quick Scale Buttons */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">Quick scale:</div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
          {[
            { label: '1/2', servings: Math.max(1, Math.round(originalServings * 0.5)), color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/40' },
            { label: '2x', servings: originalServings * 2, color: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/40' },
            { label: '3x', servings: originalServings * 3, color: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/40' },
            { label: '4x', servings: originalServings * 4, color: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/40' }
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setTargetServings(preset.servings);
                setShowScaled(preset.servings !== originalServings);
              }}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${preset.color} ${
                targetServings === preset.servings ? 'ring-2 ring-primary-500' : ''
              }`}
            >
              <div className="text-center">
                <div className="font-semibold">{preset.label}</div>
                <div className="text-xs opacity-75">{preset.servings} servings</div>
              </div>
            </button>
          ))}
        </div>

        {/* Additional Tips */}
        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            💡 <strong>Tip:</strong> Scaling works best with precise measurements. For spices and seasonings,
            start with the scaled amount and adjust to taste.
          </p>
        </div>
      </div>
    </div>
  );
};

export default IngredientScaler;
