import React from 'react';
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

interface CookingProgressProps {
  currentStep: number;
  totalSteps: number;
  isActive: boolean;
  className?: string;
}

export const CookingProgress: React.FC<CookingProgressProps> = ({
  currentStep,
  totalSteps,
  isActive,
  className = ''
}) => {
  const progressPercentage = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;
  const isCompleted = currentStep >= totalSteps - 1;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`
            p-2 rounded-full transition-colors duration-300
            ${isActive 
              ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }
          `}>
            {isCompleted ? (
              <CheckCircleSolidIcon className="w-6 h-6" />
            ) : (
              <ClockIcon className="w-6 h-6" />
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Cooking Progress
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isCompleted ? 'Recipe completed!' : 
               isActive ? 'Cooking in progress' : 'Ready to start'}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {currentStep + 1}/{totalSteps}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Steps
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Progress</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div 
            className={`
              h-full rounded-full transition-all duration-500 ease-out
              ${isCompleted 
                ? 'bg-gradient-to-r from-green-500 to-green-600' 
                : isActive 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
                  : 'bg-gradient-to-r from-gray-400 to-gray-500'
              }
            `}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between">
        {Array.from({ length: Math.min(totalSteps, 8) }, (_, index) => {
          const stepIndex = Math.floor((index * totalSteps) / Math.min(totalSteps, 8));
          const isCurrentStep = stepIndex === currentStep;
          const isCompletedStep = stepIndex < currentStep;
          const isLastStep = stepIndex === totalSteps - 1 && isCompleted;

          return (
            <div key={stepIndex} className="flex flex-col items-center space-y-2">
              {/* Step Circle */}
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300
                ${isCompletedStep || isLastStep
                  ? 'bg-green-500 text-white' 
                  : isCurrentStep && isActive
                    ? 'bg-blue-500 text-white animate-pulse'
                    : isCurrentStep
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 border-2 border-blue-500'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }
              `}>
                {isCompletedStep || isLastStep ? (
                  <CheckCircleIcon className="w-4 h-4" />
                ) : (
                  stepIndex + 1
                )}
              </div>

              {/* Step Label */}
              <div className={`
                text-xs text-center transition-colors duration-300
                ${isCurrentStep 
                  ? 'text-blue-600 dark:text-blue-400 font-medium' 
                  : isCompletedStep || isLastStep
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-500 dark:text-gray-400'
                }
              `}>
                Step {stepIndex + 1}
              </div>
            </div>
          );
        })}

        {/* Show ellipsis if there are more than 8 steps */}
        {totalSteps > 8 && (
          <div className="flex flex-col items-center space-y-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-gray-500 dark:text-gray-400 text-xs">...</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              +{totalSteps - 8}
            </div>
          </div>
        )}
      </div>

      {/* Status Message */}
      <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
        <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
          {isCompleted ? (
            <span className="text-green-600 dark:text-green-400 font-medium">
              🎉 Congratulations! You've completed the recipe!
            </span>
          ) : isActive ? (
            <span>
              Currently on step {currentStep + 1}. 
              {totalSteps - currentStep - 1 > 0 && (
                <> {totalSteps - currentStep - 1} step{totalSteps - currentStep - 1 !== 1 ? 's' : ''} remaining.</>
              )}
            </span>
          ) : (
            <span>Ready to start cooking? Click "Start Cooking" to begin!</span>
          )}
        </div>
      </div>
    </div>
  );
};
