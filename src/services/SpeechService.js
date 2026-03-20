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
        this.emit('speechStart', {});
      });

      Tts.addEventListener('tts-finish', () => {
        this.isSpeaking = false;
        this.emit('speechEnd', {});
      });

      Tts.addEventListener('tts-cancel', () => {
        this.isSpeaking = false;
        this.emit('speechStopped', {});
      });
    } catch (error) {
      console.error('Error initializing TTS:', error);
    }
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

      this.isSpeaking = true;
      await Tts.speak(text);
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
