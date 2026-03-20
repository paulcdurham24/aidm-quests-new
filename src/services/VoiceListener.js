import Voice from '@react-native-voice/voice';

export class VoiceListener {
  constructor() {
    this.isListening = false;
    this.recognizedText = '';
    this.eventListeners = {};
    this.waitingForInput = false; // When true, auto-retry on timeout errors
    this.retryCount = 0;
    this.maxRetries = 10; // Max retries before giving up
    this.setupVoiceRecognition();
  }

  setupVoiceRecognition() {
    Voice.onSpeechStart = this.onSpeechStart.bind(this);
    Voice.onSpeechEnd = this.onSpeechEnd.bind(this);
    Voice.onSpeechResults = this.onSpeechResults.bind(this);
    Voice.onSpeechPartialResults = this.onSpeechPartialResults.bind(this);
    Voice.onSpeechError = this.onSpeechError.bind(this);
  }

  async startListening() {
    try {
      if (this.isListening) {
        await this.stopListening();
      }

      this.recognizedText = '';
      this.waitingForInput = true;
      this.retryCount = 0;
      // Start voice recognition - let Android handle timing naturally
      await Voice.start('en-US');
      this.isListening = true;
      
      this.emit('listeningStarted');
      return { success: true };
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      this.emit('error', { error });
      return { success: false, error };
    }
  }

  async stopListening() {
    try {
      this.waitingForInput = false; // Stop auto-retry
      await Voice.stop();
      this.isListening = false;
      
      this.emit('listeningStopped');
      return { success: true };
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
      return { success: false, error };
    }
  }

  async cancelListening() {
    try {
      this.waitingForInput = false; // Stop auto-retry
      await Voice.cancel();
      this.isListening = false;
      this.recognizedText = '';
      
      this.emit('listeningCancelled');
      return { success: true };
    } catch (error) {
      console.error('Error cancelling voice recognition:', error);
      return { success: false, error };
    }
  }

  async destroyListening() {
    try {
      await Voice.destroy();
      this.isListening = false;
      
      Voice.removeAllListeners();
      return { success: true };
    } catch (error) {
      console.error('Error destroying voice recognition:', error);
      return { success: false, error };
    }
  }

  onSpeechStart(event) {
    console.log('Speech started');
    this.emit('speechStart', event);
  }

  onSpeechEnd(event) {
    console.log('Speech ended');
    this.isListening = false;
    this.emit('speechEnd', event);
  }

  onSpeechResults(event) {
    if (event.value && event.value.length > 0) {
      this.recognizedText = event.value[0];
      console.log('Recognized:', this.recognizedText);
      
      // Got a result, stop waiting/retrying
      this.waitingForInput = false;
      this.retryCount = 0;
      
      this.emit('results', { 
        text: this.recognizedText,
        allResults: event.value 
      });
    }
  }

  onSpeechPartialResults(event) {
    if (event.value && event.value.length > 0) {
      const partialText = event.value[0];
      
      this.emit('partialResults', { 
        text: partialText,
        allResults: event.value 
      });
    }
  }

  onSpeechError(event) {
    const errorCode = event.error?.code || event.error;
    console.log('Speech recognition error code:', errorCode);
    this.isListening = false;
    
    // Error codes 7 (No match) and 11 (Didn't understand) are timeout errors
    // If we're waiting for input, auto-retry instead of giving up
    const isTimeoutError = errorCode === '7' || errorCode === '11' || 
                           errorCode === 7 || errorCode === 11;
    
    if (isTimeoutError && this.waitingForInput && this.retryCount < this.maxRetries) {
      this.retryCount++;
      console.log(`[VoiceListener] Timeout - auto-restarting mic (attempt ${this.retryCount}/${this.maxRetries})`);
      
      // Small delay before restarting to avoid rapid cycling
      setTimeout(async () => {
        if (this.waitingForInput) {
          try {
            this.recognizedText = '';
            await Voice.start('en-US');
            this.isListening = true;
            // Don't emit listeningStarted again - user still sees mic as active
          } catch (err) {
            console.error('Error restarting voice recognition:', err);
            this.waitingForInput = false;
            this.emit('error', { error: event.error, event });
          }
        }
      }, 300);
      return; // Don't emit error - we're retrying silently
    }
    
    // Real error or max retries reached
    this.waitingForInput = false;
    this.retryCount = 0;
    this.emit('error', { 
      error: event.error,
      event 
    });
  }

  getRecognizedText() {
    return this.recognizedText;
  }

  getIsListening() {
    return this.isListening;
  }

  async isAvailable() {
    try {
      const available = await Voice.isAvailable();
      return available;
    } catch (error) {
      console.error('Error checking voice availability:', error);
      return false;
    }
  }

  async getSupportedLanguages() {
    try {
      const languages = await Voice.getSupportedLanguages();
      return languages;
    } catch (error) {
      console.error('Error getting supported languages:', error);
      return [];
    }
  }

  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  off(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(
        cb => cb !== callback
      );
    }
  }

  emit(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  processCommand(text) {
    const normalizedText = text.toLowerCase().trim();

    const commandPatterns = {
      explore: /\b(explore|forward|move|go|walk|travel)\b/,
      attack: /\b(attack|fight|strike|hit|slash)\b/,
      defend: /\b(defend|block|guard|protect)\b/,
      flee: /\b(flee|run|escape|retreat)\b/,
      inventory: /\b(inventory|items|bag|backpack|belongings)\b/,
      status: /\b(status|stats|health|condition)\b/,
      quest: /\b(quest|mission|objective|task)\b/,
      use: /\b(use|drink|consume|eat)\b/,
      equip: /\b(equip|wear|wield|put on)\b/,
      look: /\b(look|observe|inspect|examine)\b/,
      rest: /\b(rest|sleep|camp|heal)\b/,
      save: /\b(save|save game)\b/,
      help: /\b(help|commands|what can i do)\b/
    };

    for (const [command, pattern] of Object.entries(commandPatterns)) {
      if (pattern.test(normalizedText)) {
        return {
          command,
          originalText: text,
          confidence: 'high'
        };
      }
    }

    return {
      command: 'unknown',
      originalText: text,
      confidence: 'low'
    };
  }

  clearRecognizedText() {
    this.recognizedText = '';
  }
}
