import Sound from 'react-native-sound';
import RNFS from 'react-native-fs';

export class ElevenLabsService {
  constructor(apiKey, voiceId) {
    this.apiKey = apiKey;
    this.voiceId = voiceId;
    this.apiEndpoint = 'https://api.elevenlabs.io/v1';
    this.isSpeaking = false;
    this.currentSound = null;
    this.audioQueue = [];
    this.preferences = {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.0,
      use_speaker_boost: true
    };
  }

  async speak(text, options = {}) {
    if (!text || text.trim() === '') {
      return;
    }

    try {
      this.isSpeaking = true;

      const voiceSettings = {
        stability: options.stability || this.preferences.stability,
        similarity_boost: options.similarity_boost || this.preferences.similarity_boost,
        style: options.style || this.preferences.style,
        use_speaker_boost: options.use_speaker_boost !== undefined ? options.use_speaker_boost : this.preferences.use_speaker_boost
      };

      const response = await fetch(
        `${this.apiEndpoint}/text-to-speech/${this.voiceId}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey
          },
          body: JSON.stringify({
            text: text,
            model_id: 'eleven_turbo_v2_5',
            voice_settings: voiceSettings
          })
        }
      );

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUri = await this.saveAudioToFile(audioBlob);

      await this.playAudio(audioUri);

      this.isSpeaking = false;
    } catch (error) {
      console.error('ElevenLabs error:', error);
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
          const filePath = `${RNFS.CachesDirectoryPath}/elevenlabs_${Date.now()}.mp3`;
          
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

  getIsSpeaking() {
    return this.isSpeaking;
  }

  setVoiceSettings(settings) {
    this.preferences = {
      ...this.preferences,
      ...settings
    };
  }

  async getAvailableVoices() {
    try {
      const response = await fetch(`${this.apiEndpoint}/voices`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch voices');
      }

      const data = await response.json();
      return data.voices;
    } catch (error) {
      console.error('Error fetching voices:', error);
      return [];
    }
  }

  async getVoiceInfo() {
    try {
      const response = await fetch(`${this.apiEndpoint}/voices/${this.voiceId}`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch voice info');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching voice info:', error);
      return null;
    }
  }

  setVoiceId(voiceId) {
    this.voiceId = voiceId;
  }
}
