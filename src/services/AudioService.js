import Sound from 'react-native-sound';

export class AudioService {
  constructor() {
    this.sounds = {};
    this.ambientSound = null;
    this.musicSound = null;
    this.currentAmbient = null;
    this.currentMusic = null;
    this.isInitialized = false;
    this.volume = {
      master: 1.0,
      effects: 0.8,
      ambient: 0.2,  // Very quiet background ambience
      music: 0.7
    };
  }

  async initialize() {
    try {
      Sound.setCategory('Playback', true);
      this.isInitialized = true;
      return { success: true };
    } catch (error) {
      console.error('Error initializing audio:', error);
      return { success: false, error };
    }
  }

  async playSound(soundId, options = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const soundFile = this.getSoundFile(soundId);
      if (!soundFile) {
        console.warn(`Sound ${soundId} not found`);
        return this.playFallbackSound(soundId);
      }

      return new Promise((resolve) => {
        if (this.sounds[soundId]) {
          this.sounds[soundId].stop();
          this.sounds[soundId].release();
        }

        const sound = new Sound(soundFile, Sound.MAIN_BUNDLE, (error) => {
          if (error) {
            console.warn(`Failed to load sound ${soundId}:`, error);
            resolve(this.playFallbackSound(soundId));
            return;
          }

          const volume = (options.volume || this.volume.effects) * this.volume.master;
          sound.setVolume(volume);
          sound.play((success) => {
            if (!success) {
              console.warn(`Failed to play sound ${soundId}`);
            }
            sound.release();
          });

          resolve({ success: true });
        });
      });
    } catch (error) {
      console.error(`Error playing sound ${soundId}:`, error);
      return { success: false, error };
    }
  }

  async playAmbient(ambientId, options = {}) {
    try {
      console.log(`[AudioService] playAmbient called with: ${ambientId}`);
      
      if (!this.isInitialized) {
        console.log('[AudioService] Initializing audio...');
        await this.initialize();
      }

      if (this.currentAmbient === ambientId && this.ambientSound) {
        console.log(`[AudioService] ${ambientId} already playing`);
        return { success: true, message: 'Already playing' };
      }

      if (this.ambientSound) {
        console.log('[AudioService] Stopping current ambient...');
        await this.stopAmbient();
        // Small delay to ensure old sound fully stops
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      const ambientFile = this.getAmbientFile(ambientId);
      console.log(`[AudioService] Mapped ${ambientId} to file: ${ambientFile}`);
      
      if (!ambientFile) {
        console.warn(`[AudioService] Ambient ${ambientId} not found`);
        return { success: false };
      }

      return new Promise((resolve) => {
        const sound = new Sound(ambientFile, Sound.MAIN_BUNDLE, (error) => {
          if (error) {
            console.warn(`[AudioService] Failed to load ambient ${ambientId}:`, error);
            resolve({ success: false, error });
            return;
          }

          console.log(`[AudioService] Loaded ${ambientFile} successfully`);
          const volume = (options.volume || this.volume.ambient) * this.volume.master;
          sound.setVolume(volume);
          sound.setNumberOfLoops(-1);
          sound.play((success) => {
            if (success) {
              console.log(`[AudioService] Playing ${ambientFile} in loop`);
            } else {
              console.warn(`[AudioService] Failed to play ${ambientFile}`);
            }
          });

          this.ambientSound = sound;
          this.currentAmbient = ambientId;
          resolve({ success: true });
        });
      });
    } catch (error) {
      console.error(`[AudioService] Error playing ambient ${ambientId}:`, error);
      return { success: false, error };
    }
  }

  async stopAmbient() {
    try {
      if (this.ambientSound) {
        this.ambientSound.stop();
        this.ambientSound.release();
        this.ambientSound = null;
        this.currentAmbient = null;
      }
      return { success: true };
    } catch (error) {
      console.error('Error stopping ambient:', error);
      return { success: false, error };
    }
  }

  async playMusic(musicId, options = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (this.currentMusic === musicId && this.musicSound) {
        return { success: true, message: 'Already playing' };
      }

      if (this.musicSound) {
        await this.stopMusic();
      }

      const musicFile = this.getMusicFile(musicId);
      if (!musicFile) {
        console.warn(`Music ${musicId} not found`);
        return { success: false };
      }

      return new Promise((resolve) => {
        const sound = new Sound(musicFile, Sound.MAIN_BUNDLE, (error) => {
          if (error) {
            console.warn(`Failed to load music ${musicId}:`, error);
            resolve({ success: false, error });
            return;
          }

          const volume = (options.volume || this.volume.music) * this.volume.master;
          sound.setVolume(volume);
          sound.setNumberOfLoops(options.loop !== false ? -1 : 0);
          sound.play();

          this.musicSound = sound;
          this.currentMusic = musicId;
          resolve({ success: true });
        });
      });
    } catch (error) {
      console.error(`Error playing music ${musicId}:`, error);
      return { success: false, error };
    }
  }

  async stopMusic() {
    try {
      if (this.musicSound) {
        this.musicSound.stop();
        this.musicSound.release();
        this.musicSound = null;
        this.currentMusic = null;
      }
      return { success: true };
    } catch (error) {
      console.error('Error stopping music:', error);
      return { success: false, error };
    }
  }

  updateAllVolumes() {
    if (this.ambientSound) {
      this.ambientSound.setVolume(this.volume.ambient * this.volume.master);
    }
    if (this.musicSound) {
      this.musicSound.setVolume(this.volume.music * this.volume.master);
    }
  }

  setAmbientVolume(volume) {
    this.volume.ambient = Math.max(0, Math.min(1, volume));
    if (this.ambientSound) {
      this.ambientSound.setVolume(this.volume.ambient * this.volume.master);
    }
  }

  setEffectsVolume(volume) {
    this.volume.effects = Math.max(0, Math.min(1, volume));
  }

  setMusicVolume(volume) {
    this.volume.music = Math.max(0, Math.min(1, volume));
    if (this.musicSound) {
      this.musicSound.setVolume(this.volume.music * this.volume.master);
    }
  }

  setMasterVolume(volume) {
    this.volume.master = Math.max(0, Math.min(1, volume));
    this.updateAllVolumes();
  }

  getSoundFile(soundId) {
    const soundMap = {
      'combat_start': 'combat_music',
      'sword_strike': 'sword_swing',
      'enemy_hit': 'hit_impact',
      'victory': 'victory_music',
      'level_up': 'level_up',
      'treasure_found': 'chest_open',
      'item_pickup': 'item_pickup',
      'potion_drink': 'potion_drink',
      'door_open': 'door_open',
      'door_close': 'door_close',
      'door_knocks': 'two_door_knocks',
      'footsteps': 'footsteps',
      'rest_complete': 'peaceful_birds',
      'magic': 'magic_sound',
      'spell': 'spell_cast',
      'coin': 'coin_pickup',
      'danger': 'danger',
      'heartbeat': 'heartbeat'
    };

    return soundMap[soundId] || null;
  }

  getAmbientFile(ambientId) {
    const ambientMap = {
      'crackling_fireplace': 'fire_sounds',
      'forest_ambience': 'forest_ambience',
      'dark_ambience': 'cave_ambience',
      'wind_through_ruins': 'ominous_wind',
      'haunted_house': 'cave_ambience',
      'mountain_wind': 'ominous_wind',
      'cave_ambience': 'cave_ambience',
      'dragon_lair': 'cave_ambience',
      'peaceful_nature': 'peaceful_birds',
      'combat_music': 'combat_music',
      'magical_hum': 'magic_sound',
      'village': 'village_ambience',
      'stream': 'stream_sound'
    };

    return ambientMap[ambientId] || null;
  }

  getMusicFile(musicId) {
    const musicMap = {
      'main_theme': 'peaceful_birds',
      'combat_theme': 'combat_music',
      'victory_theme': 'victory_music',
      'boss_theme': 'combat_music'
    };

    return musicMap[musicId] || null;
  }

  playFallbackSound(soundId) {
    console.log(`Playing fallback for ${soundId}`);
    return { success: true, fallback: true };
  }

  async unloadAll() {
    try {
      await this.stopAmbient();
      await this.stopMusic();

      for (const soundId in this.sounds) {
        if (this.sounds[soundId]) {
          this.sounds[soundId].stop();
          this.sounds[soundId].release();
        }
      }

      this.sounds = {};
      return { success: true };
    } catch (error) {
      console.error('Error unloading sounds:', error);
      return { success: false, error };
    }
  }

  getCurrentAmbient() {
    return this.currentAmbient;
  }

  getCurrentMusic() {
    return this.currentMusic;
  }

  getVolume() {
    return { ...this.volume };
  }
}
