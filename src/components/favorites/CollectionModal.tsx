import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  FolderIcon,
  FolderPlusIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { FavoritesService, type Collection } from '../../services/favorites';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipeId: string;
  recipeName: string;
}

const CollectionModal: React.FC<CollectionModalProps> = ({
  isOpen,
  onClose,
  recipeId,
  recipeName
}) => {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [recipeCollections, setRecipeCollections] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadCollections();
      loadRecipeCollections();
    }
  }, [isOpen, user, recipeId]);

  const loadCollections = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userCollections = await FavoritesService.getUserCollections(user.id);
      setCollections(userCollections);
    } catch (error) {
      console.error('Failed to load collections:', error);
      toast.error('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const loadRecipeCollections = async () => {
    if (!user) return;

    try {
      const recipeColls = await FavoritesService.getRecipeCollections(user.id, recipeId);
      setRecipeCollections(recipeColls.map(c => c.id));
    } catch (error) {
      console.error('Failed to load recipe collections:', error);
    }
  };

  const handleToggleCollection = async (collectionId: string) => {
    if (!user) return;

    try {
      const isInCollection = recipeCollections.includes(collectionId);
      
      if (isInCollection) {
        await FavoritesService.removeFromCollection(collectionId, recipeId);
        setRecipeCollections(prev => prev.filter(id => id !== collectionId));
        toast.success('Removed from collection');
      } else {
        await FavoritesService.addToCollection(collectionId, recipeId);
        setRecipeCollections(prev => [...prev, collectionId]);
        toast.success('Added to collection');
      }

      // Update collection recipe count
      setCollections(prev => prev.map(collection => 
        collection.id === collectionId
          ? { 
              ...collection, 
              recipe_count: isInCollection 
                ? collection.recipe_count - 1 
                : collection.recipe_count + 1 
            }
          : collection
      ));
    } catch (error) {
      console.error('Failed to toggle collection:', error);
      toast.error('Failed to update collection');
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newCollectionName.trim()) return;

    try {
      setCreating(true);
      const newCollection = await FavoritesService.createCollection(
        user.id,
        newCollectionName.trim(),
        newCollectionDescription.trim() || undefined,
        isPublic
      );

      setCollections(prev => [{ ...newCollection, recipe_count: 0 }, ...prev]);
      setNewCollectionName('');
      setNewCollectionDescription('');
      setIsPublic(false);
      setShowCreateForm(false);
      toast.success('Collection created successfully');
    } catch (error) {
      console.error('Failed to create collection:', error);
      toast.error('Failed to create collection');
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Add to Collection
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Recipe Info */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Adding <span className="font-medium text-gray-900 dark:text-white">"{recipeName}"</span> to collections
          </p>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : (
            <>
              {/* Create New Collection Button */}
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="w-full flex items-center justify-center space-x-2 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-primary-300 hover:text-primary-600 dark:hover:border-primary-600 dark:hover:text-primary-400 transition-colors mb-4"
              >
                <FolderPlusIcon className="w-5 h-5" />
                <span>Create New Collection</span>
              </button>

              {/* Create Collection Form */}
              {showCreateForm && (
                <form onSubmit={handleCreateCollection} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Collection Name *
                      </label>
                      <input
                        type="text"
                        value={newCollectionName}
                        onChange={(e) => setNewCollectionName(e.target.value)}
                        placeholder="e.g., Quick Weeknight Meals"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description (Optional)
                      </label>
                      <textarea
                        value={newCollectionDescription}
                        onChange={(e) => setNewCollectionDescription(e.target.value)}
                        placeholder="Describe your collection..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isPublic"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Make this collection public
                      </label>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        disabled={creating || !newCollectionName.trim()}
                        className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {creating ? 'Creating...' : 'Create Collection'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCreateForm(false)}
                        className="flex-1 btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Collections List */}
              {collections.length === 0 ? (
                <div className="text-center py-8">
                  <FolderIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No collections yet. Create your first collection above!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {collections.map((collection) => {
                    const isSelected = recipeCollections.includes(collection.id);
                    
                    return (
                      <button
                        key={collection.id}
                        onClick={() => handleToggleCollection(collection.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          isSelected
                            ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700'
                            : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <FolderIcon className={`w-5 h-5 ${isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`} />
                          <div className="text-left">
                            <p className={`font-medium ${isSelected ? 'text-primary-900 dark:text-primary-100' : 'text-gray-900 dark:text-white'}`}>
                              {collection.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {collection.recipe_count} recipe{collection.recipe_count !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        
                        {isSelected && (
                          <CheckIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollectionModal;
