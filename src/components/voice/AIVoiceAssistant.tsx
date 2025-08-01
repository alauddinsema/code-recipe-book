import React, { useState, useEffect, useRef } from 'react';
import { 
  MicrophoneIcon, 
  SpeakerWaveIcon, 
  SparklesIcon,
  Cog6ToothIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { aiVoiceService } from '../../services/aiVoiceService';

interface AIVoiceAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  cookingContext?: any;
}

interface VoiceMessage {
  id: string;
  type: 'user' | 'ai';
  text: string;
  timestamp: Date;
  confidence?: number;
}

const AIVoiceAssistant: React.FC<AIVoiceAssistantProps> = ({ 
  isOpen, 
  onClose, 
  cookingContext 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAIMode, setIsAIMode] = useState(true);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [voiceLevel, setVoiceLevel] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice visualization
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (cookingContext) {
      aiVoiceService.updateCookingContext(cookingContext);
    }
  }, [cookingContext]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Initialize audio visualization
   */
  const initializeAudioVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const context = new AudioContext();
      const analyserNode = context.createAnalyser();
      const source = context.createMediaStreamSource(stream);
      
      analyserNode.fftSize = 256;
      source.connect(analyserNode);
      
      setAudioContext(context);
      setAnalyser(analyserNode);
      
      startVisualization(analyserNode);
    } catch (error) {
      console.error('Failed to initialize audio visualization:', error);
    }
  };

  /**
   * Start audio level visualization
   */
  const startVisualization = (analyserNode: AnalyserNode) => {
    const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
    
    const updateLevel = () => {
      analyserNode.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setVoiceLevel(average / 255);
      
      if (isListening) {
        animationRef.current = requestAnimationFrame(updateLevel);
      }
    };
    
    updateLevel();
  };

  /**
   * Toggle voice listening
   */
  const toggleListening = async () => {
    if (isListening) {
      aiVoiceService.stopListening();
      setIsListening(false);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    } else {
      const started = await aiVoiceService.startListening();
      if (started) {
        setIsListening(true);
        await initializeAudioVisualization();
        addMessage('ai', 'Voice assistant activated. How can I help you cook?');
      }
    }
  };

  /**
   * Toggle AI mode
   */
  const toggleAIMode = () => {
    aiVoiceService.toggleAIMode();
    setIsAIMode(!isAIMode);
  };

  /**
   * Add message to conversation
   */
  const addMessage = (type: 'user' | 'ai', text: string, confidence?: number) => {
    const message: VoiceMessage = {
      id: Date.now().toString(),
      type,
      text,
      timestamp: new Date(),
      confidence
    };
    setMessages(prev => [...prev, message]);
  };

  /**
   * Clear conversation
   */
  const clearConversation = () => {
    setMessages([]);
    aiVoiceService.clearConversationHistory();
  };

  /**
   * Voice level visualization component
   */
  const VoiceLevelIndicator = () => {
    const bars = Array.from({ length: 5 }, (_, i) => {
      const height = Math.max(0.1, voiceLevel * (1 + i * 0.2));
      return (
        <div
          key={i}
          className="bg-primary-500 rounded-full transition-all duration-100"
          style={{
            height: `${height * 40}px`,
            width: '4px',
            opacity: isListening ? 0.7 + height * 0.3 : 0.3
          }}
        />
      );
    });

    return (
      <div className="flex items-end justify-center space-x-1 h-10">
        {bars}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-end md:items-center justify-center">
      <div className="bg-white dark:bg-gray-900 w-full md:w-96 md:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <SparklesIcon className="w-6 h-6 text-primary-500" />
              {isAIMode && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                AI Voice Assistant
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isAIMode ? 'AI Enhanced' : 'Basic Commands'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleAIMode}
              className={`p-2 rounded-lg transition-colors ${
                isAIMode 
                  ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}
              title="Toggle AI Mode"
            >
              <Cog6ToothIcon className="w-4 h-4" />
            </button>
            
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Voice Level Indicator */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
          <VoiceLevelIndicator />
          <div className="text-center mt-2">
            <span className={`text-sm font-medium ${
              isListening 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-gray-500 dark:text-gray-400'
            }`}>
              {isListening ? 'Listening...' : 'Tap to speak'}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[400px]">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Start a conversation with your AI cooking assistant</p>
              <div className="mt-4 text-xs space-y-1">
                <p>"What's the next step?"</p>
                <p>"Set a timer for 10 minutes"</p>
                <p>"Do I have tomatoes in my pantry?"</p>
                <p>"How do I know when it's done?"</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    message.type === 'user'
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                    {message.confidence && (
                      <span className="text-xs opacity-70">
                        {Math.round(message.confidence * 100)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Current Transcript */}
        {currentTranscript && (
          <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <span className="font-medium">Hearing:</span> {currentTranscript}
            </p>
          </div>
        )}

        {/* Controls */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center space-x-4">
            {/* Main Voice Button */}
            <button
              onClick={toggleListening}
              className={`relative p-4 rounded-full transition-all duration-200 ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 text-white scale-110'
                  : 'bg-primary-500 hover:bg-primary-600 text-white hover:scale-105'
              }`}
            >
              <MicrophoneIcon className="w-6 h-6" />
              {isListening && (
                <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-25" />
              )}
            </button>

            {/* Speaking Indicator */}
            {isSpeaking && (
              <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                <SpeakerWaveIcon className="w-5 h-5 animate-pulse" />
                <span className="text-sm font-medium">Speaking...</span>
              </div>
            )}

            {/* Clear Button */}
            {messages.length > 0 && (
              <button
                onClick={clearConversation}
                className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Commands */}
          <div className="mt-3 flex flex-wrap gap-2 justify-center">
            {[
              "What's next?",
              "Set timer 5 min",
              "Read ingredients",
              "Help"
            ].map((command) => (
              <button
                key={command}
                onClick={() => {
                  addMessage('user', command);
                  // Simulate voice command processing
                }}
                className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {command}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIVoiceAssistant;
