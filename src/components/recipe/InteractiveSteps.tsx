import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, ClockIcon, PlayIcon, PauseIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';

interface InteractiveStepsProps {
  steps: string[];
  recipeId: string;
  prepTime?: number | null;
  cookTime?: number | null;
}

interface StepProgress {
  [stepIndex: number]: boolean;
}

interface Timer {
  isActive: boolean;
  timeLeft: number;
  totalTime: number;
  stepIndex: number;
}

const InteractiveSteps: React.FC<InteractiveStepsProps> = ({
  steps,
  recipeId
}) => {
  const [completedSteps, setCompletedSteps] = useState<StepProgress>({});
  const [timer, setTimer] = useState<Timer | null>(null);
  const [showCookingMode, setShowCookingMode] = useState(false);

  // Load progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem(`recipe-progress-${recipeId}`);
    if (savedProgress) {
      setCompletedSteps(JSON.parse(savedProgress));
    }
  }, [recipeId]);

  // Save progress to localStorage
  useEffect(() => {
    localStorage.setItem(`recipe-progress-${recipeId}`, JSON.stringify(completedSteps));
  }, [completedSteps, recipeId]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer && timer.isActive && timer.timeLeft > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev ? { ...prev, timeLeft: prev.timeLeft - 1 } : null);
      }, 1000);
    } else if (timer && timer.timeLeft === 0) {
      // Timer finished - show notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Timer finished!', {
          body: `Step ${timer.stepIndex + 1} timer completed`,
          icon: '/favicon.ico'
        });
      }
      setTimer(null);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const toggleStep = (stepIndex: number) => {
    setCompletedSteps(prev => ({
      ...prev,
      [stepIndex]: !prev[stepIndex]
    }));
  };

  const resetProgress = () => {
    setCompletedSteps({});
    setTimer(null);
  };

  const startTimer = (minutes: number, stepIndex: number) => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    setTimer({
      isActive: true,
      timeLeft: minutes * 60,
      totalTime: minutes * 60,
      stepIndex
    });
  };

  const toggleTimer = () => {
    if (timer) {
      setTimer(prev => prev ? { ...prev, isActive: !prev.isActive } : null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const progressPercentage = (completedCount / steps.length) * 100;

  const extractTimeFromStep = (step: string): number | null => {
    const timeRegex = /(\d+)\s*(minute|min|hour|hr)s?/i;
    const match = step.match(timeRegex);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      return unit.startsWith('hour') || unit.startsWith('hr') ? value * 60 : value;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Instructions
          </h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowCookingMode(!showCookingMode)}
              className="btn-secondary text-sm"
            >
              {showCookingMode ? 'Exit Cooking Mode' : 'Cooking Mode'}
            </button>
            <button
              onClick={resetProgress}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Reset Progress
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Progress: {completedCount} of {steps.length} steps</span>
            <span>{Math.round(progressPercentage)}% complete</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Timer Display */}
        {timer && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ClockIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-blue-900 dark:text-blue-100">
                  Step {timer.stepIndex + 1} Timer
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-2xl font-mono font-bold text-blue-900 dark:text-blue-100">
                  {formatTime(timer.timeLeft)}
                </span>
                <button
                  onClick={toggleTimer}
                  className="p-2 rounded-full bg-blue-100 dark:bg-blue-800 hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
                >
                  {timer.isActive ? (
                    <PauseIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <PlayIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  )}
                </button>
              </div>
            </div>
            <div className="mt-2 w-full bg-blue-200 dark:bg-blue-800 rounded-full h-1">
              <div
                className="bg-blue-600 dark:bg-blue-400 h-1 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${((timer.totalTime - timer.timeLeft) / timer.totalTime) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Steps List */}
      <div className={`space-y-4 ${showCookingMode ? 'cooking-mode' : ''}`}>
        {steps.map((step, index) => {
          const isCompleted = completedSteps[index];
          const stepTime = extractTimeFromStep(step);
          
          return (
            <div
              key={index}
              className={`
                bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border transition-all duration-200
                ${isCompleted 
                  ? 'border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
                ${showCookingMode ? 'text-lg' : ''}
              `}
            >
              <div className="flex items-start space-x-4">
                {/* Checkbox */}
                <button
                  onClick={() => toggleStep(index)}
                  className="flex-shrink-0 mt-1"
                >
                  {isCompleted ? (
                    <CheckCircleIconSolid className="w-6 h-6 text-green-600 dark:text-green-400" />
                  ) : (
                    <CheckCircleIcon className="w-6 h-6 text-gray-400 hover:text-green-500 transition-colors" />
                  )}
                </button>

                {/* Step Number */}
                <span className={`
                  flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mt-0.5
                  ${isCompleted 
                    ? 'bg-green-500 text-white' 
                    : 'bg-primary-500 text-white'
                  }
                `}>
                  {index + 1}
                </span>

                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <p className={`
                    ${isCompleted 
                      ? 'text-green-800 dark:text-green-200 line-through' 
                      : 'text-gray-700 dark:text-gray-300'
                    }
                    ${showCookingMode ? 'text-lg leading-relaxed' : ''}
                  `}>
                    {step}
                  </p>

                  {/* Timer Button */}
                  {stepTime && (
                    <button
                      onClick={() => startTimer(stepTime, index)}
                      className="mt-2 inline-flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      <ClockIcon className="w-4 h-4" />
                      <span>Start {stepTime} min timer</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion Message */}
      {completedCount === steps.length && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-6 text-center">
          <CheckCircleIconSolid className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
            Recipe Complete! 🎉
          </h3>
          <p className="text-green-700 dark:text-green-300">
            Congratulations! You've completed all the steps. Enjoy your meal!
          </p>
        </div>
      )}
    </div>
  );
};

export default InteractiveSteps;
