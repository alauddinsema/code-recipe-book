import React, { useState } from 'react';
import { 
  PlayIcon,
  MicrophoneIcon,
  ClockIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface CookingModeButtonProps {
  onStartCooking: () => void;
  disabled?: boolean;
  className?: string;
}

export const CookingModeButton: React.FC<CookingModeButtonProps> = ({
  onStartCooking,
  disabled = false,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (!disabled) {
      onStartCooking();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative group w-full sm:w-auto
        bg-gradient-to-r from-orange-500 to-red-500 
        hover:from-orange-600 hover:to-red-600
        disabled:from-gray-400 disabled:to-gray-500
        text-white font-semibold
        px-8 py-4 rounded-2xl
        shadow-lg hover:shadow-xl
        transform hover:scale-105
        transition-all duration-300
        disabled:cursor-not-allowed disabled:transform-none
        ${className}
      `}
    >
      {/* Background Animation */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-400 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
      
      {/* Content */}
      <div className="relative flex items-center justify-center space-x-3">
        {/* Main Icon */}
        <div className="relative">
          <PlayIcon className="w-6 h-6" />
          {isHovered && (
            <div className="absolute inset-0 animate-ping">
              <PlayIcon className="w-6 h-6 opacity-30" />
            </div>
          )}
        </div>

        {/* Text */}
        <span className="text-lg">Start Smart Cooking</span>

        {/* Feature Icons */}
        <div className="hidden sm:flex items-center space-x-2 ml-2">
          <div className="w-px h-6 bg-white/30" />
          
          <div className="flex items-center space-x-1 text-white/80">
            <MicrophoneIcon className="w-4 h-4" />
            <ClockIcon className="w-4 h-4" />
            <SparklesIcon className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Shine Effect */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden">
        <div className="absolute -top-2 -left-2 w-4 h-4 bg-white/20 rounded-full animate-ping" 
             style={{ animationDelay: '0s', animationDuration: '3s' }} />
        <div className="absolute top-1/2 -right-2 w-3 h-3 bg-white/15 rounded-full animate-ping" 
             style={{ animationDelay: '1s', animationDuration: '3s' }} />
        <div className="absolute -bottom-1 left-1/3 w-2 h-2 bg-white/10 rounded-full animate-ping" 
             style={{ animationDelay: '2s', animationDuration: '3s' }} />
      </div>
    </button>
  );
};

/**
 * Compact Cooking Mode Button for smaller spaces
 */
export const CompactCookingModeButton: React.FC<CookingModeButtonProps> = ({
  onStartCooking,
  disabled = false,
  className = ''
}) => {
  return (
    <button
      onClick={() => !disabled && onStartCooking()}
      disabled={disabled}
      className={`
        inline-flex items-center space-x-2
        bg-gradient-to-r from-orange-500 to-red-500 
        hover:from-orange-600 hover:to-red-600
        disabled:from-gray-400 disabled:to-gray-500
        text-white font-medium
        px-4 py-2 rounded-lg
        shadow-md hover:shadow-lg
        transform hover:scale-105
        transition-all duration-200
        disabled:cursor-not-allowed disabled:transform-none
        ${className}
      `}
    >
      <PlayIcon className="w-4 h-4" />
      <span>Smart Cook</span>
    </button>
  );
};

/**
 * Floating Action Button for Cooking Mode
 */
export const CookingModeFAB: React.FC<CookingModeButtonProps> = ({
  onStartCooking,
  disabled = false,
  className = ''
}) => {
  return (
    <button
      onClick={() => !disabled && onStartCooking()}
      disabled={disabled}
      className={`
        fixed bottom-20 right-4 z-40
        w-16 h-16 rounded-full
        bg-gradient-to-r from-orange-500 to-red-500 
        hover:from-orange-600 hover:to-red-600
        disabled:from-gray-400 disabled:to-gray-500
        text-white
        shadow-2xl hover:shadow-3xl
        transform hover:scale-110
        transition-all duration-300
        disabled:cursor-not-allowed disabled:transform-none
        ${className}
      `}
    >
      <div className="flex items-center justify-center">
        <PlayIcon className="w-8 h-8" />
      </div>
      
      {/* Pulse Animation */}
      {!disabled && (
        <div className="absolute inset-0 rounded-full bg-orange-400 animate-ping opacity-20" />
      )}
    </button>
  );
};
