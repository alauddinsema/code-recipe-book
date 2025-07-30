import React, { useState, useEffect } from 'react';
import { ChatBubbleLeftIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import StarRating from './StarRating';
import { RatingService, type Review } from '../../services/ratings';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface ReviewListProps {
  recipeId: string;
  onReviewUpdate?: () => void;
}

const ReviewList: React.FC<ReviewListProps> = ({ recipeId, onReviewUpdate }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editComment, setEditComment] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [recipeId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const reviewData = await RatingService.getRecipeReviews(recipeId);
      setReviews(reviewData);
    } catch (error) {
      console.error('Failed to load reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleEditStart = (review: Review) => {
    setEditingReview(review.id);
    setEditTitle(review.title || '');
    setEditComment(review.comment);
  };

  const handleEditCancel = () => {
    setEditingReview(null);
    setEditTitle('');
    setEditComment('');
  };

  const handleEditSave = async (reviewId: string) => {
    if (!editComment.trim()) return;

    try {
      setUpdating(true);
      await RatingService.updateReview(reviewId, {
        title: editTitle.trim() || undefined,
        comment: editComment.trim()
      });

      // Update local state
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { ...review, title: editTitle.trim() || undefined, comment: editComment.trim() }
          : review
      ));

      setEditingReview(null);
      setEditTitle('');
      setEditComment('');
      toast.success('Review updated successfully');
      onReviewUpdate?.();
    } catch (error) {
      console.error('Failed to update review:', error);
      toast.error('Failed to update review');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (review: Review) => {
    if (!user || review.user_id !== user.id) return;
    
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      await RatingService.deleteReview(user.id, recipeId);
      setReviews(prev => prev.filter(r => r.id !== review.id));
      toast.success('Review deleted successfully');
      onReviewUpdate?.();
    } catch (error) {
      console.error('Failed to delete review:', error);
      toast.error('Failed to delete review');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <ChatBubbleLeftIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No Reviews Yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Be the first to share your thoughts about this recipe!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Reviews ({reviews.length})
      </h3>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
          >
            {/* Review Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                {/* Avatar */}
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                  {review.reviewer_avatar ? (
                    <img
                      src={review.reviewer_avatar}
                      alt={review.reviewer_name || 'User'}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-primary-600 dark:text-primary-400 font-medium text-sm">
                      {(review.reviewer_name || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* User Info */}
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {review.reviewer_name || 'Anonymous User'}
                  </p>
                  <div className="flex items-center space-x-2">
                    {review.rating && (
                      <StarRating rating={review.rating} size="sm" />
                    )}
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(review.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions for own reviews */}
              {user && review.user_id === user.id && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditStart(review)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Edit review"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(review)}
                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    title="Delete review"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Review Content */}
            {editingReview === review.id ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Review title (optional)"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <textarea
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditSave(review.id)}
                    disabled={!editComment.trim() || updating}
                    className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
                  >
                    {updating ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleEditCancel}
                    className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {review.title && (
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    {review.title}
                  </h4>
                )}
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {review.comment}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewList;
