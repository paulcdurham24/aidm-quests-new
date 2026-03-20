import Voice from '@react-native-voice/voice';

export class VoiceListener {
  constructor() {
    this.isListening = false;
    this.recognizedText = '';
    this.eventListeners = {};
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
      // Start voice recognition with longer timeout (15 seconds)
      await Voice.start('en-US', {
        SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 15000,
        SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 15000,
        SPEECH_INPUT_MINIMUM_LENGTH_MILLIS: 15000
      });
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
    console.error('Speech recognition error:', event.error);
    this.isListening = false;
    
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
