import React, { useState } from 'react';
import { PantryService, type PantryItem, type PantryCategory } from '../../services/pantryService';
import { Button } from '../ui';
import toast from 'react-hot-toast';

interface PantryItemCardProps {
  item: PantryItem;
  categories: PantryCategory[];
  onUpdate: (item: PantryItem) => void;
  onDelete: (itemId: string) => void;
}

const PantryItemCard: React.FC<PantryItemCardProps> = ({ item, categories, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedItem, setEditedItem] = useState(item);
  const [loading, setLoading] = useState(false);

  const category = categories.find(cat => cat.id === item.category_id);

  const getExpirationStatus = () => {
    if (!item.expiration_date) return 'none';
    
    const today = new Date();
    const expirationDate = new Date(item.expiration_date);
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiration < 0) return 'expired';
    if (daysUntilExpiration <= 3) return 'expiring_soon';
    if (daysUntilExpiration <= 7) return 'expiring_week';
    return 'fresh';
  };

  const getExpirationColor = () => {
    const status = getExpirationStatus();
    switch (status) {
      case 'expired': return 'text-red-600 bg-red-50';
      case 'expiring_soon': return 'text-orange-600 bg-orange-50';
      case 'expiring_week': return 'text-yellow-600 bg-yellow-50';
      case 'fresh': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getExpirationText = () => {
    if (!item.expiration_date) return '';
    
    const today = new Date();
    const expirationDate = new Date(item.expiration_date);
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiration < 0) return `Expired ${Math.abs(daysUntilExpiration)} days ago`;
    if (daysUntilExpiration === 0) return 'Expires today';
    if (daysUntilExpiration === 1) return 'Expires tomorrow';
    return `Expires in ${daysUntilExpiration} days`;
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const updatedItem = await PantryService.updatePantryItem(item.id, editedItem);
      onUpdate(updatedItem);
      setIsEditing(false);
      toast.success('Item updated successfully');
    } catch (error) {
      console.error('Failed to update item:', error);
      toast.error('Failed to update item');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      setLoading(true);
      await PantryService.deletePantryItem(item.id);
      onDelete(item.id);
    } catch (error) {
      console.error('Failed to delete item:', error);
      toast.error('Failed to delete item');
    } finally {
      setLoading(false);
    }
  };

  const handleUseItem = async () => {
    const quantityToUse = prompt('How much did you use?', '1');
    if (!quantityToUse || isNaN(Number(quantityToUse))) return;

    try {
      setLoading(true);
      const updatedItem = await PantryService.usePantryItem(item.id, Number(quantityToUse));
      onUpdate(updatedItem);
      toast.success('Item usage recorded');
    } catch (error) {
      console.error('Failed to record usage:', error);
      toast.error('Failed to record usage');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkConsumed = async () => {
    if (!confirm('Mark this item as completely consumed?')) return;

    try {
      setLoading(true);
      await PantryService.markItemAsConsumed(item.id);
      const updatedItem = { ...item, quantity: 0 };
      onUpdate(updatedItem);
      toast.success('Item marked as consumed');
    } catch (error) {
      console.error('Failed to mark as consumed:', error);
      toast.error('Failed to mark as consumed');
    } finally {
      setLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="space-y-4">
          <input
            type="text"
            value={editedItem.name}
            onChange={(e) => setEditedItem({ ...editedItem, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            placeholder="Item name"
          />
          
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={editedItem.quantity}
              onChange={(e) => setEditedItem({ ...editedItem, quantity: Number(e.target.value) })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              placeholder="Quantity"
            />
            <input
              type="text"
              value={editedItem.unit}
              onChange={(e) => setEditedItem({ ...editedItem, unit: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              placeholder="Unit"
            />
          </div>

          <input
            type="date"
            value={editedItem.expiration_date || ''}
            onChange={(e) => setEditedItem({ ...editedItem, expiration_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
          />

          <div className="flex space-x-2">
            <Button onClick={handleSave} disabled={loading} size="sm">
              Save
            </Button>
            <Button 
              onClick={() => {
                setIsEditing(false);
                setEditedItem(item);
              }} 
              variant="secondary" 
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          {category && (
            <span className="text-lg" title={category.name}>
              {category.icon}
            </span>
          )}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">{item.name}</h3>
            {item.brand && (
              <p className="text-sm text-gray-600 dark:text-gray-400">{item.brand}</p>
            )}
          </div>
        </div>
        
        <div className="flex space-x-1">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Edit item"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="p-1 text-gray-400 hover:text-red-600"
            title="Delete item"
            disabled={loading}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Quantity and Status */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            {item.quantity} {item.unit}
          </span>
          {item.is_running_low && (
            <span className="px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full">
              Low Stock
            </span>
          )}
        </div>

        {item.expiration_date && (
          <div className={`px-2 py-1 text-xs font-medium rounded-full ${getExpirationColor()}`}>
            {getExpirationText()}
          </div>
        )}
      </div>

      {/* Storage Location */}
      {item.storage_location && (
        <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
          📍 {item.storage_location}
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-2">
        <Button
          onClick={handleUseItem}
          size="sm"
          variant="secondary"
          disabled={loading || item.quantity <= 0}
          className="flex-1"
        >
          Use
        </Button>
        <Button
          onClick={handleMarkConsumed}
          size="sm"
          variant="secondary"
          disabled={loading || item.quantity <= 0}
          className="flex-1"
        >
          Consumed
        </Button>
      </div>

      {/* Notes */}
      {item.notes && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">{item.notes}</p>
        </div>
      )}
    </div>
  );
};

export default PantryItemCard;
