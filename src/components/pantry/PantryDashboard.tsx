import React, { useState, useEffect } from 'react';
import { PantryService, type PantryItem, type PantryCategory, type PantryStats } from '../../services/pantryService';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui';
import PantryItemCard from './PantryItemCard';
import AddPantryItemModal from './AddPantryItemModal';
import WhatCanIMake from './WhatCanIMake';
import toast from 'react-hot-toast';

const PantryDashboard: React.FC = () => {
  const { user } = useAuth();
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [categories, setCategories] = useState<PantryCategory[]>([]);
  const [stats, setStats] = useState<PantryStats | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWhatCanIMake, setShowWhatCanIMake] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'all' | 'expiring' | 'low_stock'>('all');

  useEffect(() => {
    if (user) {
      loadPantryData();
    }
  }, [user, selectedCategory]);

  const loadPantryData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Load data in parallel
      const [itemsData, categoriesData, statsData] = await Promise.all([
        PantryService.getPantryItems(user.id, selectedCategory || undefined),
        PantryService.getPantryCategories(),
        PantryService.getPantryStats(user.id)
      ]);

      setPantryItems(itemsData);
      setCategories(categoriesData);
      setStats(statsData);

    } catch (error) {
      console.error('Failed to load pantry data:', error);
      toast.error('Failed to load pantry data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!user || !searchQuery.trim()) {
      loadPantryData();
      return;
    }

    try {
      const searchResults = await PantryService.searchPantryItems(user.id, searchQuery);
      setPantryItems(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed');
    }
  };

  const handleItemAdded = (newItem: PantryItem) => {
    setPantryItems(prev => [newItem, ...prev]);
    setShowAddModal(false);
    loadPantryData(); // Refresh stats
    toast.success('Item added to pantry!');
  };

  const handleItemUpdated = (updatedItem: PantryItem) => {
    setPantryItems(prev => 
      prev.map(item => item.id === updatedItem.id ? updatedItem : item)
    );
    loadPantryData(); // Refresh stats
  };

  const handleItemDeleted = (itemId: string) => {
    setPantryItems(prev => prev.filter(item => item.id !== itemId));
    loadPantryData(); // Refresh stats
    toast.success('Item removed from pantry');
  };

  const handleViewModeChange = async (mode: 'all' | 'expiring' | 'low_stock') => {
    if (!user) return;

    setViewMode(mode);
    try {
      let items: PantryItem[];
      
      switch (mode) {
        case 'expiring':
          items = await PantryService.getExpiringItems(user.id, 7);
          break;
        case 'low_stock':
          items = await PantryService.getLowStockItems(user.id);
          break;
        default:
          items = await PantryService.getPantryItems(user.id, selectedCategory || undefined);
      }
      
      setPantryItems(items);
    } catch (error) {
      console.error('Failed to filter items:', error);
      toast.error('Failed to filter items');
    }
  };

  const filteredItems = pantryItems.filter(item => {
    if (searchQuery) {
      return item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Pantry</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Track your ingredients and never run out of essentials
          </p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={() => setShowWhatCanIMake(true)} variant="secondary">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            What Can I Make?
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Item
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_items}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Items</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-orange-600">{stats.expiring_soon}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Expiring Soon</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-red-600">{stats.expired_items}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Expired</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-yellow-600">{stats.low_stock_items}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Low Stock</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-green-600">${stats.total_value.toFixed(2)}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Value</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{stats.categories_count}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Categories</div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mb-8">
        {/* View Mode Tabs */}
        <div className="flex space-x-1 mb-6">
          {[
            { key: 'all', label: 'All Items', icon: '📦' },
            { key: 'expiring', label: 'Expiring Soon', icon: '⏰' },
            { key: 'low_stock', label: 'Low Stock', icon: '📉' }
          ].map((mode) => (
            <button
              key={mode.key}
              type="button"
              onClick={() => handleViewModeChange(mode.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === mode.key
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {mode.icon} {mode.label}
            </button>
          ))}
        </div>

        {/* Search and Category Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            aria-label="Filter by category"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <Button onClick={handleSearch} variant="secondary">
            Search
          </Button>
        </div>
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏪</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchQuery ? 'No items found' : 'Your pantry is empty'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchQuery 
              ? 'Try adjusting your search terms'
              : 'Start by adding some ingredients to track your inventory'
            }
          </p>
          {!searchQuery && (
            <Button onClick={() => setShowAddModal(true)}>
              Add Your First Item
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <PantryItemCard
              key={item.id}
              item={item}
              categories={categories}
              onUpdate={handleItemUpdated}
              onDelete={handleItemDeleted}
            />
          ))}
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <AddPantryItemModal
          categories={categories}
          onItemAdded={handleItemAdded}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* What Can I Make Modal */}
      {showWhatCanIMake && (
        <WhatCanIMake
          isModal={true}
          onClose={() => setShowWhatCanIMake(false)}
        />
      )}
    </div>
  );
};

export default PantryDashboard;
