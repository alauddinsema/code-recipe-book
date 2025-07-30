import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  DocumentArrowUpIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import {
  SEOHead,
  Loading,
  Button,
  MobileInput,
  CollectionCard,
  ImportModal,
  ExportModal
} from '../components';
import { FavoritesService, type Collection } from '../services/favorites';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../utils/constants';
import toast from 'react-hot-toast';

const Collections: React.FC = () => {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [publicCollections, setPublicCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my-collections' | 'public'>('my-collections');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadCollections();
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'public') {
      loadPublicCollections();
    }
  }, [activeTab]);

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

  const loadPublicCollections = async () => {
    try {
      const publicColls = await FavoritesService.getPublicCollections(50);
      setPublicCollections(publicColls);
    } catch (error) {
      console.error('Failed to load public collections:', error);
      toast.error('Failed to load public collections');
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

  const filteredCollections = collections.filter(collection =>
    collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (collection.description && collection.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredPublicCollections = publicCollections.filter(collection =>
    collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (collection.description && collection.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );



  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Sign In Required
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please sign in to view and create collections.
          </p>
          <Link to={ROUTES.LOGIN} className="btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SEOHead
        title="Recipe Collections"
        description="Organize your recipes into custom collections and discover public collections from other users"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Recipe Collections
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Organize your recipes into custom collections
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowImportModal(true)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                title="Import Recipes"
              >
                <DocumentArrowUpIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowExportModal(true)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                title="Export Collections"
                disabled={collections.length === 0}
              >
                <DocumentArrowDownIcon className="w-5 h-5" />
              </button>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <PlusIcon className="w-5 h-5" />
                <span>New Collection</span>
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('my-collections')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'my-collections'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                My Collections ({collections.length})
              </button>
              <button
                onClick={() => setActiveTab('public')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'public'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Public Collections
              </button>
            </nav>
          </div>

          {/* Search */}
          <div className="relative">
            <MobileInput
              type="text"
              placeholder="Search collections..."
              value={searchQuery}
              onChange={(value) => setSearchQuery(value)}
              className="pl-10"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* Create Collection Form */}
        {showCreateForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Create New Collection
            </h3>
            <form onSubmit={handleCreateCollection} className="space-y-4">
              <MobileInput
                type="text"
                placeholder="Collection name"
                value={newCollectionName}
                onChange={(value) => setNewCollectionName(value)}
                required
              />
              <textarea
                placeholder="Description (optional)"
                value={newCollectionDescription}
                onChange={(e) => setNewCollectionDescription(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Make this collection public
                  </span>
                </label>
              </div>
              <div className="flex space-x-3">
                <Button
                  type="submit"
                  disabled={!newCollectionName.trim() || creating}
                  className="btn-primary"
                >
                  {creating ? 'Creating...' : 'Create Collection'}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewCollectionName('');
                    setNewCollectionDescription('');
                    setIsPublic(false);
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Collections Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loading size="lg" />
          </div>
        ) : (
          <div>
            {activeTab === 'my-collections' ? (
              <div>
                {filteredCollections.length === 0 ? (
                  <div className="text-center py-16">
                    <FolderIcon className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                      {searchQuery ? 'No matching collections' : 'No collections yet'}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                      {searchQuery 
                        ? 'Try adjusting your search terms.'
                        : 'Create collections to organize your recipes by theme, occasion, or dietary preferences.'
                      }
                    </p>
                    {!searchQuery && (
                      <Button
                        onClick={() => setShowCreateForm(true)}
                        className="btn-primary"
                      >
                        Create Your First Collection
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCollections.map((collection) => (
                      <CollectionCard
                        key={collection.id}
                        collection={collection}
                        onUpdate={(updatedCollection) => {
                          setCollections(prev =>
                            prev.map(c => c.id === updatedCollection.id ? updatedCollection : c)
                          );
                        }}
                        onDelete={(collectionId) => {
                          setCollections(prev => prev.filter(c => c.id !== collectionId));
                        }}
                        showActions={true}
                        showAuthor={false}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                {filteredPublicCollections.length === 0 ? (
                  <div className="text-center py-16">
                    <FolderIcon className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                      {searchQuery ? 'No matching public collections' : 'No public collections yet'}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      {searchQuery 
                        ? 'Try adjusting your search terms.'
                        : 'Be the first to create a public collection!'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPublicCollections.map((collection) => (
                      <CollectionCard
                        key={collection.id}
                        collection={collection}
                        showActions={false}
                        showAuthor={true}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Import Modal */}
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={(result) => {
          // Refresh collections after import
          if (result.success.length > 0) {
            loadCollections();
          }
        }}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        recipes={[]} // Collections page doesn't have direct access to recipes
        title="Export Collections"
      />
    </div>
  );
};

export default Collections;
