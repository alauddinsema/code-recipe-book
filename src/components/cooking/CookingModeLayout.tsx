import React, { useState, useEffect, useRef } from 'react';
import { 
  PlayIcon, 
  PauseIcon, 
  XMarkIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { VoiceService } from '../../services/voiceService';
import { SmartTimer } from './SmartTimer';
import { VoiceIndicator } from './VoiceIndicator';
import { CookingProgress } from './CookingProgress';
import type { Recipe } from '../../types';

interface CookingModeLayoutProps {
  recipe: Recipe;
  onExit: () => void;
}

export const CookingModeLayout: React.FC<CookingModeLayoutProps> = ({
  recipe,
  onExit
}) => {
  const voiceService = useRef<VoiceService | null>(null);
  
  // Cooking state
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Timer state
  const [activeTimers, setActiveTimers] = useState<Array<{
    id: string;
    name: string;
    duration: number;
    remaining: number;
    isActive: boolean;
  }>>([]);

  // Screen wake lock
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);

  // Parse recipe steps - use steps array directly from recipe
  const steps = recipe.steps || [];
  const totalSteps = steps.length;

  useEffect(() => {
    // Initialize voice service
    voiceService.current = new VoiceService();
    
    // Register voice commands
    registerVoiceCommands();
    
    // Request wake lock when cooking mode starts
    requestWakeLock();

    return () => {
      // Cleanup
      if (voiceService.current) {
        voiceService.current.stopListening();
        voiceService.current.stopSpeaking();
      }
      releaseWakeLock();
    };
  }, []);

  useEffect(() => {
    // Update listening state
    if (voiceService.current) {
      setIsListening(voiceService.current.isCurrentlyListening());
    }
  }, [voiceEnabled]);

  /**
   * Register voice command callbacks
   */
  const registerVoiceCommands = () => {
    if (!voiceService.current) return;

    const commands = {
      'NEXT_STEP': () => nextStep(),
      'PREVIOUS_STEP': () => previousStep(),
      'REPEAT_STEP': () => readCurrentStep(),
      'SET_TIMER': (params: { duration: number }) => setTimer(params.duration),
      'STOP_TIMER': () => stopAllTimers(),
      'CANCEL_TIMER': () => stopAllTimers(),
      'PAUSE_TIMER': () => pauseAllTimers(),
      'RESUME_TIMER': () => resumeAllTimers(),
      'CHECK_TIMER': () => announceTimerStatus(),
      'PAUSE_COOKING': () => pauseCooking(),
      'RESUME_COOKING': () => resumeCooking(),
      'START_COOKING': () => startCooking(),
      'STOP_COOKING': () => stopCooking(),
      'EXIT_COOKING': () => exitCookingMode(),
      'SHOW_HELP': () => showVoiceHelp(),
      'READ_INGREDIENTS': () => readIngredients(),
      'READ_COOK_TIME': () => readCookTime(),
      'READ_TOTAL_TIME': () => readTotalTime(),
      'READ_SERVINGS': () => readServings(),
      'INCREASE_VOLUME': () => adjustVolume(0.1),
      'DECREASE_VOLUME': () => adjustVolume(-0.1),
      'DECREASE_SPEED': () => adjustSpeed(-0.1),
      'INCREASE_SPEED': () => adjustSpeed(0.1),
      'STOP_SPEECH': () => stopSpeaking()
    };

    Object.entries(commands).forEach(([action, callback]) => {
      voiceService.current!.registerCommand(action, callback);
    });
  };

  /**
   * Request screen wake lock to prevent screen from turning off
   */
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        const lock = await navigator.wakeLock.request('screen');
        setWakeLock(lock);
        console.log('🔒 Screen wake lock acquired');
      }
    } catch (error) {
      console.warn('Failed to acquire wake lock:', error);
    }
  };

  /**
   * Release screen wake lock
   */
  const releaseWakeLock = () => {
    if (wakeLock) {
      wakeLock.release();
      setWakeLock(null);
      console.log('🔓 Screen wake lock released');
    }
  };

  /**
   * Toggle voice recognition
   */
  const toggleVoice = async () => {
    if (!voiceService.current?.isVoiceSupported()) {
      alert('Voice commands are not supported in this browser');
      return;
    }

    if (voiceEnabled) {
      voiceService.current.stopListening();
      setVoiceEnabled(false);
      setIsListening(false);
    } else {
      const started = await voiceService.current.startListening();
      if (started) {
        setVoiceEnabled(true);
        setIsListening(true);
        speak("Voice commands activated. Say 'help' to hear available commands.");
      }
    }
  };

  /**
   * Speak text using voice service
   */
  const speak = async (text: string) => {
    if (!voiceService.current || !voiceEnabled) return;
    
    try {
      setIsSpeaking(true);
      await voiceService.current.speak(text);
    } catch (error) {
      console.error('Speech error:', error);
    } finally {
      setIsSpeaking(false);
    }
  };

  /**
   * Stop current speech
   */
  const stopSpeaking = () => {
    if (voiceService.current) {
      voiceService.current.stopSpeaking();
      setIsSpeaking(false);
    }
  };

  // Navigation functions
  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      if (voiceEnabled) {
        speak(`Step ${newStep + 1}: ${steps[newStep]}`);
      }
    } else {
      if (voiceEnabled) {
        speak("You've completed all steps! Great job cooking!");
      }
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      if (voiceEnabled) {
        speak(`Step ${newStep + 1}: ${steps[newStep]}`);
      }
    }
  };

  const readCurrentStep = () => {
    if (voiceEnabled && steps[currentStep]) {
      speak(`Step ${currentStep + 1}: ${steps[currentStep]}`);
    }
  };

  // Cooking control functions
  const startCooking = () => {
    setIsActive(true);
    setIsPaused(false);
    if (voiceEnabled) {
      speak(`Starting ${recipe.title}. Step 1: ${steps[0]}`);
    }
  };

  const pauseCooking = () => {
    setIsPaused(true);
    pauseAllTimers();
    if (voiceEnabled) {
      speak("Cooking paused");
    }
  };

  const resumeCooking = () => {
    setIsPaused(false);
    resumeAllTimers();
    if (voiceEnabled) {
      speak("Cooking resumed");
    }
  };

  const stopCooking = () => {
    setIsActive(false);
    setIsPaused(false);
    stopAllTimers();
    if (voiceEnabled) {
      speak("Cooking stopped");
    }
  };

  const exitCookingMode = () => {
    if (voiceService.current) {
      voiceService.current.stopListening();
      voiceService.current.stopSpeaking();
    }
    releaseWakeLock();
    onExit();
  };

  // Timer functions
  const setTimer = (duration: number) => {
    const timerId = `timer-${Date.now()}`;
    const timerName = `Step ${currentStep + 1} Timer`;
    
    const newTimer = {
      id: timerId,
      name: timerName,
      duration,
      remaining: duration,
      isActive: true
    };

    setActiveTimers(prev => [...prev, newTimer]);
    
    if (voiceEnabled) {
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      const timeText = minutes > 0 
        ? `${minutes} minute${minutes !== 1 ? 's' : ''}${seconds > 0 ? ` and ${seconds} seconds` : ''}`
        : `${seconds} seconds`;
      speak(`Timer set for ${timeText}`);
    }
  };

  const stopAllTimers = () => {
    setActiveTimers([]);
    if (voiceEnabled) {
      speak("All timers stopped");
    }
  };

  const pauseAllTimers = () => {
    setActiveTimers(prev => prev.map(timer => ({ ...timer, isActive: false })));
  };

  const resumeAllTimers = () => {
    setActiveTimers(prev => prev.map(timer => ({ ...timer, isActive: true })));
  };

  const announceTimerStatus = () => {
    if (activeTimers.length === 0) {
      speak("No active timers");
      return;
    }

    const status = activeTimers.map(timer => {
      const minutes = Math.floor(timer.remaining / 60);
      const seconds = timer.remaining % 60;
      const timeText = minutes > 0 
        ? `${minutes} minute${minutes !== 1 ? 's' : ''}${seconds > 0 ? ` and ${seconds} seconds` : ''}`
        : `${seconds} seconds`;
      return `${timer.name}: ${timeText} remaining`;
    }).join('. ');

    speak(status);
  };

  // Information functions
  const readIngredients = () => {
    if (voiceEnabled && recipe.ingredients) {
      const ingredientsList = recipe.ingredients.join(', ');
      speak(`Ingredients needed: ${ingredientsList}`);
    }
  };

  const readCookTime = () => {
    if (voiceEnabled && recipe.cook_time) {
      speak(`Cook time is ${recipe.cook_time} minutes`);
    }
  };

  const readTotalTime = () => {
    const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);
    if (voiceEnabled && totalTime > 0) {
      speak(`Total time is ${totalTime} minutes`);
    }
  };

  const readServings = () => {
    if (voiceEnabled && recipe.servings) {
      speak(`This recipe serves ${recipe.servings} people`);
    }
  };

  const showVoiceHelp = () => {
    if (!voiceEnabled) return;
    
    const helpText = `Available commands: 
      Say "next step" or "previous step" to navigate. 
      Say "set timer for 5 minutes" to start a timer. 
      Say "read ingredients" to hear the ingredient list. 
      Say "pause" or "resume" to control cooking. 
      Say "exit cooking mode" to leave cooking mode.`;
    
    speak(helpText);
  };

  // Voice settings adjustment
  const adjustVolume = (delta: number) => {
    if (!voiceService.current) return;
    
    const settings = voiceService.current.getSettings();
    const newVolume = Math.max(0.1, Math.min(1.0, settings.voiceVolume + delta));
    
    voiceService.current.updateSettings({ voiceVolume: newVolume });
    speak(`Volume ${delta > 0 ? 'increased' : 'decreased'}`);
  };

  const adjustSpeed = (delta: number) => {
    if (!voiceService.current) return;
    
    const settings = voiceService.current.getSettings();
    const newSpeed = Math.max(0.5, Math.min(2.0, settings.voiceSpeed + delta));
    
    voiceService.current.updateSettings({ voiceSpeed: newSpeed });
    speak(`Speech speed ${delta > 0 ? 'increased' : 'decreased'}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-lg border-b border-orange-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={exitCookingMode}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                aria-label="Exit cooking mode"
              >
                <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              </button>
              
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {recipe.title}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Smart Cooking Mode
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Voice toggle */}
              <button
                onClick={toggleVoice}
                className={`p-3 rounded-full transition-all duration-200 ${
                  voiceEnabled
                    ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
                aria-label={voiceEnabled ? 'Disable voice commands' : 'Enable voice commands'}
              >
                <MicrophoneIcon className="w-6 h-6" />
              </button>

              {/* Speaker toggle */}
              <button
                onClick={stopSpeaking}
                className={`p-3 rounded-full transition-all duration-200 ${
                  isSpeaking
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
                aria-label="Stop speaking"
              >
                {isSpeaking ? (
                  <SpeakerXMarkIcon className="w-6 h-6" />
                ) : (
                  <SpeakerWaveIcon className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Indicator */}
      {voiceEnabled && (
        <VoiceIndicator 
          isListening={isListening}
          isSpeaking={isSpeaking}
        />
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Progress */}
        <CookingProgress 
          currentStep={currentStep}
          totalSteps={totalSteps}
          isActive={isActive}
        />

        {/* Current Step */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Step {currentStep + 1} of {totalSteps}
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              {steps[currentStep] || 'No instructions available'}
            </p>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            <button
              onClick={previousStep}
              disabled={currentStep === 0}
              className="flex items-center px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5 mr-2" />
              Previous
            </button>

            <button
              onClick={readCurrentStep}
              className="flex items-center px-6 py-3 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            >
              <SpeakerWaveIcon className="w-5 h-5 mr-2" />
              Read Step
            </button>

            <button
              onClick={nextStep}
              disabled={currentStep === totalSteps - 1}
              className="flex items-center px-6 py-3 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-xl hover:bg-orange-200 dark:hover:bg-orange-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRightIcon className="w-5 h-5 ml-2" />
            </button>
          </div>

          {/* Cooking Controls */}
          <div className="flex items-center justify-center space-x-4">
            {!isActive ? (
              <button
                onClick={startCooking}
                className="flex items-center px-8 py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-colors"
              >
                <PlayIcon className="w-6 h-6 mr-2" />
                Start Cooking
              </button>
            ) : (
              <>
                {isPaused ? (
                  <button
                    onClick={resumeCooking}
                    className="flex items-center px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-colors"
                  >
                    <PlayIcon className="w-5 h-5 mr-2" />
                    Resume
                  </button>
                ) : (
                  <button
                    onClick={pauseCooking}
                    className="flex items-center px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-semibold transition-colors"
                  >
                    <PauseIcon className="w-5 h-5 mr-2" />
                    Pause
                  </button>
                )}
                
                <button
                  onClick={stopCooking}
                  className="flex items-center px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 mr-2" />
                  Stop
                </button>
              </>
            )}
          </div>
        </div>

        {/* Smart Timers */}
        {activeTimers.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <ClockIcon className="w-5 h-5 mr-2" />
              Active Timers
            </h3>
            <div className="space-y-3">
              {activeTimers.map((timer) => (
                <SmartTimer
                  key={timer.id}
                  timer={timer}
                  onComplete={() => {
                    setActiveTimers(prev => prev.filter(t => t.id !== timer.id));
                    speak(`${timer.name} completed!`);
                  }}
                  onRemove={() => {
                    setActiveTimers(prev => prev.filter(t => t.id !== timer.id));
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recipe Info */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <InformationCircleIcon className="w-5 h-5 mr-2" />
            Recipe Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ingredients */}
            {recipe.ingredients && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Ingredients</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-start">
                      <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      {ingredient}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recipe Details */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Details</h4>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {recipe.cook_time && (
                  <p><span className="font-medium">Cook Time:</span> {recipe.cook_time} minutes</p>
                )}
                {(recipe.prep_time || recipe.cook_time) && (
                  <p><span className="font-medium">Total Time:</span> {(recipe.prep_time || 0) + (recipe.cook_time || 0)} minutes</p>
                )}
                {recipe.servings && (
                  <p><span className="font-medium">Servings:</span> {recipe.servings}</p>
                )}
                {recipe.difficulty && (
                  <p><span className="font-medium">Difficulty:</span> {recipe.difficulty}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
