import React from 'react';
import { 
  MicrophoneIcon,
  SpeakerWaveIcon,
  SignalIcon
} from '@heroicons/react/24/outline';

interface VoiceIndicatorProps {
  isListening: boolean;
  isSpeaking: boolean;
  className?: string;
}

export const VoiceIndicator: React.FC<VoiceIndicatorProps> = ({
  isListening,
  isSpeaking,
  className = ''
}) => {
  return (
    <div className={`fixed top-20 right-4 z-50 ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center space-x-4">
          {/* Listening Indicator */}
          <div className="flex items-center space-x-2">
            <div className={`
              relative p-2 rounded-full transition-all duration-300
              ${isListening 
                ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
              }
            `}>
              <MicrophoneIcon className="w-5 h-5" />
              
              {/* Listening Animation */}
              {isListening && (
                <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-30" />
              )}
            </div>
            
            <div className="text-sm">
              <div className={`font-medium ${
                isListening 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {isListening ? 'Listening...' : 'Voice Off'}
              </div>
              {isListening && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Say a command
                </div>
              )}
            </div>
          </div>

          {/* Speaking Indicator */}
          <div className="flex items-center space-x-2">
            <div className={`
              relative p-2 rounded-full transition-all duration-300
              ${isSpeaking 
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
              }
            `}>
              <SpeakerWaveIcon className="w-5 h-5" />
              
              {/* Speaking Animation */}
              {isSpeaking && (
                <>
                  <div className="absolute inset-0 rounded-full bg-blue-400 animate-pulse opacity-30" />
                  <div className="absolute -right-1 -top-1">
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="text-sm">
              <div className={`font-medium ${
                isSpeaking 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {isSpeaking ? 'Speaking...' : 'Silent'}
              </div>
              {isSpeaking && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Reading instructions
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Voice Commands Hint */}
        {isListening && !isSpeaking && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <div className="font-medium">Try saying:</div>
              <div>"Next step" • "Set timer for 5 minutes"</div>
              <div>"Read ingredients" • "Help"</div>
            </div>
          </div>
        )}

        {/* Connection Status */}
        <div className="mt-2 flex items-center justify-center">
          <div className="flex items-center space-x-1 text-xs text-gray-400 dark:text-gray-500">
            <SignalIcon className="w-3 h-3" />
            <span>Voice Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Compact Voice Status Badge for smaller spaces
 */
export const VoiceStatusBadge: React.FC<VoiceIndicatorProps> = ({
  isListening,
  isSpeaking,
  className = ''
}) => {
  if (!isListening && !isSpeaking) return null;

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${className}`}>
      {isListening && (
        <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Listening</span>
        </div>
      )}
      
      {isSpeaking && (
        <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
          <div className="flex space-x-0.5">
            <div className="w-1 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
            <div className="w-1 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
          </div>
          <span>Speaking</span>
        </div>
      )}
    </div>
  );
};

/**
 * Voice Wave Animation Component
 */
export const VoiceWaveAnimation: React.FC<{ isActive: boolean; className?: string }> = ({
  isActive,
  className = ''
}) => {
  if (!isActive) return null;

  return (
    <div className={`flex items-center justify-center space-x-1 ${className}`}>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="w-1 bg-current rounded-full animate-pulse"
          style={{
            height: `${Math.random() * 20 + 10}px`,
            animationDelay: `${i * 100}ms`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  );
};
