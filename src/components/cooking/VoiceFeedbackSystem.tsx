import React, { useState, useEffect } from 'react';
import { 
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { VoiceService, type VoiceSettings } from '../../services/voiceService';

interface VoiceFeedbackSystemProps {
  voiceService: VoiceService | null;
  isEnabled: boolean;
  onToggle: () => void;
  className?: string;
}

export const VoiceFeedbackSystem: React.FC<VoiceFeedbackSystemProps> = ({
  voiceService,
  isEnabled,
  onToggle,
  className = ''
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<VoiceSettings | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [testMessage, setTestMessage] = useState('');
  const [isTestSpeaking, setIsTestSpeaking] = useState(false);

  useEffect(() => {
    if (voiceService) {
      setSettings(voiceService.getSettings());
      setAvailableVoices(voiceService.getAvailableVoices());
    }
  }, [voiceService]);

  /**
   * Update voice settings
   */
  const updateSettings = (newSettings: Partial<VoiceSettings>) => {
    if (!voiceService || !settings) return;

    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    voiceService.updateSettings(updatedSettings);
  };

  /**
   * Test voice with current settings
   */
  const testVoice = async () => {
    if (!voiceService || !testMessage.trim()) return;

    try {
      setIsTestSpeaking(true);
      await voiceService.speak(testMessage);
    } catch (error) {
      console.error('Voice test failed:', error);
    } finally {
      setIsTestSpeaking(false);
    }
  };

  /**
   * Reset settings to defaults
   */
  const resetSettings = () => {
    const defaultSettings: VoiceSettings = {
      language: 'en-US',
      voiceSpeed: 1.0,
      voicePitch: 1.0,
      voiceVolume: 1.0,
      enableContinuousListening: true,
      noiseReduction: true
    };

    updateSettings(defaultSettings);
  };

  if (!voiceService || !settings) {
    return (
      <div className={`p-4 bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}>
        <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
          <ExclamationTriangleIcon className="w-5 h-5" />
          <span>Voice services not available</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`
              p-2 rounded-full transition-colors duration-200
              ${isEnabled 
                ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }
            `}>
              {isEnabled ? (
                <SpeakerWaveIcon className="w-5 h-5" />
              ) : (
                <SpeakerXMarkIcon className="w-5 h-5" />
              )}
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Voice Feedback
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isEnabled ? 'Voice commands active' : 'Voice commands disabled'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Voice settings"
            >
              <Cog6ToothIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
            
            <button
              onClick={onToggle}
              className={`
                px-4 py-2 rounded-lg font-medium transition-colors
                ${isEnabled
                  ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800'
                  : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800'
                }
              `}
            >
              {isEnabled ? 'Disable' : 'Enable'}
            </button>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 space-y-6">
          {/* Voice Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Voice
            </label>
            <select
              value={settings.preferredVoice || ''}
              onChange={(e) => updateSettings({ preferredVoice: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Select voice for speech synthesis"
            >
              <option value="">Default Voice</option>
              {availableVoices.map((voice, index) => (
                <option key={index} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>

          {/* Speed Control */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Speech Speed: {settings.voiceSpeed.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={settings.voiceSpeed}
              onChange={(e) => updateSettings({ voiceSpeed: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              aria-label="Speech speed control"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>Slow</span>
              <span>Normal</span>
              <span>Fast</span>
            </div>
          </div>

          {/* Volume Control */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Volume: {Math.round(settings.voiceVolume * 100)}%
            </label>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={settings.voiceVolume}
              onChange={(e) => updateSettings({ voiceVolume: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              aria-label="Voice volume control"
            />
          </div>

          {/* Pitch Control */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Pitch: {settings.voicePitch.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={settings.voicePitch}
              onChange={(e) => updateSettings({ voicePitch: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              aria-label="Voice pitch control"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>Low</span>
              <span>Normal</span>
              <span>High</span>
            </div>
          </div>

          {/* Language Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Language
            </label>
            <select
              value={settings.language}
              onChange={(e) => updateSettings({ language: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Select language for voice recognition"
            >
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="es-ES">Spanish</option>
              <option value="fr-FR">French</option>
              <option value="de-DE">German</option>
              <option value="it-IT">Italian</option>
              <option value="pt-BR">Portuguese (Brazil)</option>
              <option value="ru-RU">Russian</option>
              <option value="ja-JP">Japanese</option>
              <option value="ko-KR">Korean</option>
              <option value="zh-CN">Chinese (Simplified)</option>
            </select>
          </div>

          {/* Advanced Options */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-white">Advanced Options</h4>
            
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.enableContinuousListening}
                onChange={(e) => updateSettings({ enableContinuousListening: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Continuous listening
              </span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.noiseReduction}
                onChange={(e) => updateSettings({ noiseReduction: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Noise reduction
              </span>
            </label>
          </div>

          {/* Voice Test */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Test Voice
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Enter text to test voice..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={testVoice}
                disabled={!testMessage.trim() || isTestSpeaking}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
              >
                {isTestSpeaking ? 'Speaking...' : 'Test'}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={resetSettings}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors"
            >
              Reset to Defaults
            </button>
            
            <div className="flex items-center text-green-600 dark:text-green-400">
              <CheckCircleIcon className="w-4 h-4 mr-1" />
              <span className="text-sm">Settings saved automatically</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
