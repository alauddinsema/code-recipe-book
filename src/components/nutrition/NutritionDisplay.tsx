import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import type { NutritionInfo } from '../../types';
import { NutritionService } from '../../services/nutrition';

interface NutritionDisplayProps {
  nutrition: NutritionInfo;
  servings?: number;
  className?: string;
  compact?: boolean;
  showDetails?: boolean;
}

const NutritionDisplay: React.FC<NutritionDisplayProps> = ({
  nutrition,
  servings = 1,
  className = '',
  compact = false,
  showDetails = true
}) => {
  const [expanded, setExpanded] = useState(false);
  
  const summary = NutritionService.getNutritionSummary(nutrition);
  const mainNutrients = summary.slice(0, 4); // Calories, Protein, Carbs, Fat
  const detailedNutrients = summary.slice(4); // Fiber, Sodium, etc.

  if (compact) {
    return (
      <div className={`flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 ${className}`}>
        {mainNutrients.map((nutrient, index) => (
          <span key={nutrient.label} className="flex items-center space-x-1">
            <span className="font-medium">{nutrient.value}{nutrient.unit}</span>
            <span className="text-xs">{nutrient.label}</span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Nutrition Facts
          </h3>
          {nutrition.per_serving && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Per serving ({servings} serving{servings !== 1 ? 's' : ''})
            </span>
          )}
        </div>
      </div>

      {/* Main Nutrients */}
      <div className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          {mainNutrients.map((nutrient) => (
            <div key={nutrient.label} className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {nutrient.value}
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">
                  {nutrient.unit}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {nutrient.label}
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Nutrients */}
        {showDetails && detailedNutrients.length > 0 && (
          <div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center justify-between w-full py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <span>Detailed Nutrition</span>
              {expanded ? (
                <ChevronUpIcon className="w-4 h-4" />
              ) : (
                <ChevronDownIcon className="w-4 h-4" />
              )}
            </button>

            {expanded && (
              <div className="mt-3 space-y-2">
                {detailedNutrients.map((nutrient) => (
                  <div key={nutrient.label} className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {nutrient.label}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {nutrient.value} {nutrient.unit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Additional Nutrition Info */}
        {(nutrition.vitamin_a || nutrition.vitamin_c || nutrition.calcium || nutrition.iron) && expanded && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Vitamins & Minerals
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {nutrition.vitamin_a && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Vitamin A</span>
                  <span className="text-gray-900 dark:text-white">{nutrition.vitamin_a.toFixed(0)} IU</span>
                </div>
              )}
              {nutrition.vitamin_c && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Vitamin C</span>
                  <span className="text-gray-900 dark:text-white">{nutrition.vitamin_c.toFixed(1)} mg</span>
                </div>
              )}
              {nutrition.calcium && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Calcium</span>
                  <span className="text-gray-900 dark:text-white">{nutrition.calcium.toFixed(0)} mg</span>
                </div>
              )}
              {nutrition.iron && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Iron</span>
                  <span className="text-gray-900 dark:text-white">{nutrition.iron.toFixed(1)} mg</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Note */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-b-lg">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          * Nutritional values are estimates based on ingredient data and may vary.
        </p>
      </div>
    </div>
  );
};

export default NutritionDisplay;
