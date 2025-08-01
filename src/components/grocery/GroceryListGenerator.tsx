import React, { useState, useEffect } from 'react';
import { 
  ShoppingCartIcon, 
  SparklesIcon,
  PlusIcon,
  MinusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { RecipeCard, Loading } from '../';
import { GroceryListService } from '../../services/groceryListService';
import { RecipeService } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import type { Recipe } from '../../types';
import type { GroceryList } from '../../types/grocery';
import toast from 'react-hot-toast';

interface GroceryListGeneratorProps {
  initialRecipes?: Recipe[];
  onGroceryListCreated: (groceryList: GroceryList) => void;
  onClose: () => void;
}

export const GroceryListGenerator: React.FC<GroceryListGeneratorProps> = ({
  initialRecipes = [],
  onGroceryListCreated,
  onClose
}) => {
  const { user } = useAuth();
  const [selectedRecipes, setSelectedRecipes] = useState<Recipe[]>(initialRecipes);
  const [availableRecipes, setAvailableRecipes] = useState<Recipe[]>([]);
  const [servingAdjustments, setServingAdjustments] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAvailableRecipes();
    // Initialize serving adjustments
    const adjustments: Record<string, number> = {};
    initialRecipes.forEach(recipe => {
      adjustments[recipe.id] = 1; // Default to 1x serving
    });
    setServingAdjustments(adjustments);
  }, []);

  const loadAvailableRecipes = async () => {
    try {
      setLoadingRecipes(true);
      const { recipes } = await RecipeService.getRecipes();
      setAvailableRecipes(recipes);
    } catch (error) {
      console.error('Error loading recipes:', error);
      toast.error('Failed to load recipes');
    } finally {
      setLoadingRecipes(false);
    }
  };

  const handleAddRecipe = (recipe: Recipe) => {
    if (!selectedRecipes.find(r => r.id === recipe.id)) {
      setSelectedRecipes([...selectedRecipes, recipe]);
      setServingAdjustments(prev => ({
        ...prev,
        [recipe.id]: 1
      }));
    }
  };

  const handleRemoveRecipe = (recipeId: string) => {
    setSelectedRecipes(selectedRecipes.filter(r => r.id !== recipeId));
    setServingAdjustments(prev => {
      const newAdjustments = { ...prev };
      delete newAdjustments[recipeId];
      return newAdjustments;
    });
  };

  const handleServingAdjustment = (recipeId: string, adjustment: number) => {
    setServingAdjustments(prev => ({
      ...prev,
      [recipeId]: Math.max(0.5, adjustment)
    }));
  };

  const handleGenerateGroceryList = async () => {
    if (!user) {
      toast.error('Please log in to create grocery lists');
      return;
    }

    if (selectedRecipes.length === 0) {
      toast.error('Please select at least one recipe');
      return;
    }

    try {
      setLoading(true);
      const groceryList = await GroceryListService.createGroceryListFromRecipes(
        selectedRecipes,
        user.id,
        servingAdjustments
      );
      
      toast.success('Grocery list created successfully!');
      onGroceryListCreated(groceryList);
    } catch (error) {
      console.error('Error creating grocery list:', error);
      toast.error('Failed to create grocery list');
    } finally {
      setLoading(false);
    }
  };

  const filteredAvailableRecipes = availableRecipes.filter(recipe => 
    !selectedRecipes.find(selected => selected.id === recipe.id) &&
    recipe.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalEstimatedItems = selectedRecipes.reduce((total, recipe) => {
    return total + (recipe.ingredients.length * (servingAdjustments[recipe.id] || 1));
  }, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
                <SparklesIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  AI Grocery List Generator
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Select recipes and let AI create your shopping list
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Selected Recipes Panel */}
          <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Selected Recipes ({selectedRecipes.length})
              </h3>
              {selectedRecipes.length > 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Est. {Math.round(totalEstimatedItems)} grocery items
                </p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {selectedRecipes.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCartIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No recipes selected yet
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Choose recipes from the right panel
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedRecipes.map(recipe => (
                    <div key={recipe.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {recipe.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {recipe.ingredients.length} ingredients
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveRecipe(recipe.id)}
                          className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Serving Adjustment */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Servings:
                        </span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleServingAdjustment(recipe.id, (servingAdjustments[recipe.id] || 1) - 0.5)}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                            disabled={servingAdjustments[recipe.id] <= 0.5}
                          >
                            <MinusIcon className="w-4 h-4" />
                          </button>
                          <span className="text-sm font-medium text-gray-900 dark:text-white min-w-[3rem] text-center">
                            {servingAdjustments[recipe.id] || 1}x
                          </span>
                          <button
                            onClick={() => handleServingAdjustment(recipe.id, (servingAdjustments[recipe.id] || 1) + 0.5)}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                          >
                            <PlusIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Available Recipes Panel */}
          <div className="w-1/2 flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Available Recipes
              </h3>
              <input
                type="text"
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingRecipes ? (
                <div className="flex items-center justify-center py-12">
                  <Loading size="lg" text="Loading recipes..." />
                </div>
              ) : filteredAvailableRecipes.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchQuery ? 'No recipes found' : 'No more recipes available'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredAvailableRecipes.map(recipe => (
                    <div key={recipe.id} className="relative">
                      <div
                        className="cursor-pointer hover:ring-2 hover:ring-primary-500 rounded-lg"
                        onClick={() => handleAddRecipe(recipe)}
                      >
                        <RecipeCard
                          recipe={recipe}
                          onSaveRecipe={() => {}} // Not needed here
                        />
                      </div>
                      <button
                        onClick={() => handleAddRecipe(recipe)}
                        className="absolute top-2 right-2 p-2 bg-primary-500 hover:bg-primary-600 text-white rounded-full shadow-lg transition-colors"
                        title="Add to grocery list"
                      >
                        <PlusIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {selectedRecipes.length} recipe{selectedRecipes.length !== 1 ? 's' : ''} selected
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateGroceryList}
                disabled={loading || selectedRecipes.length === 0}
                className="inline-flex items-center px-6 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4 mr-2" />
                    Generate Grocery List
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroceryListGenerator;
