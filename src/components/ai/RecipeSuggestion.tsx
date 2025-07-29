import React, { useState } from 'react';
import { Button } from '../ui';
import { GeminiService } from '../../services';
import type { GeminiRecipeRequest, GeminiRecipeResponse } from '../../types';
import toast from 'react-hot-toast';

interface RecipeSuggestionProps {
  onRecipeGenerated: (recipe: GeminiRecipeResponse) => void;
  onClose: () => void;
}

const RecipeSuggestion: React.FC<RecipeSuggestionProps> = ({ onRecipeGenerated, onClose }) => {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [ingredientInput, setIngredientInput] = useState('');
  const [preferences, setPreferences] = useState('');
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [restrictionInput, setRestrictionInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const addIngredient = () => {
    if (ingredientInput.trim() && !ingredients.includes(ingredientInput.trim())) {
      setIngredients(prev => [...prev, ingredientInput.trim()]);
      setIngredientInput('');
    }
  };

  const removeIngredient = (index: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const addRestriction = () => {
    if (restrictionInput.trim() && !dietaryRestrictions.includes(restrictionInput.trim())) {
      setDietaryRestrictions(prev => [...prev, restrictionInput.trim()]);
      setRestrictionInput('');
    }
  };

  const removeRestriction = (index: number) => {
    setDietaryRestrictions(prev => prev.filter((_, i) => i !== index));
  };

  const generateRecipe = async () => {
    if (ingredients.length === 0) {
      toast.error('Please add at least one ingredient');
      return;
    }

    try {
      setLoading(true);
      const request: GeminiRecipeRequest = {
        ingredients,
        preferences: preferences.trim() || undefined,
        dietary_restrictions: dietaryRestrictions.length > 0 ? dietaryRestrictions : undefined,
      };

      const recipe = await GeminiService.generateRecipe(request);
      onRecipeGenerated(recipe);
      toast.success('Recipe generated successfully!');
    } catch (error) {
      console.error('Failed to generate recipe:', error);
      toast.error('Failed to generate recipe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSuggestions = async () => {
    if (dietaryRestrictions.length === 0 && !preferences.trim()) {
      toast.error('Please add dietary preferences or restrictions to get suggestions');
      return;
    }

    try {
      setLoadingSuggestions(true);
      const prefs = [...dietaryRestrictions];
      if (preferences.trim()) {
        prefs.push(preferences.trim());
      }
      
      const recipeSuggestions = await GeminiService.getRecipeSuggestions(prefs);
      setSuggestions(recipeSuggestions);
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      toast.error('Failed to get recipe suggestions');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            AI Recipe Generator
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Ingredients */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Available Ingredients *
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={ingredientInput}
                onChange={(e) => setIngredientInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addIngredient())}
                className="input-field flex-1"
                placeholder="Add an ingredient"
              />
              <Button type="button" onClick={addIngredient} variant="secondary">
                Add
              </Button>
            </div>
            
            {ingredients.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {ingredients.map((ingredient, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-sm"
                  >
                    {ingredient}
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Preferences */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cooking Preferences (Optional)
            </label>
            <textarea
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              rows={2}
              className="input-field"
              placeholder="e.g., spicy food, quick meals, comfort food, healthy options..."
            />
          </div>

          {/* Dietary Restrictions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Dietary Restrictions (Optional)
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={restrictionInput}
                onChange={(e) => setRestrictionInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRestriction())}
                className="input-field flex-1"
                placeholder="e.g., vegetarian, gluten-free, dairy-free"
              />
              <Button type="button" onClick={addRestriction} variant="secondary">
                Add
              </Button>
            </div>
            
            {dietaryRestrictions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {dietaryRestrictions.map((restriction, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-full text-sm"
                  >
                    {restriction}
                    <button
                      type="button"
                      onClick={() => removeRestriction(index)}
                      className="text-orange-500 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Recipe Suggestions */}
          {suggestions.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Recipe Suggestions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300"
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={getSuggestions}
              loading={loadingSuggestions}
              disabled={loadingSuggestions}
              variant="secondary"
              className="flex-1"
            >
              Get Recipe Ideas
            </Button>
            <Button
              onClick={generateRecipe}
              loading={loading}
              disabled={loading || ingredients.length === 0}
              className="flex-1"
            >
              Generate Recipe
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeSuggestion;
