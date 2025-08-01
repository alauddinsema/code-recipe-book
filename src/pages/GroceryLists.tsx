import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  SparklesIcon,
  ShoppingCartIcon,
  ListBulletIcon
} from '@heroicons/react/24/outline';
import { SEOHead, Loading } from '../components';
import { GroceryListCard } from '../components/grocery/GroceryListCard';
import { GroceryListGenerator } from '../components/grocery/GroceryListGenerator';
import { GroceryListService } from '../services/groceryListService';
import { useAuth } from '../contexts/AuthContext';
import type { GroceryList } from '../types/grocery';
import { ROUTES } from '../utils/constants';
import toast from 'react-hot-toast';

const GroceryLists: React.FC = () => {
  const { user } = useAuth();
  const [groceryLists, setGroceryLists] = useState<GroceryList[]>([]);
  const [sharedLists, setSharedLists] = useState<GroceryList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerator, setShowGenerator] = useState(false);
  const [activeTab, setActiveTab] = useState<'my-lists' | 'shared'>('my-lists');

  useEffect(() => {
    if (user) {
      loadGroceryLists();
    }
  }, [user]);

  const loadGroceryLists = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [myLists, shared] = await Promise.all([
        GroceryListService.getUserGroceryLists(user.id),
        GroceryListService.getSharedGroceryLists(user.email || '')
      ]);
      
      setGroceryLists(myLists);
      setSharedLists(shared);
    } catch (error) {
      console.error('Error loading grocery lists:', error);
      toast.error('Failed to load grocery lists');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!user) return;

    if (!confirm('Are you sure you want to delete this grocery list?')) {
      return;
    }

    try {
      await GroceryListService.deleteGroceryList(listId, user.id);
      setGroceryLists(groceryLists.filter(list => list.id !== listId));
      toast.success('Grocery list deleted successfully');
    } catch (error) {
      console.error('Error deleting grocery list:', error);
      toast.error('Failed to delete grocery list');
    }
  };

  const handleShareList = async (_listId: string) => {
    // This would open a share modal - for now just show a toast
    toast.success('Share functionality coming soon!');
  };

  const handleEditList = (listId: string) => {
    // Navigate to edit page
    window.location.href = `${ROUTES.GROCERY_LISTS}/${listId}/edit`;
  };

  const handleGroceryListCreated = (groceryList: GroceryList) => {
    setGroceryLists([groceryList, ...groceryLists]);
    setShowGenerator(false);
    // Navigate to the new grocery list
    window.location.href = `${ROUTES.GROCERY_LISTS}/${groceryList.id}`;
  };

  const getListsByStatus = (lists: GroceryList[]) => {
    return {
      active: lists.filter(list => list.status === 'active' || list.status === 'draft'),
      shopping: lists.filter(list => list.status === 'shopping'),
      completed: lists.filter(list => list.status === 'completed')
    };
  };

  const myListsByStatus = getListsByStatus(groceryLists);
  const sharedListsByStatus = getListsByStatus(sharedLists);
  const currentLists = activeTab === 'my-lists' ? myListsByStatus : sharedListsByStatus;

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <SEOHead 
          title="Grocery Lists - Code Recipe Book"
          description="Manage your AI-powered grocery lists"
        />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <ShoppingCartIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Sign In Required
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Please sign in to manage your grocery lists
            </p>
            <Link
              to={ROUTES.LOGIN}
              className="inline-flex items-center px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <SEOHead 
        title="Grocery Lists - Code Recipe Book"
        description="Manage your AI-powered grocery lists and shopping experience"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Grocery Lists
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                AI-powered shopping lists from your favorite recipes
              </p>
            </div>
            
            <button
              onClick={() => setShowGenerator(true)}
              className="inline-flex items-center px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors shadow-soft"
            >
              <SparklesIcon className="w-5 h-5 mr-2" />
              Create List
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('my-lists')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'my-lists'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                My Lists ({groceryLists.length})
              </button>
              <button
                onClick={() => setActiveTab('shared')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'shared'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Shared with Me ({sharedLists.length})
              </button>
            </nav>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loading size="lg" text="Loading grocery lists..." />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active/Draft Lists */}
            {currentLists.active.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <ListBulletIcon className="w-5 h-5 mr-2" />
                  Ready to Shop ({currentLists.active.length})
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {currentLists.active.map(list => (
                    <GroceryListCard
                      key={list.id}
                      groceryList={list}
                      onDelete={activeTab === 'my-lists' ? handleDeleteList : undefined}
                      onShare={activeTab === 'my-lists' ? handleShareList : undefined}
                      onEdit={activeTab === 'my-lists' ? handleEditList : undefined}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Shopping Lists */}
            {currentLists.shopping.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <ShoppingCartIcon className="w-5 h-5 mr-2" />
                  Currently Shopping ({currentLists.shopping.length})
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {currentLists.shopping.map(list => (
                    <GroceryListCard
                      key={list.id}
                      groceryList={list}
                      onDelete={activeTab === 'my-lists' ? handleDeleteList : undefined}
                      onShare={activeTab === 'my-lists' ? handleShareList : undefined}
                      onEdit={activeTab === 'my-lists' ? handleEditList : undefined}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Lists */}
            {currentLists.completed.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Completed ({currentLists.completed.length})
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {currentLists.completed.map(list => (
                    <GroceryListCard
                      key={list.id}
                      groceryList={list}
                      onDelete={activeTab === 'my-lists' ? handleDeleteList : undefined}
                      onShare={activeTab === 'my-lists' ? handleShareList : undefined}
                      onEdit={activeTab === 'my-lists' ? handleEditList : undefined}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {groceryLists.length === 0 && sharedLists.length === 0 && (
              <div className="text-center py-12">
                <ShoppingCartIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No grocery lists yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Create your first AI-powered grocery list from your favorite recipes. 
                  Smart ingredient analysis and price estimates included!
                </p>
                <button
                  onClick={() => setShowGenerator(true)}
                  className="inline-flex items-center px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
                >
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  Create Your First List
                </button>
              </div>
            )}

            {/* Tab-specific empty states */}
            {activeTab === 'my-lists' && groceryLists.length === 0 && sharedLists.length > 0 && (
              <div className="text-center py-12">
                <ListBulletIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No personal lists yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Create your first grocery list from recipes
                </p>
                <button
                  onClick={() => setShowGenerator(true)}
                  className="inline-flex items-center px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
                >
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  Create List
                </button>
              </div>
            )}

            {activeTab === 'shared' && sharedLists.length === 0 && groceryLists.length > 0 && (
              <div className="text-center py-12">
                <ShoppingCartIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No shared lists
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Lists shared with you will appear here
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grocery List Generator Modal */}
      {showGenerator && (
        <GroceryListGenerator
          onGroceryListCreated={handleGroceryListCreated}
          onClose={() => setShowGenerator(false)}
        />
      )}
    </div>
  );
};

export default GroceryLists;
