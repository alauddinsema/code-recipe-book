import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { FavoritesService, type Collection } from '../../services/favorites';
import { ROUTES } from '../../utils/constants';
import { ShareButton } from '../social';
import toast from 'react-hot-toast';

interface CollectionCardProps {
  collection: Collection;
  onUpdate?: (collection: Collection) => void;
  onDelete?: (collectionId: string) => void;
  showActions?: boolean;
  showAuthor?: boolean;
  className?: string;
}

const CollectionCard: React.FC<CollectionCardProps> = ({
  collection,
  onUpdate,
  onDelete,
  showActions = true,
  showAuthor = false,
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(collection.name);
  const [editDescription, setEditDescription] = useState(collection.description || '');
  const [editIsPublic, setEditIsPublic] = useState(collection.is_public);
  const [updating, setUpdating] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName(collection.name);
    setEditDescription(collection.description || '');
    setEditIsPublic(collection.is_public);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!editName.trim()) return;

    try {
      setUpdating(true);
      await FavoritesService.updateCollection(collection.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        is_public: editIsPublic
      });

      const updatedCollection = {
        ...collection,
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        is_public: editIsPublic
      };

      onUpdate?.(updatedCollection);
      setIsEditing(false);
      toast.success('Collection updated successfully');
    } catch (error) {
      console.error('Failed to update collection:', error);
      toast.error('Failed to update collection');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = window.confirm(
      `Are you sure you want to delete "${collection.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await FavoritesService.deleteCollection(collection.id);
      onDelete?.(collection.id);
      toast.success('Collection deleted successfully');
    } catch (error) {
      console.error('Failed to delete collection:', error);
      toast.error('Failed to delete collection');
    }
  };



  const cardContent = (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow p-6 ${className}`}>
      {isEditing ? (
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="w-full text-lg font-semibold bg-transparent border-b-2 border-primary-500 focus:outline-none text-gray-900 dark:text-white"
            placeholder="Collection name"
            required
          />
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            rows={2}
            className="w-full bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            placeholder="Description (optional)"
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
                Public
              </span>
            </label>
          </div>
          <div className="flex space-x-2">
            <button
              type="submit"
              disabled={!editName.trim() || updating}
              className="px-3 py-1 bg-primary-500 hover:bg-primary-600 text-white rounded text-sm disabled:opacity-50"
            >
              {updating ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-3 py-1 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3 flex-1">
              <FolderIcon className="w-8 h-8 text-primary-600 dark:text-primary-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {collection.name}
                </h3>
                <div className="flex items-center space-x-3 mt-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {collection.recipe_count} recipe{collection.recipe_count !== 1 ? 's' : ''}
                  </span>
                  <div className="flex items-center space-x-1">
                    {collection.is_public ? (
                      <>
                        <EyeIcon className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-green-600 dark:text-green-400">Public</span>
                      </>
                    ) : (
                      <>
                        <EyeSlashIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">Private</span>
                      </>
                    )}
                  </div>
                  {showAuthor && (collection as any).author_name && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      by {(collection as any).author_name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {showActions && (
              <div className="flex items-center space-x-1 flex-shrink-0">
                <ShareButton
                  collection={collection}
                  variant="icon"
                  size="sm"
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                />
                <button
                  onClick={handleEdit}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Edit collection"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Delete collection"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          
          {collection.description && (
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
              {collection.description}
            </p>
          )}
          
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <ClockIcon className="w-3 h-3" />
              <span>Created {formatDate(collection.created_at)}</span>
            </div>
            {collection.updated_at !== collection.created_at && (
              <span>Updated {formatDate(collection.updated_at)}</span>
            )}
          </div>
        </>
      )}
    </div>
  );

  // If editing, don't wrap in Link
  if (isEditing) {
    return cardContent;
  }

  // Otherwise, wrap in Link for navigation
  return (
    <Link
      to={`${ROUTES.COLLECTIONS}/${collection.id}`}
      className="block"
    >
      {cardContent}
    </Link>
  );
};

export default CollectionCard;
