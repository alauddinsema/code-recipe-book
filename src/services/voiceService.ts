// Voice Service for Smart Cooking Mode
// Handles speech recognition and synthesis for hands-free cooking experience

export interface VoiceCommand {
  command: string;
  action: string;
  confidence: number;
  timestamp: number;
}

export interface VoiceSettings {
  language: string;
  voiceSpeed: number;
  voicePitch: number;
  voiceVolume: number;
  preferredVoice?: string;
  enableContinuousListening: boolean;
  noiseReduction: boolean;
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export class VoiceService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private isListening = false;
  private isSupported = false;
  private settings: VoiceSettings;
  private commandCallbacks: Map<string, (params?: any) => void> = new Map();
  private availableVoices: SpeechSynthesisVoice[] = [];

  // Cooking-specific voice commands
  private readonly COOKING_COMMANDS = {
    // Navigation commands
    'next step': 'NEXT_STEP',
    'next': 'NEXT_STEP',
    'previous step': 'PREVIOUS_STEP',
    'previous': 'PREVIOUS_STEP',
    'go back': 'PREVIOUS_STEP',
    'repeat': 'REPEAT_STEP',
    'repeat step': 'REPEAT_STEP',
    'read again': 'REPEAT_STEP',
    
    // Timer commands
    'set timer': 'SET_TIMER',
    'start timer': 'SET_TIMER',
    'timer for': 'SET_TIMER',
    'stop timer': 'STOP_TIMER',
    'cancel timer': 'CANCEL_TIMER',
    'pause timer': 'PAUSE_TIMER',
    'resume timer': 'RESUME_TIMER',
    'how much time': 'CHECK_TIMER',
    'time left': 'CHECK_TIMER',
    
    // Control commands
    'pause': 'PAUSE_COOKING',
    'resume': 'RESUME_COOKING',
    'start cooking': 'START_COOKING',
    'stop cooking': 'STOP_COOKING',
    'exit cooking mode': 'EXIT_COOKING',
    'help': 'SHOW_HELP',
    'what can I say': 'SHOW_HELP',
    
    // Information commands
    'ingredients': 'READ_INGREDIENTS',
    'read ingredients': 'READ_INGREDIENTS',
    'what do I need': 'READ_INGREDIENTS',
    'how long': 'READ_COOK_TIME',
    'cook time': 'READ_COOK_TIME',
    'total time': 'READ_TOTAL_TIME',
    'servings': 'READ_SERVINGS',
    'how many servings': 'READ_SERVINGS',
    
    // Volume and speech control
    'speak louder': 'INCREASE_VOLUME',
    'speak quieter': 'DECREASE_VOLUME',
    'speak slower': 'DECREASE_SPEED',
    'speak faster': 'INCREASE_SPEED',
    'stop talking': 'STOP_SPEECH',
    'be quiet': 'STOP_SPEECH'
  };

  constructor() {
    this.settings = {
      language: 'en-US',
      voiceSpeed: 1.0,
      voicePitch: 1.0,
      voiceVolume: 1.0,
      enableContinuousListening: true,
      noiseReduction: true
    };

    this.initializeVoiceServices();
  }

  /**
   * Initialize Web Speech API services
   */
  private initializeVoiceServices(): void {
    try {
      // Check for Speech Recognition support
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.setupSpeechRecognition();
      }

      // Check for Speech Synthesis support
      if ('speechSynthesis' in window) {
        this.synthesis = window.speechSynthesis;
        this.loadAvailableVoices();
      }

      this.isSupported = !!(this.recognition && this.synthesis);
      
      if (this.isSupported) {
        console.log('🎙️ Voice services initialized successfully');
      } else {
        console.warn('⚠️ Voice services not fully supported in this browser');
      }
    } catch (error) {
      console.error('Failed to initialize voice services:', error);
      this.isSupported = false;
    }
  }

  /**
   * Setup speech recognition configuration
   */
  private setupSpeechRecognition(): void {
    if (!this.recognition) return;

    this.recognition.continuous = this.settings.enableContinuousListening;
    this.recognition.interimResults = true;
    this.recognition.lang = this.settings.language;
    this.recognition.maxAlternatives = 3;

    // Handle recognition results
    this.recognition.onresult = (event) => {
      const results: SpeechRecognitionResult[] = [];
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript.toLowerCase().trim();
        
        results.push({
          transcript,
          confidence: result[0].confidence,
          isFinal: result.isFinal
        });

        // Process final results for commands
        if (result.isFinal) {
          this.processVoiceCommand(transcript, result[0].confidence);
        }
      }
    };

    // Handle recognition errors
    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      // Restart recognition if it stops due to no speech
      if (event.error === 'no-speech' && this.isListening) {
        setTimeout(() => {
          if (this.isListening) {
            this.startListening();
          }
        }, 1000);
      }
    };

    // Handle recognition end
    this.recognition.onend = () => {
      if (this.isListening && this.settings.enableContinuousListening) {
        // Restart continuous listening
        setTimeout(() => {
          if (this.isListening) {
            this.startListening();
          }
        }, 100);
      }
    };
  }

  /**
   * Load available speech synthesis voices
   */
  private loadAvailableVoices(): void {
    if (!this.synthesis) return;

    const loadVoices = () => {
      this.availableVoices = this.synthesis!.getVoices();
      
      // Find preferred voice for cooking (clear, natural voices)
      const preferredVoices = this.availableVoices.filter(voice => 
        voice.lang.startsWith(this.settings.language.split('-')[0]) &&
        (voice.name.includes('Natural') || 
         voice.name.includes('Enhanced') || 
         voice.name.includes('Premium') ||
         voice.localService)
      );

      if (preferredVoices.length > 0) {
        this.settings.preferredVoice = preferredVoices[0].name;
      }

      console.log(`🔊 Loaded ${this.availableVoices.length} voices, preferred: ${this.settings.preferredVoice}`);
    };

    // Load voices immediately if available
    if (this.availableVoices.length === 0) {
      loadVoices();
    }

    // Also listen for voice changes (some browsers load voices asynchronously)
    this.synthesis.onvoiceschanged = loadVoices;
  }

  /**
   * Process recognized voice command
   */
  private processVoiceCommand(transcript: string, confidence: number): void {
    console.log(`🎙️ Voice command: "${transcript}" (confidence: ${confidence.toFixed(2)})`);

    // Minimum confidence threshold
    if (confidence < 0.6) {
      console.log('⚠️ Low confidence, ignoring command');
      return;
    }

    // Find matching command
    let matchedCommand: string | null = null;
    let matchedAction: string | null = null;

    // Check for exact matches first
    for (const [command, action] of Object.entries(this.COOKING_COMMANDS)) {
      if (transcript.includes(command)) {
        matchedCommand = command;
        matchedAction = action;
        break;
      }
    }

    // Handle timer commands with time extraction
    if (matchedAction === 'SET_TIMER') {
      const timeMatch = this.extractTimeFromCommand(transcript);
      if (timeMatch) {
        this.executeCommand(matchedAction, { duration: timeMatch });
        return;
      }
    }

    // Execute matched command
    if (matchedCommand && matchedAction) {
      this.executeCommand(matchedAction);
    } else {
      console.log('❓ Unrecognized command');
      this.speak("I didn't understand that command. Say 'help' to hear available commands.");
    }
  }

  /**
   * Extract time duration from voice command
   */
  private extractTimeFromCommand(transcript: string): number | null {
    // Match patterns like "5 minutes", "2 hours", "30 seconds", "1 hour 30 minutes"
    const timePatterns = [
      /(\d+)\s*(?:hours?|hrs?)/i,
      /(\d+)\s*(?:minutes?|mins?)/i,
      /(\d+)\s*(?:seconds?|secs?)/i
    ];

    let totalSeconds = 0;

    for (const pattern of timePatterns) {
      const match = transcript.match(pattern);
      if (match) {
        const value = parseInt(match[1]);
        
        if (pattern.source.includes('hour')) {
          totalSeconds += value * 3600;
        } else if (pattern.source.includes('minute')) {
          totalSeconds += value * 60;
        } else if (pattern.source.includes('second')) {
          totalSeconds += value;
        }
      }
    }

    return totalSeconds > 0 ? totalSeconds : null;
  }

  /**
   * Execute a voice command
   */
  private executeCommand(action: string, params?: any): void {
    const callback = this.commandCallbacks.get(action);
    if (callback) {
      callback(params);
    } else {
      console.warn(`No callback registered for action: ${action}`);
    }
  }

  /**
   * Register callback for voice command
   */
  public registerCommand(action: string, callback: (params?: any) => void): void {
    this.commandCallbacks.set(action, callback);
  }

  /**
   * Start voice recognition
   */
  public async startListening(): Promise<boolean> {
    if (!this.isSupported || !this.recognition) {
      console.error('Voice recognition not supported');
      return false;
    }

    try {
      if (this.isListening) {
        this.stopListening();
      }

      this.recognition.start();
      this.isListening = true;
      console.log('🎙️ Voice recognition started');
      return true;
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      return false;
    }
  }

  /**
   * Stop voice recognition
   */
  public stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      console.log('🔇 Voice recognition stopped');
    }
  }

  /**
   * Speak text using speech synthesis
   */
  public speak(text: string, options?: Partial<VoiceSettings>): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Cancel any ongoing speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Apply voice settings
      utterance.rate = options?.voiceSpeed ?? this.settings.voiceSpeed;
      utterance.pitch = options?.voicePitch ?? this.settings.voicePitch;
      utterance.volume = options?.voiceVolume ?? this.settings.voiceVolume;
      utterance.lang = options?.language ?? this.settings.language;

      // Set preferred voice
      if (this.settings.preferredVoice) {
        const voice = this.availableVoices.find(v => v.name === this.settings.preferredVoice);
        if (voice) {
          utterance.voice = voice;
        }
      }

      utterance.onend = () => resolve();
      utterance.onerror = (error) => reject(error);

      this.synthesis.speak(utterance);
      console.log(`🔊 Speaking: "${text}"`);
    });
  }

  /**
   * Stop current speech
   */
  public stopSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  /**
   * Check if voice services are supported
   */
  public isVoiceSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Check if currently listening
   */
  public isCurrentlyListening(): boolean {
    return this.isListening;
  }

  /**
   * Get current voice settings
   */
  public getSettings(): VoiceSettings {
    return { ...this.settings };
  }

  /**
   * Update voice settings
   */
  public updateSettings(newSettings: Partial<VoiceSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    
    // Update recognition settings if changed
    if (this.recognition) {
      if (newSettings.language) {
        this.recognition.lang = newSettings.language;
      }
      if (newSettings.enableContinuousListening !== undefined) {
        this.recognition.continuous = newSettings.enableContinuousListening;
      }
    }
  }

  /**
   * Get available voices
   */
  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return [...this.availableVoices];
  }

  /**
   * Get supported cooking commands
   */
  public getSupportedCommands(): Record<string, string> {
    return { ...this.COOKING_COMMANDS };
  }
}
