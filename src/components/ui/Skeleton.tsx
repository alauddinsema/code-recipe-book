import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse'
}) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-lg'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse', // Could be enhanced with wave animation
    none: ''
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
};

// Recipe Card Skeleton
export const RecipeCardSkeleton: React.FC = () => {
  return (
    <div className="card">
      {/* Image Skeleton */}
      <Skeleton 
        variant="rectangular" 
        className="h-48 rounded-t-lg" 
      />
      
      {/* Content Skeleton */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <Skeleton className="h-6 w-3/4" />
        
        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        
        {/* Meta info */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-4">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton variant="circular" className="w-6 h-6" />
        </div>
        
        {/* Tags */}
        <div className="flex space-x-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        
        {/* Button */}
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
};

// Recipe Detail Skeleton
export const RecipeDetailSkeleton: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-8 w-2/3 mb-2 sm:mb-0" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
      </div>

      {/* Image */}
      <Skeleton variant="rounded" className="h-64 w-full" />

      {/* Meta info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="text-center space-y-2">
            <Skeleton className="h-4 w-16 mx-auto" />
            <Skeleton className="h-6 w-12 mx-auto" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Ingredients */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton variant="circular" className="w-4 h-4" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-4/5" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timer */}
          <div className="space-y-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton variant="rounded" className="h-32 w-full" />
          </div>

          {/* Code Snippet */}
          <div className="space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton variant="rounded" className="h-40 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Recipe List Skeleton
export const RecipeListSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(count)].map((_, index) => (
        <RecipeCardSkeleton key={index} />
      ))}
    </div>
  );
};

// Search Results Skeleton
export const SearchResultsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Search header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-8 w-32" />
      </div>
      
      {/* Results */}
      <RecipeListSkeleton count={6} />
    </div>
  );
};

// Profile Skeleton
export const ProfileSkeleton: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <div className="flex items-center space-x-4 mb-4 sm:mb-0">
            <Skeleton variant="circular" className="w-16 h-16" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="flex space-x-3">
            <Skeleton className="h-10 w-24 rounded-lg" />
            <Skeleton className="h-10 w-20 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
            <Skeleton className="h-8 w-16 mx-auto mb-2" />
            <Skeleton className="h-4 w-24 mx-auto" />
          </div>
        ))}
      </div>

      {/* Recipes */}
      <RecipeListSkeleton count={6} />
    </div>
  );
};

export default Skeleton;
