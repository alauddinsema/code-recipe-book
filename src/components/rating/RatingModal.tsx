import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import MobileRatingInput from './MobileRatingInput';
import { RatingService, type Review } from '../../services/ratings';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipeId: string;
  recipeName: string;
  onRatingSubmitted?: (rating: number, review?: Review) => void;
}

const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  recipeId,
  recipeName,
  onRatingSubmitted
}) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [includeReview, setIncludeReview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [_existingReview, setExistingReview] = useState<Review | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadExistingData();
    }
  }, [isOpen, user, recipeId]);

  const loadExistingData = async () => {
    if (!user) return;

    try {
      // Load existing rating
      const userRating = await RatingService.getUserRating(user.id, recipeId);
      if (userRating) {
        setRating(userRating.rating);
      }

      // Load existing review
      const userReview = await RatingService.getUserReview(user.id, recipeId);
      if (userReview) {
        setExistingReview(userReview);
        setReviewTitle(userReview.title || '');
        setReviewComment(userReview.comment || '');
        setIncludeReview(true);
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Failed to load existing data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || rating === 0) return;

    try {
      setLoading(true);

      // Submit rating
      await RatingService.rateRecipe(user.id, recipeId, rating);

      let reviewData: Review | undefined;

      // Submit review if included
      if (includeReview && reviewComment.trim()) {
        reviewData = await RatingService.addReview(
          user.id,
          recipeId,
          reviewComment.trim(),
          reviewTitle.trim() || undefined,
          rating
        );
      }

      toast.success(isEditing ? 'Rating updated successfully!' : 'Rating submitted successfully!');
      onRatingSubmitted?.(rating, reviewData);
      onClose();
    } catch (error) {
      console.error('Failed to submit rating:', error);
      toast.error('Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setReviewTitle('');
    setReviewComment('');
    setIncludeReview(false);
    setExistingReview(null);
    setIsEditing(false);
    onClose();
  };



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'Update Rating' : 'Rate Recipe'}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Close modal"
            aria-label="Close rating modal"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Recipe Info */}
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              "{recipeName}"
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              How would you rate this recipe?
            </p>
          </div>

          {/* Mobile-Optimized Rating Input */}
          <div className="space-y-3">
            <MobileRatingInput
              rating={rating}
              onRatingChange={setRating}
              size="xl"
              disabled={loading}
              showLabels={true}
            />
          </div>

          {/* Review Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="includeReview"
              checked={includeReview}
              onChange={(e) => setIncludeReview(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="includeReview" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Add a written review
            </label>
          </div>

          {/* Review Form */}
          {includeReview && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Review Title (Optional)
                </label>
                <input
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="e.g., Delicious and easy to make!"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  maxLength={200}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Your Review *
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your thoughts about this recipe..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required={includeReview}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {reviewComment.length}/1000 characters
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={rating === 0 || loading || (includeReview && !reviewComment.trim())}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : isEditing ? 'Update' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RatingModal;
