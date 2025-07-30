import React, { useState, useEffect, useRef } from 'react';
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  ClockIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface TimerProps {
  initialMinutes: number;
  title: string;
  onComplete?: () => void;
  onStop?: () => void;
  autoStart?: boolean;
  showNotification?: boolean;
  playSound?: boolean;
  className?: string;
}

interface TimerState {
  timeLeft: number;
  totalTime: number;
  isActive: boolean;
  isCompleted: boolean;
}

const Timer: React.FC<TimerProps> = ({
  initialMinutes,
  title,
  onComplete,
  onStop,
  autoStart = false,
  showNotification = true,
  playSound = true,
  className = ''
}) => {
  const [timer, setTimer] = useState<TimerState>({
    timeLeft: initialMinutes * 60,
    totalTime: initialMinutes * 60,
    isActive: autoStart,
    isCompleted: false
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio for timer completion sound
  useEffect(() => {
    if (playSound) {
      // Create a simple beep sound using Web Audio API
      const createBeepSound = () => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 1);
      };

      audioRef.current = { play: createBeepSound } as any;
    }
  }, [playSound]);

  // Timer countdown logic
  useEffect(() => {
    if (timer.isActive && timer.timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimer(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1
        }));
      }, 1000);
    } else if (timer.timeLeft === 0 && !timer.isCompleted) {
      // Timer completed
      setTimer(prev => ({ ...prev, isActive: false, isCompleted: true }));

      // Show notification
      if (showNotification) {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Timer Complete!', {
            body: `${title} timer has finished`,
            icon: '/favicon.ico'
          });
        }
        toast.success(`${title} timer complete! 🎉`, {
          duration: 5000,
          position: 'top-center'
        });
      }

      // Play sound
      if (playSound && audioRef.current) {
        try {
          audioRef.current.play();
        } catch (error) {
          console.log('Could not play timer sound:', error);
        }
      }

      // Call completion callback
      if (onComplete) {
        onComplete();
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timer.isActive, timer.timeLeft, timer.isCompleted, title, showNotification, playSound, onComplete]);

  // Request notification permission on mount
  useEffect(() => {
    if (showNotification && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [showNotification]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    setTimer(prev => ({ ...prev, isActive: !prev.isActive }));
  };

  const resetTimer = () => {
    setTimer({
      timeLeft: initialMinutes * 60,
      totalTime: initialMinutes * 60,
      isActive: false,
      isCompleted: false
    });
  };

  const stopTimer = () => {
    setTimer(prev => ({ ...prev, isActive: false }));
    if (onStop) {
      onStop();
    }
  };

  const getProgressPercentage = (): number => {
    return ((timer.totalTime - timer.timeLeft) / timer.totalTime) * 100;
  };

  const getTimerColor = (): string => {
    if (timer.isCompleted) return 'text-green-600 dark:text-green-400';
    if (timer.timeLeft < 60) return 'text-red-600 dark:text-red-400';
    if (timer.timeLeft < 300) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-blue-600 dark:text-blue-400';
  };

  const getProgressColor = (): string => {
    if (timer.isCompleted) return 'bg-green-500';
    if (timer.timeLeft < 60) return 'bg-red-500';
    if (timer.timeLeft < 300) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Timer Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <ClockIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="font-medium text-gray-900 dark:text-white">{title}</h3>
        </div>
        <div className="flex items-center space-x-1">
          {playSound ? (
            <SpeakerWaveIcon className="w-4 h-4 text-gray-400" />
          ) : (
            <SpeakerXMarkIcon className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Timer Display */}
      <div className="text-center mb-4">
        <div className={`text-3xl font-mono font-bold ${getTimerColor()} ${timer.isActive ? 'animate-pulse' : ''}`}>
          {formatTime(timer.timeLeft)}
        </div>
        {timer.isCompleted && (
          <div className="text-green-600 dark:text-green-400 font-medium mt-1">
            ✅ Complete!
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-1000 ease-linear ${getProgressColor()}`}
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      </div>

      {/* Timer Controls */}
      <div className="flex items-center justify-center space-x-3">
        <button
          onClick={toggleTimer}
          disabled={timer.isCompleted}
          className={`
            p-2 rounded-full transition-colors
            ${timer.isCompleted
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400'
            }
          `}
        >
          {timer.isActive ? (
            <PauseIcon className="w-5 h-5" />
          ) : (
            <PlayIcon className="w-5 h-5" />
          )}
        </button>

        <button
          onClick={() => {
            stopTimer();
            resetTimer();
          }}
          className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 transition-colors"
        >
          <StopIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Timer Info */}
      <div className="mt-3 text-center text-xs text-gray-500 dark:text-gray-400">
        Total: {formatTime(timer.totalTime)}
      </div>
    </div>
  );
};

export default Timer;