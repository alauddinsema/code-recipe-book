import React, { useState } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Timer from '../common/Timer';

interface TimerPanelProps {
  prepTime?: number | null;
  cookTime?: number | null;
  recipeTitle: string;
}

interface CustomTimer {
  id: string;
  name: string;
  minutes: number;
}

const TimerPanel: React.FC<TimerPanelProps> = ({ prepTime, cookTime }) => {
  const [customTimers, setCustomTimers] = useState<CustomTimer[]>([]);
  const [showAddTimer, setShowAddTimer] = useState(false);
  const [newTimerName, setNewTimerName] = useState('');
  const [newTimerMinutes, setNewTimerMinutes] = useState(5);

  const addCustomTimer = () => {
    if (newTimerName.trim()) {
      const newTimer: CustomTimer = {
        id: Date.now().toString(),
        name: newTimerName.trim(),
        minutes: newTimerMinutes
      };
      setCustomTimers(prev => [...prev, newTimer]);
      setNewTimerName('');
      setNewTimerMinutes(5);
      setShowAddTimer(false);
    }
  };

  const removeCustomTimer = (id: string) => {
    setCustomTimers(prev => prev.filter(timer => timer.id !== id));
  };

  const formatTime = (minutes: number | null) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const hasAnyTimers = prepTime || cookTime || customTimers.length > 0;

  if (!hasAnyTimers && !showAddTimer) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Cooking Timers
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Add custom timers to help with your cooking
          </p>
          <button
            onClick={() => setShowAddTimer(true)}
            className="btn-primary inline-flex items-center space-x-2"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Add Timer</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Cooking Timers
        </h3>
        <button
          onClick={() => setShowAddTimer(true)}
          className="btn-secondary text-sm inline-flex items-center space-x-1"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Add Timer</span>
        </button>
      </div>

      {/* Add Timer Form */}
      {showAddTimer && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 dark:text-white">Add Custom Timer</h4>
            <button
              onClick={() => setShowAddTimer(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Timer Name
              </label>
              <input
                type="text"
                value={newTimerName}
                onChange={(e) => setNewTimerName(e.target.value)}
                placeholder="e.g., Marinate chicken, Rest dough..."
                className="input-field"
                onKeyPress={(e) => e.key === 'Enter' && addCustomTimer()}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={newTimerMinutes}
                onChange={(e) => setNewTimerMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                max="480"
                className="input-field"
              />
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={addCustomTimer}
                disabled={!newTimerName.trim()}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Timer
              </button>
              <button
                onClick={() => setShowAddTimer(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recipe Timers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {prepTime && (
          <Timer
            initialMinutes={prepTime}
            title={`Prep Time (${formatTime(prepTime)})`}
            showNotification={true}
            playSound={true}
          />
        )}
        
        {cookTime && (
          <Timer
            initialMinutes={cookTime}
            title={`Cook Time (${formatTime(cookTime)})`}
            showNotification={true}
            playSound={true}
          />
        )}
      </div>

      {/* Custom Timers */}
      {customTimers.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 dark:text-white">Custom Timers</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customTimers.map((timer) => (
              <div key={timer.id} className="relative">
                <Timer
                  initialMinutes={timer.minutes}
                  title={timer.name}
                  showNotification={true}
                  playSound={true}
                  onStop={() => removeCustomTimer(timer.id)}
                />
                <button
                  onClick={() => removeCustomTimer(timer.id)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
                  title="Remove timer"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Timer Presets */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Quick Timers</h4>
        <div className="flex flex-wrap gap-2">
          {[
            { name: '5 min', minutes: 5 },
            { name: '10 min', minutes: 10 },
            { name: '15 min', minutes: 15 },
            { name: '30 min', minutes: 30 },
            { name: '1 hour', minutes: 60 }
          ].map((preset) => (
            <button
              key={preset.name}
              onClick={() => {
                const newTimer: CustomTimer = {
                  id: Date.now().toString(),
                  name: `${preset.name} Timer`,
                  minutes: preset.minutes
                };
                setCustomTimers(prev => [...prev, newTimer]);
              }}
              className="px-3 py-1 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-full hover:bg-gray-50 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 transition-colors"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimerPanel;
