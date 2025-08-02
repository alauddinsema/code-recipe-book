import React, { useState, useEffect } from 'react';
import { 
  MicrophoneIcon, 
  SparklesIcon,
  SpeakerWaveIcon 
} from '@heroicons/react/24/outline';
import AIVoiceAssistant from './AIVoiceAssistant';
import { aiVoiceService } from '../../services/aiVoiceService';

interface VoiceAssistantFABProps {
  cookingContext?: any;
  className?: string;
}

const VoiceAssistantFAB: React.FC<VoiceAssistantFABProps> = ({ 
  cookingContext,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  useEffect(() => {
    // Check if voice is supported
    setIsSupported(aiVoiceService.isVoiceSupported());

    // Listen for voice state changes
    const checkVoiceState = () => {
      setIsListening(aiVoiceService.getIsListening());
      setIsSpeaking(aiVoiceService.getIsSpeaking());
    };

    const interval = setInterval(checkVoiceState, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Trigger pulse animation when voice state changes
    if (isListening || isSpeaking) {
      setPulseAnimation(true);
      const timer = setTimeout(() => setPulseAnimation(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isListening, isSpeaking]);

  const handleFABClick = () => {
    if (!isSupported) {
      alert('Voice commands are not supported in this browser');
      return;
    }
    setIsOpen(true);
  };

  const getButtonState = () => {
    if (isSpeaking) return 'speaking';
    if (isListening) return 'listening';
    return 'idle';
  };

  const getButtonStyles = () => {
    const state = getButtonState();
    
    const baseStyles = `
      fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full shadow-lg
      flex items-center justify-center transition-all duration-300
      transform hover:scale-110 active:scale-95
    `;

    switch (state) {
      case 'listening':
        return `${baseStyles} bg-red-500 hover:bg-red-600 text-white animate-pulse`;
      case 'speaking':
        return `${baseStyles} bg-blue-500 hover:bg-blue-600 text-white`;
      default:
        return `${baseStyles} bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white`;
    }
  };

  const getIcon = () => {
    const state = getButtonState();
    const iconClass = "w-6 h-6";

    switch (state) {
      case 'speaking':
        return <SpeakerWaveIcon className={`${iconClass} animate-pulse`} />;
      case 'listening':
        return <MicrophoneIcon className={iconClass} />;
      default:
        return (
          <div className="relative">
            <SparklesIcon className={iconClass} />
            {isSupported && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping opacity-75" />
            )}
          </div>
        );
    }
  };

  if (!isSupported) {
    return null; // Don't show FAB if voice is not supported
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={handleFABClick}
        className={`${getButtonStyles()} ${className} ${pulseAnimation ? 'animate-bounce' : ''}`}
        aria-label="Open AI Voice Assistant"
      >
        {getIcon()}
        
        {/* Ripple effect for active states */}
        {(isListening || isSpeaking) && (
          <div className="absolute inset-0 rounded-full bg-white opacity-20 animate-ping" />
        )}
      </button>

      {/* Status Indicator */}
      {(isListening || isSpeaking) && (
        <div className="fixed bottom-36 right-4 z-30 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm font-medium">
          {isSpeaking ? (
            <div className="flex items-center space-x-2">
              <SpeakerWaveIcon className="w-4 h-4 animate-pulse" />
              <span>AI Speaking...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <MicrophoneIcon className="w-4 h-4" />
              <span>Listening...</span>
            </div>
          )}
        </div>
      )}

      {/* Voice Assistant Modal */}
      <AIVoiceAssistant
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        cookingContext={cookingContext}
      />
    </>
  );
};

export default VoiceAssistantFAB;
