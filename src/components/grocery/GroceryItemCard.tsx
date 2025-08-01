import React, { useState } from 'react';
import { 
  CheckCircleIcon, 
  TrashIcon, 
  PencilIcon,
  PlusIcon,
  MinusIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import type { GroceryItem } from '../../types/grocery';

interface GroceryItemCardProps {
  item: GroceryItem;
  onToggleChecked: (itemId: string, isChecked: boolean) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onDelete: (itemId: string) => void;
  onEdit?: (itemId: string) => void;
  isShoppingMode?: boolean;
  className?: string;
}

export const GroceryItemCard: React.FC<GroceryItemCardProps> = ({
  item,
  onToggleChecked,
  onUpdateQuantity,
  onDelete,
  onEdit,
  isShoppingMode = false,
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editQuantity, setEditQuantity] = useState(item.quantity);

  const handleToggleChecked = () => {
    onToggleChecked(item.id, !item.is_checked);
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(0.1, item.quantity + delta);
    onUpdateQuantity(item.id, newQuantity);
  };

  const handleEditQuantity = () => {
    if (editQuantity !== item.quantity) {
      onUpdateQuantity(item.id, editQuantity);
    }
    setIsEditing(false);
  };

  const formatQuantity = (quantity: number, unit: string) => {
    // Format quantity nicely
    const formattedQty = quantity % 1 === 0 ? quantity.toString() : quantity.toFixed(1);
    return `${formattedQty} ${unit}${quantity !== 1 ? 's' : ''}`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getCategoryColor = (categoryId: string) => {
    const colors: Record<string, string> = {
      'produce': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'meat-seafood': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'dairy-eggs': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'pantry': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'grains-bread': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'frozen': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
      'beverages': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'snacks': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      'condiments': 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200',
      'spices-herbs': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
      'baking': 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
      'household': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      'other': 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
    };
    return colors[categoryId] || colors['other'];
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-200 ${
      item.is_checked 
        ? 'opacity-60 bg-gray-50 dark:bg-gray-700/50' 
        : 'hover:shadow-soft'
    } ${className}`}>
      <div className="p-4">
        <div className="flex items-start space-x-3">
          {/* Checkbox */}
          <button
            onClick={handleToggleChecked}
            className={`flex-shrink-0 mt-0.5 transition-colors ${
              item.is_checked 
                ? 'text-green-500 hover:text-green-600' 
                : 'text-gray-300 hover:text-gray-400 dark:text-gray-600 dark:hover:text-gray-500'
            }`}
          >
            {item.is_checked ? (
              <CheckCircleIconSolid className="w-6 h-6" />
            ) : (
              <CheckCircleIcon className="w-6 h-6" />
            )}
          </button>

          {/* Item Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Item Name */}
                <h4 className={`text-sm font-medium transition-all duration-200 ${
                  item.is_checked 
                    ? 'line-through text-gray-500 dark:text-gray-400' 
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {item.name}
                </h4>

                {/* Quantity */}
                <div className="flex items-center mt-1 space-x-2">
                  {isEditing ? (
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        value={editQuantity}
                        onChange={(e) => setEditQuantity(parseFloat(e.target.value) || 0)}
                        onBlur={handleEditQuantity}
                        onKeyDown={(e) => e.key === 'Enter' && handleEditQuantity()}
                        className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        step="0.1"
                        min="0.1"
                        autoFocus
                      />
                      <span className="text-xs text-gray-500 dark:text-gray-400">{item.unit}</span>
                    </div>
                  ) : (
                    <>
                      {!isShoppingMode && (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleQuantityChange(-0.5)}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                            disabled={item.quantity <= 0.5}
                          >
                            <MinusIcon className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setIsEditing(true)}
                            className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 px-1"
                          >
                            {formatQuantity(item.quantity, item.unit)}
                          </button>
                          <button
                            onClick={() => handleQuantityChange(0.5)}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                          >
                            <PlusIcon className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      {isShoppingMode && (
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {formatQuantity(item.quantity, item.unit)}
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Category Badge */}
                <div className="mt-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category.id)}`}>
                    <span className="mr-1">{item.category.icon}</span>
                    {item.category.name}
                  </span>
                </div>

                {/* Recipe Source */}
                {item.recipe_title && (
                  <div className="mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      From: {item.recipe_title}
                    </span>
                  </div>
                )}

                {/* Notes */}
                {item.notes && (
                  <div className="mt-1">
                    <span className="text-xs text-gray-600 dark:text-gray-400 italic">
                      {item.notes}
                    </span>
                  </div>
                )}
              </div>

              {/* Price and Actions */}
              <div className="flex flex-col items-end space-y-2 ml-3">
                {/* Price */}
                {item.estimated_price && (
                  <span className={`text-sm font-medium ${
                    item.is_checked 
                      ? 'text-gray-400 dark:text-gray-500' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {formatPrice(item.estimated_price)}
                  </span>
                )}

                {/* Action Buttons */}
                {!isShoppingMode && (
                  <div className="flex items-center space-x-1">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(item.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded"
                        title="Edit item"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => onDelete(item.id)}
                      className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded"
                      title="Delete item"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroceryItemCard;
