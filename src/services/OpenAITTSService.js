import Sound from 'react-native-sound';
import RNFS from 'react-native-fs';

export class OpenAITTSService {
  constructor(apiKey, voice = 'onyx') {
    this.apiKey = apiKey;
    this.voice = voice; // onyx, fable, echo, alloy, nova, shimmer
    this.model = 'tts-1'; // or 'tts-1-hd' for higher quality
    this.apiEndpoint = 'https://api.openai.com/v1/audio/speech';
    this.isSpeaking = false;
    this.currentSound = null;
    this.audioQueue = [];
  }

  async speak(text, options = {}) {
    if (!text || text.trim() === '') {
      return;
    }

    try {
      this.isSpeaking = true;

      const voice = options.voice || this.voice;
      const model = options.hd ? 'tts-1-hd' : this.model;
      const speed = options.speed || 0.85; // 0.25 to 4.0, slower for dramatic effect
      
      // Enhance text with dramatic DM pacing
      const enhancedText = this.enhanceDramaticPacing(text);

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          voice: voice,
          input: enhancedText,
          speed: speed
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI TTS error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const audioBlob = await response.blob();
      const audioUri = await this.saveAudioToFile(audioBlob);

      await this.playAudio(audioUri);

      this.isSpeaking = false;
    } catch (error) {
      console.error('OpenAI TTS error:', error);
      this.isSpeaking = false;
      throw error;
    }
  }

  async saveAudioToFile(blob) {
    try {
      const reader = new FileReader();
      
      return new Promise((resolve, reject) => {
        reader.onloadend = async () => {
          const base64Audio = reader.result.split(',')[1];
          const filePath = `${RNFS.CachesDirectoryPath}/openai_tts_${Date.now()}.mp3`;
          
          await RNFS.writeFile(filePath, base64Audio, 'base64');
          
          resolve(filePath);
        };
        
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error saving audio file:', error);
      throw error;
    }
  }

  async playAudio(uri) {
    try {
      if (this.currentSound) {
        this.currentSound.stop();
        this.currentSound.release();
      }

      return new Promise((resolve, reject) => {
        const sound = new Sound(uri, '', (error) => {
          if (error) {
            console.error('Failed to load audio:', error);
            reject(error);
            return;
          }

          sound.play((success) => {
            if (success) {
              this.isSpeaking = false;
              sound.release();
              resolve();
            } else {
              console.error('Playback failed');
              this.isSpeaking = false;
              sound.release();
              reject(new Error('Playback failed'));
            }
          });

          this.currentSound = sound;
        });
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      throw error;
    }
  }

  async stop() {
    if (this.currentSound) {
      this.currentSound.stop();
      this.currentSound.release();
      this.currentSound = null;
    }
    this.isSpeaking = false;
  }

  enhanceDramaticPacing(text) {
    // Add dramatic pauses and emphasis for Dungeon Master voice
    let enhanced = text;
    
    // Add pauses after introductory phrases
    enhanced = enhanced.replace(/\b(Ah|Well|Now|Behold|Listen|Hear|Look)\b/gi, '$1...');
    
    // Add dramatic pauses before important moments
    enhanced = enhanced.replace(/\b(adventure|quest|destiny|fate|magic|power|doom|death|treasure|dragon|battle)\b/gi, '...$1');
    
    // Stretch dramatic words for emphasis
    enhanced = enhanced.replace(/\b(ancient|mystical|magical|powerful|terrible|glorious|wondrous)\b/gi, (match) => {
      return match.split('').join('');  // Subtle emphasis
    });
    
    // Add pause after questions
    enhanced = enhanced.replace(/\?/g, '?...');
    
    // Add pause after exclamations  
    enhanced = enhanced.replace(/!/g, '!...');
    
    // Add dramatic pause before "but" and similar conjunctions
    enhanced = enhanced.replace(/\b(but|however|yet|though)\b/gi, '...$1');
    
    // Clean up multiple consecutive pauses
    enhanced = enhanced.replace(/\.{4,}/g, '...');
    
    return enhanced;
  }

  getIsSpeaking() {
    return this.isSpeaking;
  }

  setVoice(voice) {
    // Available voices: alloy, echo, fable, onyx, nova, shimmer
    const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
    if (validVoices.includes(voice)) {
      this.voice = voice;
    } else {
      console.warn(`Invalid voice: ${voice}. Using default: onyx`);
    }
  }

  setModel(useHD) {
    this.model = useHD ? 'tts-1-hd' : 'tts-1';
  }

  // Voice descriptions for UI/selection:
  static getVoiceInfo() {
    return {
      onyx: {
        name: 'Onyx',
        description: 'Deep, authoritative voice - Perfect for Dungeon Master',
        gender: 'male',
        recommended: true
      },
      fable: {
        name: 'Fable',
        description: 'British accent, expressive storyteller',
        gender: 'male'
      },
      echo: {
        name: 'Echo',
        description: 'Warm, engaging narrator',
        gender: 'male'
      },
      alloy: {
        name: 'Alloy',
        description: 'Neutral, balanced tone',
        gender: 'neutral'
      },
      nova: {
        name: 'Nova',
        description: 'Bright, energetic voice',
        gender: 'female'
      },
      shimmer: {
        name: 'Shimmer',
        description: 'Gentle, soothing tone',
        gender: 'female'
      }
    };
  }
}
