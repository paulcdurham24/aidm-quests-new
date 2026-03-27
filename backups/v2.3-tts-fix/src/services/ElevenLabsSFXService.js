import RNFS from 'react-native-fs';
import Sound from 'react-native-sound';

export class ElevenLabsSFXService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.apiEndpoint = 'https://api.elevenlabs.io/v1/sound-generation';
    this.cacheDir = `${RNFS.CachesDirectoryPath}/sfx_cache`;
    this.cache = {}; // in-memory cache of generated clips
    this.initialized = false;
  }

  async initialize() {
    try {
      const exists = await RNFS.exists(this.cacheDir);
      if (!exists) {
        await RNFS.mkdir(this.cacheDir);
      }
      this.initialized = true;
      console.log('[ElevenLabsSFX] Initialized, cache dir:', this.cacheDir);
    } catch (error) {
      console.error('[ElevenLabsSFX] Init error:', error);
    }
  }

  async generateAndPlay(description, volume = 0.8) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Check cache first
      const cacheKey = this.getCacheKey(description);
      const cachedPath = `${this.cacheDir}/${cacheKey}.mp3`;

      const cachedExists = await RNFS.exists(cachedPath);
      if (cachedExists) {
        console.log(`[ElevenLabsSFX] Playing cached: ${description}`);
        return this.playFile(cachedPath, volume);
      }

      console.log(`[ElevenLabsSFX] Generating SFX for: "${description}"`);

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: description,
          duration_seconds: 3.0,
          prompt_influence: 0.5,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ElevenLabsSFX] API error ${response.status}:`, errorText);
        return { success: false, error: `API error: ${response.status}` };
      }

      // Get the audio data as base64
      const audioBlob = await response.blob();
      const reader = new FileReader();

      return new Promise((resolve) => {
        reader.onload = async () => {
          try {
            const base64Data = reader.result.split(',')[1];
            await RNFS.writeFile(cachedPath, base64Data, 'base64');
            console.log(`[ElevenLabsSFX] Saved to cache: ${cachedPath}`);

            const result = await this.playFile(cachedPath, volume);
            resolve(result);
          } catch (writeError) {
            console.error('[ElevenLabsSFX] Write error:', writeError);
            resolve({ success: false, error: writeError });
          }
        };
        reader.onerror = () => {
          console.error('[ElevenLabsSFX] Reader error');
          resolve({ success: false, error: 'Failed to read audio data' });
        };
        reader.readAsDataURL(audioBlob);
      });
    } catch (error) {
      console.error('[ElevenLabsSFX] Generate error:', error);
      return { success: false, error };
    }
  }

  async playFile(filePath, volume = 0.8) {
    return new Promise((resolve) => {
      const sound = new Sound(filePath, '', (error) => {
        if (error) {
          console.warn(`[ElevenLabsSFX] Failed to load: ${filePath}`, error);
          resolve({ success: false, error });
          return;
        }

        sound.setVolume(volume);
        sound.play((success) => {
          if (!success) {
            console.warn('[ElevenLabsSFX] Playback failed');
          }
          sound.release();
        });

        resolve({ success: true });
      });
    });
  }

  getCacheKey(description) {
    // Simple hash for cache filename
    let hash = 0;
    for (let i = 0; i < description.length; i++) {
      const char = description.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return `sfx_${Math.abs(hash)}`;
  }

  async clearCache() {
    try {
      const exists = await RNFS.exists(this.cacheDir);
      if (exists) {
        await RNFS.unlink(this.cacheDir);
        await RNFS.mkdir(this.cacheDir);
      }
      console.log('[ElevenLabsSFX] Cache cleared');
    } catch (error) {
      console.error('[ElevenLabsSFX] Clear cache error:', error);
    }
  }
}
