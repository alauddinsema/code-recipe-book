import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FolderIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import {
  SEOHead,
  Loading,
  RecipeCard,
  InfiniteScrollContainer,
  Button,
  ShareButton
} from '../components';
import { FavoritesService, type Collection } from '../services/favorites';
import { useAuth } from '../contexts/AuthContext';
import { useInfiniteScroll } from '../hooks';

import { ROUTES } from '../utils/constants';
import toast from 'react-hot-toast';

const CollectionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Infinite scroll for recipes
  const fetchRecipes = async (page: number, pageSize: number) => {
    if (!id) throw new Error('Collection ID is required');
    
    const recipes = await FavoritesService.getCollectionRecipes(id);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedRecipes = recipes.slice(startIndex, endIndex);
    
    return {
      items: paginatedRecipes,
      hasMore: endIndex < recipes.length,
      total: recipes.length
    };
  };

  const {
    items: recipes,
    loading: recipesLoading,
    hasMore,
    error,
    loadingRef,
    refresh: refreshRecipes,
    retry
  } = useInfiniteScroll({
    fetchMore: fetchRecipes,
    pageSize: 12,
    enabled: !!id
  });

  useEffect(() => {
    if (id) {
      loadCollection();
    }
  }, [id]);

  const loadCollection = async () => {
    if (!id || !user) return;

    try {
      setLoading(true);
      const collections = await FavoritesService.getUserCollections(user.id);
      const foundCollection = collections.find(c => c.id === id);
      
      if (!foundCollection) {
        toast.error('Collection not found');
        navigate(ROUTES.FAVORITES);
        return;
      }

      setCollection(foundCollection);
      setEditName(foundCollection.name);
      setEditDescription(foundCollection.description || '');
      setEditIsPublic(foundCollection.is_public);
    } catch (error) {
      console.error('Failed to load collection:', error);
      toast.error('Failed to load collection');
      navigate(ROUTES.FAVORITES);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (collection) {
      setEditName(collection.name);
      setEditDescription(collection.description || '');
      setEditIsPublic(collection.is_public);
    }
  };

  const handleSaveEdit = async () => {
    if (!collection || !user || !editName.trim()) return;

    try {
      setUpdating(true);
      await FavoritesService.updateCollection(collection.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        is_public: editIsPublic
      });

      setCollection(prev => prev ? {
        ...prev,
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        is_public: editIsPublic
      } : null);

      setIsEditing(false);
      toast.success('Collection updated successfully');
    } catch (error) {
      console.error('Failed to update collection:', error);
      toast.error('Failed to update collection');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!collection || !user) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${collection.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await FavoritesService.deleteCollection(collection.id);
      toast.success('Collection deleted successfully');
      navigate(ROUTES.FAVORITES);
    } catch (error) {
      console.error('Failed to delete collection:', error);
      toast.error('Failed to delete collection');
    }
  };

  const handleRemoveRecipe = async (recipeId: string) => {
    if (!collection) return;

    try {
      await FavoritesService.removeFromCollection(collection.id, recipeId);
      refreshRecipes();
      toast.success('Recipe removed from collection');
    } catch (error) {
      console.error('Failed to remove recipe:', error);
      toast.error('Failed to remove recipe');
    }
  };



  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Sign In Required
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please sign in to view collections.
          </p>
          <Link to={ROUTES.LOGIN} className="btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <Loading size="lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <FolderIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Collection Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The collection you're looking for doesn't exist or you don't have access to it.
          </p>
          <Link to={ROUTES.FAVORITES} className="btn-primary">
            Back to Collections
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SEOHead
        title={collection.name}
        description={collection.description || `Recipe collection: ${collection.name}`}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={() => navigate(ROUTES.FAVORITES)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Go back to favorites"
              title="Go back to favorites"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Collections
            </h1>
          </div>

          {/* Collection Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            {isEditing ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-2xl font-bold bg-transparent border-b-2 border-primary-500 focus:outline-none text-gray-900 dark:text-white"
                  placeholder="Collection name"
                />
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Collection description (optional)"
                />
                <div className="flex items-center space-x-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editIsPublic}
                      onChange={(e) => setEditIsPublic(e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Make this collection public
                    </span>
                  </label>
                </div>
                <div className="flex space-x-3">
                  <Button
                    onClick={handleSaveEdit}
                    disabled={!editName.trim() || updating}
                    className="btn-primary"
                  >
                    {updating ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    onClick={handleCancelEdit}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <FolderIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {collection.name}
                      </h2>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {collection.recipe_count} recipe{collection.recipe_count !== 1 ? 's' : ''}
                        </span>
                        <div className="flex items-center space-x-1">
                          {collection.is_public ? (
                            <>
                              <EyeIcon className="w-4 h-4 text-green-500" />
                              <span className="text-sm text-green-600 dark:text-green-400">Public</span>
                            </>
                          ) : (
                            <>
                              <EyeSlashIcon className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-500 dark:text-gray-400">Private</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <ShareButton
                      collection={collection}
                      variant="icon"
                      size="md"
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    />
                    <button
                      onClick={handleEdit}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                      title="Edit collection"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleDelete}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                      title="Delete collection"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {collection.description && (
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {collection.description}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recipes */}
        <InfiniteScrollContainer
          items={recipes}
          loading={recipesLoading}
          hasMore={hasMore}
          error={error}
          loadingRef={loadingRef as React.RefObject<HTMLDivElement>}
          onRetry={retry}
          onRefresh={refreshRecipes}
          renderItem={(recipe) => (
            <RecipeCard
              recipe={recipe}
              onRemoveFromCollection={() => handleRemoveRecipe(recipe.id)}
              showRemoveFromCollection={true}
            />
          )}
          renderSkeleton={() => (
            <div className="h-96 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
          )}
          skeletonCount={8}
          emptyMessage="No recipes in this collection yet. Start adding some recipes!"
          emptyIcon={
            <FolderIcon className="w-12 h-12" />
          }
          gridCols={4}
          gap="lg"
          className="mb-8"
        />
      </div>
    </div>
  );
};

export default CollectionDetail;
