import React, { useState, useEffect } from 'react';
import { 
  PlayIcon, 
  PauseIcon, 
  XMarkIcon,
  ClockIcon,
  BellIcon
} from '@heroicons/react/24/outline';

interface Timer {
  id: string;
  name: string;
  duration: number;
  remaining: number;
  isActive: boolean;
}

interface SmartTimerProps {
  timer: Timer;
  onComplete: () => void;
  onRemove: () => void;
}

export const SmartTimer: React.FC<SmartTimerProps> = ({
  timer,
  onComplete,
  onRemove
}) => {
  const [localTimer, setLocalTimer] = useState(timer);
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    setLocalTimer(timer);
  }, [timer]);

  useEffect(() => {
    if (!localTimer.isActive || localTimer.remaining <= 0) return;

    const interval = setInterval(() => {
      setLocalTimer(prev => {
        const newRemaining = prev.remaining - 1;
        
        if (newRemaining <= 0) {
          // Timer completed
          setIsBlinking(true);
          playNotificationSound();
          onComplete();
          return { ...prev, remaining: 0, isActive: false };
        }
        
        // Warning at 10 seconds
        if (newRemaining === 10) {
          setIsBlinking(true);
          setTimeout(() => setIsBlinking(false), 3000);
        }
        
        return { ...prev, remaining: newRemaining };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [localTimer.isActive, localTimer.remaining, onComplete]);

  /**
   * Play notification sound when timer completes
   */
  const playNotificationSound = () => {
    try {
      // Create audio context for notification sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create a simple beep sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
      
      // Play multiple beeps
      setTimeout(() => {
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();
        
        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);
        
        oscillator2.frequency.setValueAtTime(1000, audioContext.currentTime);
        oscillator2.type = 'sine';
        
        gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator2.start(audioContext.currentTime);
        oscillator2.stop(audioContext.currentTime + 0.5);
      }, 600);
      
    } catch (error) {
      console.warn('Could not play notification sound:', error);
      
      // Fallback: try to use system notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Timer Complete!', {
          body: `${localTimer.name} has finished`,
          icon: '/favicon.ico',
          tag: 'cooking-timer'
        });
      }
    }
  };

  /**
   * Toggle timer active state
   */
  const toggleTimer = () => {
    setLocalTimer(prev => ({ ...prev, isActive: !prev.isActive }));
  };

  /**
   * Format time for display
   */
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Calculate progress percentage
   */
  const progressPercentage = ((localTimer.duration - localTimer.remaining) / localTimer.duration) * 100;

  /**
   * Get timer status color
   */
  const getStatusColor = () => {
    if (localTimer.remaining === 0) return 'text-green-600 dark:text-green-400';
    if (localTimer.remaining <= 10) return 'text-red-600 dark:text-red-400';
    if (localTimer.remaining <= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-blue-600 dark:text-blue-400';
  };

  /**
   * Get timer background color
   */
  const getBackgroundColor = () => {
    if (localTimer.remaining === 0) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    if (localTimer.remaining <= 10) return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    if (localTimer.remaining <= 60) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
  };

  return (
    <div className={`
      relative p-4 rounded-xl border-2 transition-all duration-300
      ${getBackgroundColor()}
      ${isBlinking ? 'animate-pulse' : ''}
    `}>
      {/* Timer Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <ClockIcon className={`w-5 h-5 ${getStatusColor()}`} />
          <h4 className="font-medium text-gray-900 dark:text-white">
            {localTimer.name}
          </h4>
        </div>
        
        <button
          onClick={onRemove}
          className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Remove timer"
        >
          <XMarkIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Timer Display */}
      <div className="text-center mb-3">
        <div className={`text-3xl font-bold font-mono ${getStatusColor()}`}>
          {formatTime(localTimer.remaining)}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {localTimer.remaining === 0 ? 'Completed!' : 
           localTimer.isActive ? 'Running' : 'Paused'}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-1000 ${
              localTimer.remaining === 0 ? 'bg-green-500' :
              localTimer.remaining <= 10 ? 'bg-red-500' :
              localTimer.remaining <= 60 ? 'bg-yellow-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>0:00</span>
          <span>{formatTime(localTimer.duration)}</span>
        </div>
      </div>

      {/* Timer Controls */}
      <div className="flex items-center justify-center space-x-2">
        {localTimer.remaining > 0 && (
          <button
            onClick={toggleTimer}
            className={`
              flex items-center px-3 py-2 rounded-lg font-medium transition-colors
              ${localTimer.isActive 
                ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-800'
                : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800'
              }
            `}
          >
            {localTimer.isActive ? (
              <>
                <PauseIcon className="w-4 h-4 mr-1" />
                Pause
              </>
            ) : (
              <>
                <PlayIcon className="w-4 h-4 mr-1" />
                Resume
              </>
            )}
          </button>
        )}
        
        {localTimer.remaining === 0 && (
          <div className="flex items-center text-green-600 dark:text-green-400 font-medium">
            <BellIcon className="w-4 h-4 mr-1" />
            Timer Complete!
          </div>
        )}
      </div>

      {/* Completion Animation */}
      {localTimer.remaining === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-green-500/10 rounded-xl">
          <div className="text-green-600 dark:text-green-400 animate-bounce">
            <BellIcon className="w-8 h-8" />
          </div>
        </div>
      )}
    </div>
  );
};
