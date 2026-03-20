import Sound from 'react-native-sound';
import { ElevenLabsSFXService } from './ElevenLabsSFXService';

export class AudioService {
  constructor() {
    this.sounds = {};
    this.ambientSound = null;
    this.musicSound = null;
    this.currentAmbient = null;
    this.currentMusic = null;
    this.isInitialized = false;
    this.currentlyPlayingSfx = null;
    this.recentSfx = [];
    this.elevenLabsSFX = null;
    this.volume = {
      master: 1.0,
      effects: 0.8,
      ambient: 0.2,  // Very quiet background ambience
      music: 0.15
    };
  }

  setElevenLabsKey(apiKey) {
    if (apiKey) {
      this.elevenLabsSFX = new ElevenLabsSFXService(apiKey);
      console.log('[AudioService] ElevenLabs SFX enabled');
    }
  }

  getAudioState() {
    return {
      currentAmbient: this.currentAmbient,
      currentMusic: this.currentMusic,
      currentlyPlayingSfx: this.currentlyPlayingSfx,
      recentSfx: this.recentSfx.slice(-5),
      volumes: { ...this.volume }
    };
  }

  trackSfx(sfxName) {
    this.currentlyPlayingSfx = sfxName;
    this.recentSfx.push({ name: sfxName, timestamp: Date.now() });
    if (this.recentSfx.length > 20) this.recentSfx.shift();
    // Clear current after 4 seconds (typical SFX length)
    setTimeout(() => {
      if (this.currentlyPlayingSfx === sfxName) {
        this.currentlyPlayingSfx = null;
      }
    }, 4000);
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
  }

  async setAmbientVolume(volume) {
    this.volume.ambient = Math.max(0, Math.min(1, volume));
    // Update currently playing ambient sound
    if (this.ambientSound) {
      const newVolume = this.volume.ambient * this.volume.master;
      this.ambientSound.setVolume(newVolume);
    }
  }

  getSoundFile(soundId) {
    const soundMap = {
      // Combat
      'combat_start': 'combat_music',
      'sword_strike': 'sword_swing',
      'sword_swing': 'sword_swing',
      'sword_fight': 'sword_fight_393849',
      'sword_stab': 'sword_stab_flesh',
      'enemy_hit': 'hit_impact',
      'hit_impact': 'hit_impact',
      'punch': 'classic_punch_impact',
      'victory': 'victory_music',
      'victory_shouts': 'victory_shouts',
      'death': 'dramatic_death_collapse',
      'dramatic_death_collapse': 'dramatic_death_collapse',
      'character_death': 'character_death',
      'dying_beast': 'dying_beast',
      'level_up': 'level_up',
      'swoosh': 'swoosh_sound_effect_or_fight_',
      'blade': 'blade_piercing_body',
      // Monster sounds
      'goblin_cackle': 'goblin_cackle',
      'goblin_scream': 'goblin_scream',
      'goblin_death': 'goblin_death',
      'monster_growl': 'monster_growl',
      'monster_howl': 'monster_howl',
      'monster_bite': 'monster_bite',
      'monster_roar': 'monster_demon_roar_368663',
      'monster_screech': 'monster_screech_2_368682',
      'monster_warrior_roar': 'monster_warrior_roar',
      'troll_roars': 'troll_roars',
      'dragon_growl': 'dragon_growl_7_364612',
      'dragon_roar': 'dragon_roar_4_364609',
      'dragon_wings': 'dragon_wings_flapping_478385',
      'wolf_howl': 'monster_howl',
      'wolf_growl': 'wolf_growl',
      'wolf_howl_death': 'wolf_howl_death',
      'animalistic_snort': 'animalistic_snort_463205',
      'flying_monster_screech': 'flying_monster_screech',
      'slime': 'slime_monster_noises',
      'zombie_moan': 'zombie_moan_sfx_454252',
      'zombie_call': 'zombie_call',
      'zombie_scream': 'zombie_screech_sound_effect_312865',
      'banshee_scream': 'banshee_screaming_sound_effect_312864',
      'ghost': 'ghost_eerie_ambiance',
      'death_wraith': 'death_wraith',
      'breaking_bones': 'breaking_bones',
      'skeleton_death_breath': 'skeleton_death_breath',
      'cave_troll_death': 'cave_troll_death',
      'zombie_death_2': 'zombie_death_2',
      'dragon_death': 'dragon_death',
      'dragon_fire_attack': 'dragon_fire_attack',
      // Creature sounds
      'crow': 'crow_calls_raspy_echoing_472377',
      'eagle': 'eagle_sound_382725',
      'cat_meow': 'cute_cat_meow_472372',
      'horse_neigh': 'gentle_horse_neigh',
      'horse_gallop': 'horse_galloping',
      'seagull': 'seagull_calls_339723',
      'frogs': 'frogs_croaking_at_night_329855',
      // Items & treasure
      'treasure_found': 'chest_open',
      'chest_open': 'chest_open',
      'item_pickup': 'item_pickup',
      'potion_drink': 'potion_drink',
      'coin': 'coin_pickup',
      'coin_pickup': 'coin_pickup',
      // Doors
      'door_open': 'door_open',
      'door_close': 'door_close',
      'door_knocks': 'two_door_knocks',
      'door_creak': 'creaky_old_door_472357',
      'door_slam': 'door_slamming_shut_478363',
      // Magic & spells
      'magic': 'magic_sound',
      'magic_sound': 'magic_sound',
      'magic_spell': 'magic_spell',
      'spell': 'spell_cast',
      'spell_cast': 'spell_cast',
      'holy_spell': 'holy_spell_cast_450460',
      'fire_spell': 'fire_spell_impact_448565',
      'ice_spell': 'elemental_spell_impact_ice_448564',
      'wind_spell': 'elemental_spell_impact_wind_478376',
      'water_spell': 'elemental_spell_impact_water_478377',
      'light_spell': 'elemental_spell_impact_light_478379',
      'flame_spell': 'elemental_spell_impact_flame_448566',
      'spooky_wizard': 'spooky_wizard_spells',
      'wizard_laugh': 'spooky_wizard_laugh',
      // Environment
      'footsteps': 'footsteps',
      'footsteps_nature': 'footsteps_on_the_nature_trail_419017',
      'splash': 'big_rock_splash_467479',
      'wet_splash': 'wet_splash',
      'explosion': 'explosion_with_debri',
      'fireworks': 'fireworks_09_419028',
      'bell': 'bell',
      'clock_ticking': 'clock_ticking',
      'rustling_bushes': 'rustling_bushes',
      'bubbles': 'bubbles_popping_406642',
      // Human sounds
      'cry_of_pain': 'cry_of_pain',
      'male_pain': 'male_groan_of_pain',
      'man_scream': 'man_scream',
      'woman_crying': 'woman_crying',
      'baby_crying': 'baby_crying_463213',
      'crowd_cheer': 'crowd_cheer_and_applause_406644',
      'war_drums': 'ancient_war_drums_463214',
      'snore': 'snore',
      // Atmosphere
      'rest_complete': 'peaceful_birds',
      'danger': 'danger',
      'heartbeat': 'heartbeat',
      'heartbeat_fast': 'heartbeat_fast',
      'spooky_chimes': 'spooky_chimes',
      'correct': 'correct'
    };

    return soundMap[soundId] || null;
  }

  getAmbientFile(ambientId) {
    const ambientMap = {
      // Fire & warmth
      'crackling_fireplace': 'fire_sounds',
      'campfire': 'campfire_in_the_woods_467491',
      'fire': 'generic_fire_493989',
      // Nature
      'forest_ambience': 'forest_ambience',
      'forest_rain': 'forest_rain_atmo_monsters',
      'forest_swamp': 'forest_swamp',
      'peaceful_nature': 'peaceful_birds',
      'crickets': 'night_atmosphere_with_crickets',
      'night_crickets': 'night_cricket_ambience_22484',
      'frogs_night': 'frogs_croaking_at_night_329855',
      'stream': 'stream_sound',
      'creek': 'creek_trickling_calmly_478387',
      'ocean': 'gentle_ocean_shore_waves_499665',
      'rain': 'soft_rain_atmosphere',
      'rain_tent': 'gentle_rain_on_the_tent_499663',
      'thunderstorm': 'thunderstorm_ambience_2_19565',
      'rain_thunder': 'raindrops_on_open_roof_window_faint_thunder_in_distance',
      // Underground
      'cave_ambience': 'cave_ambience',
      'cave_dripping': 'cave_dripping_water_sound_effect',
      'cave_droplets': 'droplets_in_a_cave_482871',
      'dungeon': 'dungeon_ambience',
      'dungeon_air': 'dungeon_air_6983',
      'dungeon_loop': 'a_dungeon_ambience_loop_79423',
      'dark_ambience': 'cave_ambience',
      'dragon_lair': 'cave_ambience',
      // Scary & eerie
      'haunted_house': 'haunted_graveyard_ambience_sound',
      'graveyard': 'haunted_graveyard_ambience_sound',
      'cemetery_wind': 'cemetery_wind_467488',
      'eerie': 'eerie_ambience_6836',
      'scary': 'scary_ambience_59002',
      'scary_night': 'scary_night_ambience_75274',
      'ghost_ambience': 'ghost_eerie_ambiance',
      'bunker': 'bunker_ambience_493987',
      // Wind
      'wind_through_ruins': 'ominous_wind',
      'mountain_wind': 'ominous_wind',
      'ominous_wind': 'ominous_wind',
      // Village & civilization
      'village': 'village_ambience',
      'village_ambience': 'village_ambience',
      'medieval_village': 'medieval_village_atmosphere',
      'market': 'open_market',
      'crowd': 'community_crowd_ambience_27970',
      'farm': 'daytime_farm_ambience_409990',
      // Combat
      'combat_music': 'combat_music',
      // Magic
      'magical_hum': 'magic_sound',
      // Wildlife
      'wolf_field': 'wolf_sfx_field_ambience_414431',
      'water_drips': 'water_drips_76848'
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

  async playSfx(filename, volume = null) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      this.trackSfx(filename);

      return new Promise((resolve) => {
        const sound = new Sound(filename, Sound.MAIN_BUNDLE, (error) => {
          if (error) {
            console.warn(`[AudioService] Failed to load SFX ${filename}:`, error);
            resolve({ success: false, error });
            return;
          }

          const vol = (volume || this.volume.effects) * this.volume.master;
          sound.setVolume(vol);
          sound.play((success) => {
            if (!success) {
              console.warn(`[AudioService] Failed to play SFX ${filename}`);
            }
            sound.release();
          });

          resolve({ success: true });
        });
      });
    } catch (error) {
      console.error(`[AudioService] Error playing SFX ${filename}:`, error);
      return { success: false, error };
    }
  }

  playFallbackSound(soundId) {
    console.log(`[AudioService] No sound mapped for: ${soundId}, trying keyword match`);
    
    // Smart keyword-based fallback
    const keywordMap = {
      'growl': 'monster_growl',
      'roar': 'monster_demon_roar_368663',
      'howl': 'monster_howl',
      'screech': 'flying_monster_screech',
      'scream': 'man_scream',
      'bite': 'monster_bite',
      'slash': 'sword_swing',
      'swing': 'sword_swing',
      'hit': 'hit_impact',
      'punch': 'classic_punch_impact',
      'fire': 'fire_spell_impact_448565',
      'ice': 'elemental_spell_impact_ice_448564',
      'magic': 'magic_sound',
      'spell': 'spell_cast',
      'door': 'door_open',
      'chest': 'chest_open',
      'coin': 'coin_pickup',
      'potion': 'potion_drink',
      'splash': 'big_rock_splash_467479',
      'wind': 'ominous_wind',
      'thunder': 'thunderstorm_ambience_2_19565',
      'ghost': 'ghost_eerie_ambiance',
      'zombie': 'zombie_moan_sfx_454252',
      'dragon': 'dragon_roar_4_364609',
      'wolf': 'monster_howl',
      'horse': 'horse_galloping',
      'bird': 'peaceful_birds',
      'crow': 'crow_calls_raspy_echoing_472377',
      'bell': 'bell',
      'drum': 'ancient_war_drums_463214',
      'step': 'footsteps',
      'walk': 'footsteps',
      'pain': 'cry_of_pain',
      'death': 'dramatic_death_collapse',
      'collapse': 'dramatic_death_collapse',
      'explosion': 'explosion_with_debri'
    };

    const lowerSoundId = soundId.toLowerCase();
    for (const [keyword, file] of Object.entries(keywordMap)) {
      if (lowerSoundId.includes(keyword)) {
        console.log(`[AudioService] Keyword fallback: ${soundId} -> ${file}`);
        this.playSfx(file);
        return { success: true, fallback: true, matched: keyword };
      }
    }

    // Try ElevenLabs as last resort
    if (this.elevenLabsSFX) {
      console.log(`[AudioService] Trying ElevenLabs for: ${soundId}`);
      this.trackSfx(soundId);
      this.elevenLabsSFX.generateAndPlay(soundId, this.volume.effects * this.volume.master);
      return { success: true, fallback: true, source: 'elevenlabs' };
    }

    console.warn(`[AudioService] No fallback found for: ${soundId}`);
    return { success: false, fallback: true };
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
