import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChartBarIcon, 
  StarIcon, 
  TrophyIcon, 
  ChatBubbleLeftIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';
import { 
  SEOHead, 
  Loading, 
  RecipeCard, 
  RatingStatistics, 
  RatingSummary 
} from '../components';
import { RatingService, type Rating, type Review } from '../services/ratings';
import { RecipeService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import type { Recipe } from '../types';
import { ROUTES } from '../utils/constants';
import toast from 'react-hot-toast';

const RatingAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [userRatings, setUserRatings] = useState<(Rating & { recipe: Recipe })[]>([]);
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [topRatedRecipes, setTopRatedRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'ratings' | 'reviews' | 'top-rated'>('overview');

  useEffect(() => {
    if (user) {
      loadAnalyticsData();
    }
  }, [user]);

  const loadAnalyticsData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const [ratings, reviews, topRated] = await Promise.all([
        RatingService.getUserRatings(user.id, 50),
        RatingService.getUserReviews(user.id, 50),
        RatingService.getHighlyRatedRecipes(12)
      ]);

      setUserRatings(ratings);
      setUserReviews(reviews);
      setTopRatedRecipes(topRated);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
      toast.error('Failed to load rating analytics');
    } finally {
      setLoading(false);
    }
  };

  const getAnalyticsStats = () => {
    const totalRatings = userRatings.length;
    const totalReviews = userReviews.length;
    const averageRating = totalRatings > 0 
      ? userRatings.reduce((sum, rating) => sum + rating.rating, 0) / totalRatings 
      : 0;
    
    const ratingDistribution = userRatings.reduce((acc, rating) => {
      acc[rating.rating] = (acc[rating.rating] || 0) + 1;
      return acc;
    }, {} as { [key: number]: number });

    const mostCommonRating = Object.entries(ratingDistribution)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || '0';

    return {
      totalRatings,
      totalReviews,
      averageRating,
      ratingDistribution,
      mostCommonRating: parseInt(mostCommonRating)
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Sign In Required
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please sign in to view your rating analytics.
          </p>
          <Link to={ROUTES.LOGIN} className="btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <Loading size="lg" />
          </div>
        </div>
      </div>
    );
  }

  const stats = getAnalyticsStats();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SEOHead
        title="Rating Analytics"
        description="View your recipe rating history and analytics"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Rating Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your recipe ratings and discover highly-rated recipes
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <StarIcon className="w-8 h-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Ratings
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalRatings}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <ChatBubbleLeftIcon className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Reviews
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalReviews}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <ChartBarIcon className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Average Rating
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.averageRating.toFixed(1)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <TrophyIcon className="w-8 h-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Most Common
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.mostCommonRating} ⭐
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: ChartBarIcon },
              { id: 'ratings', label: 'My Ratings', icon: StarIcon },
              { id: 'reviews', label: 'My Reviews', icon: ChatBubbleLeftIcon },
              { id: 'top-rated', label: 'Top Rated', icon: TrophyIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Rating Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Your Rating Distribution
              </h3>
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = stats.ratingDistribution[rating] || 0;
                  const percentage = stats.totalRatings > 0 ? Math.round((count / stats.totalRatings) * 100) : 0;
                  
                  return (
                    <div key={rating} className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1 w-12">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{rating}</span>
                        <StarIcon className="w-3 h-3 text-yellow-400" />
                      </div>
                      <div className="flex-1 flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-8">
                          {percentage}%
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-6">
                          ({count})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recent Activity
              </h3>
              <div className="space-y-4">
                {userRatings.slice(0, 5).map((rating) => (
                  <div key={rating.id} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`w-4 h-4 ${
                              i < rating.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {rating.recipe.title}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                        <ClockIcon className="w-3 h-3" />
                        <span>{formatDate(rating.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Other tab contents would go here */}
        {activeTab === 'ratings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userRatings.map((rating) => (
              <div key={rating.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`w-4 h-4 ${
                          i < rating.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(rating.created_at)}
                  </span>
                </div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  {rating.recipe.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {rating.recipe.description}
                </p>
                <Link
                  to={`${ROUTES.RECIPE_DETAIL}/${rating.recipe.id}`}
                  className="inline-block mt-3 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  View Recipe →
                </Link>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'top-rated' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {topRatedRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RatingAnalytics;
