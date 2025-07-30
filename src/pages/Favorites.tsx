import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HeartIcon, FolderIcon, PlusIcon } from '@heroicons/react/24/outline';
import { RecipeCard, SEOHead, RecipeListSkeleton, SimplePullToRefresh } from '../components';
import { FavoritesService, type Collection } from '../services/favorites';
import { useAuth } from '../contexts/AuthContext';
import type { Recipe } from '../types';
import { ROUTES } from '../utils/constants';
import toast from 'react-hot-toast';

const Favorites: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'favorites' | 'collections'>('favorites');
  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, activeTab]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      if (activeTab === 'favorites') {
        const recipes = await FavoritesService.getFavoriteRecipes(user.id);
        setFavoriteRecipes(recipes);
      } else {
        const userCollections = await FavoritesService.getUserCollections(user.id);
        setCollections(userCollections);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = (recipeId: string) => {
    setFavoriteRecipes(prev => prev.filter(recipe => recipe.id !== recipeId));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <SEOHead 
          title="Favorites - Code Recipe Book"
          description="Save and organize your favorite recipes"
        />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <HeartIcon className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Sign In to Save Favorites
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Create an account to save your favorite recipes and organize them into collections.
            </p>
            <div className="space-x-4">
              <Link to={ROUTES.LOGIN} className="btn-primary">
                Sign In
              </Link>
              <Link to={ROUTES.REGISTER} className="btn-secondary">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SEOHead 
        title="My Favorites - Code Recipe Book"
        description="Your saved favorite recipes and collections"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Favorites
            </h1>

            <Link
              to={ROUTES.COLLECTIONS}
              className="btn-primary flex items-center space-x-2"
            >
              <FolderIcon className="w-5 h-5" />
              <span>Manage Collections</span>
            </Link>
          </div>
          
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('favorites')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'favorites'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <HeartIcon className="w-5 h-5 inline mr-2" />
                Favorite Recipes
              </button>
              <button
                onClick={() => setActiveTab('collections')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'collections'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <FolderIcon className="w-5 h-5 inline mr-2" />
                Collections
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <RecipeListSkeleton count={6} />
        ) : activeTab === 'favorites' ? (
          /* Favorite Recipes */
          favoriteRecipes.length === 0 ? (
            <div className="text-center py-16">
              <HeartIcon className="w-16 h-16 text-gray-400 mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                No Favorite Recipes Yet
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Start exploring recipes and click the heart icon to save your favorites!
              </p>
              <Link to={ROUTES.HOME} className="btn-primary">
                Browse Recipes
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favoriteRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onFavoriteToggle={() => handleRemoveFavorite(recipe.id)}
                />
              ))}
            </div>
          )
        ) : (
          /* Collections */
          <div>
            {/* Create Collection Button */}
            <div className="mb-6">
              <button className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                <PlusIcon className="w-5 h-5 mr-2" />
                Create New Collection
              </button>
            </div>

            {collections.length === 0 ? (
              <div className="text-center py-16">
                <FolderIcon className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  No Collections Yet
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  Create collections to organize your recipes by theme, occasion, or dietary preferences.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {collections.map((collection) => (
                  <Link
                    key={collection.id}
                    to={`${ROUTES.COLLECTIONS}/${collection.id}`}
                    className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <FolderIcon className="w-8 h-8 text-primary-500 flex-shrink-0" />
                      {collection.is_public && (
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                          Public
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {collection.name}
                    </h3>
                    
                    {collection.description && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                        {collection.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>
                        {collection.recipe_count} recipe{collection.recipe_count !== 1 ? 's' : ''}
                      </span>
                      <span>
                        {new Date(collection.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
