import React, { useState, useMemo } from 'react';
import { CalculatorIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface IngredientScalerProps {
  ingredients: string[];
  originalServings: number;
  onScaledIngredientsChange?: (scaledIngredients: string[]) => void;
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
  onScaledIngredientsChange
}) => {
  const [targetServings, setTargetServings] = useState(originalServings);
  const [showScaled, setShowScaled] = useState(false);

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

  const parseIngredient = (ingredient: string): ParsedIngredient => {
    // Common patterns for ingredient parsing
    const patterns = [
      // "2 cups flour" or "2 cup flour"
      /^(\d+(?:\.\d+)?(?:\/\d+)?)\s+(cups?|tbsp|tablespoons?|tsp|teaspoons?|oz|ounces?|lb|pounds?|g|grams?|kg|kilograms?|ml|milliliters?|l|liters?|fl\s+oz|fluid\s+ounces?|pints?|quarts?|gallons?)\s+(.+)$/i,
      // "1/2 cup flour"
      /^(\d+\/\d+)\s+(cups?|tbsp|tablespoons?|tsp|teaspoons?|oz|ounces?|lb|pounds?|g|grams?|kg|kilograms?|ml|milliliters?|l|liters?|fl\s+oz|fluid\s+ounces?|pints?|quarts?|gallons?)\s+(.+)$/i,
      // "2.5 cups flour"
      /^(\d+\.\d+)\s+(cups?|tbsp|tablespoons?|tsp|teaspoons?|oz|ounces?|lb|pounds?|g|grams?|kg|kilograms?|ml|milliliters?|l|liters?|fl\s+oz|fluid\s+ounces?|pints?|quarts?|gallons?)\s+(.+)$/i,
      // "2 large eggs" or "3 medium onions"
      /^(\d+(?:\.\d+)?)\s+(large|medium|small)?\s*(.+)$/i,
      // Just "2 eggs"
      /^(\d+(?:\.\d+)?)\s+(.+)$/i
    ];

    for (const pattern of patterns) {
      const match = ingredient.match(pattern);
      if (match) {
        let amount: number;
        
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

  const scaleAmount = (amount: number, unit?: string): { amount: number; unit: string } => {
    const scaleFactor = targetServings / originalServings;
    const scaledAmount = amount * scaleFactor;

    if (!unit) {
      return { amount: scaledAmount, unit: '' };
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
    return ingredients.map(ingredient => {
      const parsed = parseIngredient(ingredient);
      
      if (parsed.amount !== undefined) {
        const scaled = scaleAmount(parsed.amount, parsed.unit);
        const formattedAmount = formatAmount(scaled.amount);
        
        parsed.scaled = `${formattedAmount}${scaled.unit ? ` ${scaled.unit}` : ''} ${parsed.ingredient}`.trim();
      } else {
        parsed.scaled = parsed.ingredient;
      }
      
      return parsed;
    });
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
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <CalculatorIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Ingredient Scaler
          </h3>
        </div>
        <button
          onClick={resetServings}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center space-x-1"
        >
          <ArrowPathIcon className="w-4 h-4" />
          <span>Reset</span>
        </button>
      </div>

      {/* Serving Size Controls */}
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-3">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Original:
            </label>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {originalServings} servings
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Scale to:
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={targetServings}
              onChange={(e) => {
                const value = Math.max(1, parseInt(e.target.value) || 1);
                setTargetServings(value);
                setShowScaled(value !== originalServings);
              }}
              className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
      </div>

      {/* Ingredients List */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900 dark:text-white">
          Ingredients {showScaled && scaleFactor !== 1 ? '(Scaled)' : '(Original)'}
        </h4>
        <ul className="space-y-2">
          {(showScaled && scaleFactor !== 1 ? scaledIngredients : ingredients.map(ing => ({ original: ing, ingredient: ing, scaled: ing }))).map((item, index) => (
            <li key={index} className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-2 h-2 bg-primary-500 rounded-full mt-2"></span>
              <span className="text-gray-700 dark:text-gray-300">
                {showScaled && scaleFactor !== 1 ? (item.scaled || item.original) : item.original}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Quick Scale Buttons */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Quick scale:</div>
        <div className="flex flex-wrap gap-2">
          {[
            { label: '1/2', servings: Math.max(1, Math.round(originalServings * 0.5)) },
            { label: '2x', servings: originalServings * 2 },
            { label: '3x', servings: originalServings * 3 },
            { label: '4x', servings: originalServings * 4 }
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                setTargetServings(preset.servings);
                setShowScaled(preset.servings !== originalServings);
              }}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full transition-colors"
            >
              {preset.label} ({preset.servings})
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IngredientScaler;
