import React, { useState } from 'react';
import { PantryService, type PantryItem, type PantryCategory } from '../../services/pantryService';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui';
import toast from 'react-hot-toast';

interface AddPantryItemModalProps {
  categories: PantryCategory[];
  onItemAdded: (item: PantryItem) => void;
  onClose: () => void;
}

const AddPantryItemModal: React.FC<AddPantryItemModalProps> = ({ categories, onItemAdded, onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    quantity: 1,
    unit: '',
    category_id: categories[0]?.id || '',
    purchase_date: new Date().toISOString().split('T')[0],
    expiration_date: '',
    storage_location: '',
    purchase_price: '',
    store_purchased: '',
    notes: '',
    low_stock_threshold: 1,
    auto_add_to_shopping: true
  });

  const commonUnits = [
    'pieces', 'lbs', 'oz', 'kg', 'g', 'cups', 'tbsp', 'tsp', 'ml', 'l', 'fl oz', 'cans', 'bottles', 'packages'
  ];

  const storageLocations = [
    'Pantry', 'Refrigerator', 'Freezer', 'Spice Rack', 'Counter', 'Cabinet', 'Basement', 'Garage'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.name.trim()) {
      toast.error('Item name is required');
      return;
    }

    if (!formData.unit.trim()) {
      toast.error('Unit is required');
      return;
    }

    try {
      setLoading(true);

      const itemData = {
        user_id: user.id,
        name: formData.name.trim(),
        brand: formData.brand.trim() || undefined,
        quantity: formData.quantity,
        unit: formData.unit.trim(),
        category_id: formData.category_id,
        purchase_date: formData.purchase_date || undefined,
        expiration_date: formData.expiration_date || undefined,
        storage_location: formData.storage_location || undefined,
        purchase_price: formData.purchase_price ? Number(formData.purchase_price) : undefined,
        store_purchased: formData.store_purchased.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        is_running_low: false,
        low_stock_threshold: formData.low_stock_threshold,
        auto_add_to_shopping: formData.auto_add_to_shopping
      };

      const newItem = await PantryService.addPantryItem(itemData);
      onItemAdded(newItem);

    } catch (error) {
      console.error('Failed to add item:', error);
      toast.error('Failed to add item to pantry');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateExpirationDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Pantry Item</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Close add pantry item modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Organic Bananas"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Brand
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => handleInputChange('brand', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Dole"
                />
              </div>
            </div>

            {/* Quantity and Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="pantry-quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quantity *
                </label>
                <input
                  id="pantry-quantity"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label htmlFor="pantry-unit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Unit *
                </label>
                <select
                  id="pantry-unit"
                  value={formData.unit}
                  onChange={(e) => handleInputChange('unit', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="">Select unit</option>
                  {commonUnits.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Category and Storage */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="pantry-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  id="pantry-category"
                  value={formData.category_id}
                  onChange={(e) => handleInputChange('category_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  required
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="storage-location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Storage Location
                </label>
                <select
                  id="storage-location"
                  value={formData.storage_location}
                  onChange={(e) => handleInputChange('storage_location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select location</option>
                  {storageLocations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="purchase-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Purchase Date
                </label>
                <input
                  id="purchase-date"
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => handleInputChange('purchase_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="expiration-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Expiration Date
                </label>
                <div className="space-y-2">
                  <input
                    id="expiration-date"
                    type="date"
                    value={formData.expiration_date}
                    onChange={(e) => handleInputChange('expiration_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                  <div className="flex space-x-2">
                    {[7, 14, 30, 90].map(days => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => handleInputChange('expiration_date', calculateExpirationDate(days))}
                        className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        +{days}d
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Purchase Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Purchase Price
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.purchase_price}
                  onChange={(e) => handleInputChange('purchase_price', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Store
                </label>
                <input
                  type="text"
                  value={formData.store_purchased}
                  onChange={(e) => handleInputChange('store_purchased', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Whole Foods"
                />
              </div>
            </div>

            {/* Low Stock Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="low-stock-threshold" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Low Stock Threshold
                </label>
                <input
                  id="low-stock-threshold"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.low_stock_threshold}
                  onChange={(e) => handleInputChange('low_stock_threshold', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex items-center pt-8">
                <input
                  type="checkbox"
                  id="auto_add_to_shopping"
                  checked={formData.auto_add_to_shopping}
                  onChange={(e) => handleInputChange('auto_add_to_shopping', e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="auto_add_to_shopping" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Auto-add to shopping list when low
                </label>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="Any additional notes about this item..."
              />
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-6">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Adding...' : 'Add Item'}
              </Button>
              <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddPantryItemModal;
