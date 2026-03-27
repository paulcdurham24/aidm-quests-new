import Tts from 'react-native-tts';

export class SpeechService {
  constructor() {
    this.isSpeaking = false;
    this.currentUtterance = null;
    this.queue = [];
    this.preferences = {
      voice: null,
      pitch: 1.0,
      rate: 0.5,
      language: 'en-US'
    };
    this.eventListeners = {};
    this.initializeTts();
  }

  async initializeTts() {
    try {
      await Tts.setDefaultLanguage(this.preferences.language);
      await Tts.setDefaultRate(this.preferences.rate);
      await Tts.setDefaultPitch(this.preferences.pitch);

      Tts.addEventListener('tts-start', () => {
        this.isSpeaking = true;
      });
    } catch (error) {
      console.error('Error initializing TTS:', error);
    }
  }

  // Pre-process text for device TTS compatibility
  // Handle difficult words and punctuation that device TTS struggles with
  preprocessTextForTts(text) {
    let processedText = text;
    
    // Replace difficult Latin/mystical words with easier pronunciations
    const wordReplacements = {
      'MYSTICUS': 'MYSTIC US',
      'mysticus': 'mystic us'
    };
    
    // Handle punctuation that device TTS reads literally
    // Replace periods at end of sentences with brief pause (handled by TTS naturally)
    // But keep periods in abbreviations like "e.g." or "i.e."
    processedText = processedText.replace(/\.(?=\s|$)/g, ''); // Remove periods that end sentences
    
    // Replace other problematic punctuation
    processedText = processedText.replace(/;/g, ','); // Semicolons to commas
    processedText = processedText.replace(/:/g, ','); // Colons to commas (except in time)
    processedText = processedText.replace(/—/g, '-'); // Em dash to regular dash
    
    // Apply word replacements after punctuation handling
    for (const [difficult, easier] of Object.entries(wordReplacements)) {
      processedText = processedText.replace(new RegExp(difficult, 'g'), easier);
    }
    
    // Clean up extra spaces that might result from replacements
    processedText = processedText.replace(/\s+/g, ' ').trim();
    
    return processedText;
  }

  // Get text for display (original, unprocessed)
  getDisplayText(text) {
    return text; // Return original text for dialog display
  }

  async speak(text, options = {}) {
    if (!text || text.trim() === '') {
      return;
    }

    try {
      const language = options.language || this.preferences.language;
      const pitch = options.pitch || this.preferences.pitch;
      const rate = options.rate || this.preferences.rate;

      await Tts.setDefaultLanguage(language);
      await Tts.setDefaultRate(rate);
      await Tts.setDefaultPitch(pitch);

      // Pre-process text for device TTS compatibility
      const processedText = this.preprocessTextForTts(text);

      // Estimate speech duration for typewriter sync (~130 words/min at rate 0.5)
      const wordCount = processedText.split(/\s+/).length;
      const wordsPerMin = 130 * rate;
      const estimatedDuration = (wordCount / wordsPerMin) * 60;

      this.isSpeaking = true;
      this.emit('speechStart', { duration: estimatedDuration });

      // Wait for speech to ACTUALLY FINISH before resolving
      // This is critical — without this, speak() returns immediately and
      // the mic fires too early / multiple speaks pile up
      return new Promise((resolve) => {
        const onFinish = () => {
          Tts.removeEventListener('tts-finish', onFinish);
          Tts.removeEventListener('tts-cancel', onCancel);
          this.isSpeaking = false;
          this.emit('speechEnd', {});
          resolve();
        };
        const onCancel = () => {
          Tts.removeEventListener('tts-finish', onFinish);
          Tts.removeEventListener('tts-cancel', onCancel);
          this.isSpeaking = false;
          this.emit('speechEnd', {});
          resolve();
        };
        Tts.addEventListener('tts-finish', onFinish);
        Tts.addEventListener('tts-cancel', onCancel);
        Tts.speak(processedText);
      });
    } catch (error) {
      console.error('Speech error:', error);
      this.isSpeaking = false;
      this.emit('speechError', { error });
    }
  }

  async speakWithPause(text, pauseDuration = 500) {
    await this.speak(text);
    await this.pause(pauseDuration);
  }

  async speakMultiple(texts, pauseBetween = 300) {
    for (let i = 0; i < texts.length; i++) {
      await this.speak(texts[i]);
      if (i < texts.length - 1) {
        await this.pause(pauseBetween);
      }
    }
  }

  async stop() {
    try {
      await Tts.stop();
      this.isSpeaking = false;
      this.queue = [];
    } catch (error) {
      console.error('Error stopping speech:', error);
    }
  }

  async pause(duration) {
    await this.stop();
    return new Promise(resolve => setTimeout(resolve, duration));
  }

  async resume() {
    // Not supported in react-native-tts
  }

  getIsSpeaking() {
    return this.isSpeaking;
  }

  setVoice(voice) {
    this.preferences.voice = voice;
    if (voice) {
      Tts.setDefaultVoice(voice);
    }
  }

  setPitch(pitch) {
    this.preferences.pitch = Math.max(0.5, Math.min(2.0, pitch));
    Tts.setDefaultPitch(this.preferences.pitch);
  }

  setRate(rate) {
    this.preferences.rate = Math.max(0.1, Math.min(2.0, rate));
    Tts.setDefaultRate(this.preferences.rate);
  }

  setLanguage(language) {
    this.preferences.language = language;
    Tts.setDefaultLanguage(language);
  }

  async getAvailableVoices() {
    try {
      const voices = await Tts.voices();
      return voices;
    } catch (error) {
      console.error('Error getting voices:', error);
      return [];
    }
  }

  setPreferences(preferences) {
    this.preferences = {
      ...this.preferences,
      ...preferences
    };
  }

  getPreferences() {
    return { ...this.preferences };
  }

  setRate(rate) {
    this.preferences.rate = Math.max(0.1, Math.min(2.0, rate));
  }

  setPitch(pitch) {
    this.preferences.pitch = Math.max(0.5, Math.min(2.0, pitch));
  }

  setVolume(volume) {
    this.preferences.volume = Math.max(0.0, Math.min(1.0, volume));
  }

  setLanguage(language) {
    this.preferences.language = language;
  }

  setVoice(voiceId) {
    this.preferences.voice = voiceId;
  }

  async isSpeechAvailable() {
    try {
      const voices = await this.getAvailableVoices();
      return voices.length > 0;
    } catch (error) {
      return false;
    }
  }

  getIsSpeaking() {
    return this.isSpeaking;
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
      this.eventListeners[event].forEach(callback => callback(data));
    }
  }

  async speakWithEmphasis(text, emphasisWords = []) {
    let processedText = text;
    
    emphasisWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      processedText = processedText.replace(regex, `<emphasis>${word}</emphasis>`);
    });

    return this.speak(processedText);
  }

  async speakSlowly(text) {
    const originalRate = this.preferences.rate;
    this.setRate(0.7);
    await this.speak(text);
    this.setRate(originalRate);
  }

  async speakUrgently(text) {
    const originalRate = this.preferences.rate;
    const originalPitch = this.preferences.pitch;
    this.setRate(1.3);
    this.setPitch(1.2);
    await this.speak(text);
    this.setRate(originalRate);
    this.setPitch(originalPitch);
  }
}
