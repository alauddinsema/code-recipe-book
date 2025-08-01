import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingCartIcon, 
  ClockIcon, 
  CheckCircleIcon,
  ShareIcon,
  TrashIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import type { GroceryList } from '../../types/grocery';
import { ROUTES } from '../../utils/constants';

interface GroceryListCardProps {
  groceryList: GroceryList;
  onDelete?: (listId: string) => void;
  onShare?: (listId: string) => void;
  onEdit?: (listId: string) => void;
  className?: string;
}

export const GroceryListCard: React.FC<GroceryListCardProps> = ({
  groceryList,
  onDelete,
  onShare,
  onEdit,
  className = ''
}) => {
  const completedItems = groceryList.items.filter(item => item.is_checked).length;
  const totalItems = groceryList.items.length;
  const completionPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  const getStatusIcon = () => {
    switch (groceryList.status) {
      case 'completed':
        return <CheckCircleIconSolid className="w-5 h-5 text-green-500" />;
      case 'shopping':
        return <ShoppingCartIcon className="w-5 h-5 text-blue-500" />;
      case 'active':
        return <ClockIcon className="w-5 h-5 text-orange-500" />;
      default:
        return <PencilIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (groceryList.status) {
      case 'completed':
        return 'Completed';
      case 'shopping':
        return 'Shopping';
      case 'active':
        return 'Ready to Shop';
      default:
        return 'Draft';
    }
  };

  const getStatusColor = () => {
    switch (groceryList.status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'shopping':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'active':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-soft hover:shadow-medium transition-all duration-200 border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <Link 
              to={`${ROUTES.GROCERY_LISTS}/${groceryList.id}`}
              className="block group"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {groceryList.title}
              </h3>
            </Link>
            {groceryList.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                {groceryList.description}
              </p>
            )}
          </div>
          
          {/* Status Badge */}
          <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="ml-1">{getStatusText()}</span>
          </div>
        </div>

        {/* Progress Bar */}
        {totalItems > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>{completedItems} of {totalItems} items</span>
              <span>{Math.round(completionPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Recipe Count */}
        {groceryList.recipe_ids.length > 0 && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
            <span className="inline-flex items-center">
              📝 {groceryList.recipe_ids.length} recipe{groceryList.recipe_ids.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Price Estimate */}
        {groceryList.total_estimated_price && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
            <span className="inline-flex items-center">
              💰 Est. {formatPrice(groceryList.total_estimated_price)}
            </span>
          </div>
        )}

        {/* Sharing Status */}
        {groceryList.is_shared && (
          <div className="flex items-center text-sm text-blue-600 dark:text-blue-400 mb-3">
            <ShareIcon className="w-4 h-4 mr-1" />
            <span>Shared with {groceryList.shared_with?.length || 0} people</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 rounded-b-xl border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {groceryList.completed_at ? (
              <span>Completed {formatDate(groceryList.completed_at)}</span>
            ) : (
              <span>Created {formatDate(groceryList.created_at)}</span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {onEdit && (
              <button
                onClick={() => onEdit(groceryList.id)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                title="Edit list"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            )}
            
            {onShare && (
              <button
                onClick={() => onShare(groceryList.id)}
                className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                title="Share list"
              >
                <ShareIcon className="w-4 h-4" />
              </button>
            )}
            
            {onDelete && (
              <button
                onClick={() => onDelete(groceryList.id)}
                className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                title="Delete list"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}

            {/* Main Action Button */}
            <Link
              to={`${ROUTES.GROCERY_LISTS}/${groceryList.id}`}
              className="inline-flex items-center px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {groceryList.status === 'completed' ? (
                <>
                  <CheckCircleIcon className="w-4 h-4 mr-1" />
                  View
                </>
              ) : groceryList.status === 'shopping' ? (
                <>
                  <ShoppingCartIcon className="w-4 h-4 mr-1" />
                  Continue
                </>
              ) : (
                <>
                  <ShoppingCartIcon className="w-4 h-4 mr-1" />
                  Shop
                </>
              )}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroceryListCard;
