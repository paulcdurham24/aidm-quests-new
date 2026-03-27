import AsyncStorage from '@react-native-async-storage/async-storage';

export class MemoryEngine {
  constructor() {
    this.saveKey = '@AIDM_Quests_SaveData';
    this.autoSaveInterval = null;
  }

  async saveGame(gameState) {
    try {
      const saveData = {
        version: '1.0.0',
        timestamp: Date.now(),
        gameState
      };

      const jsonData = JSON.stringify(saveData);
      await AsyncStorage.setItem(this.saveKey, jsonData);

      return { success: true, message: 'Game saved successfully' };
    } catch (error) {
      console.error('Error saving game:', error);
      return { success: false, message: 'Failed to save game', error };
    }
  }

  async loadGame() {
    try {
      const jsonData = await AsyncStorage.getItem(this.saveKey);
      
      if (jsonData === null) {
        return { success: false, message: 'No save data found' };
      }

      const saveData = JSON.parse(jsonData);
      
      return {
        success: true,
        message: 'Game loaded successfully',
        gameState: saveData.gameState,
        timestamp: saveData.timestamp
      };
    } catch (error) {
      console.error('Error loading game:', error);
      return { success: false, message: 'Failed to load game', error };
    }
  }

  async saveExists() {
    try {
      const jsonData = await AsyncStorage.getItem(this.saveKey);
      return jsonData !== null;
    } catch (error) {
      console.error('Error checking save:', error);
      return false;
    }
  }

  async deleteSave() {
    try {
      await AsyncStorage.removeItem(this.saveKey);
      return { success: true, message: 'Save data deleted' };
    } catch (error) {
      console.error('Error deleting save:', error);
      return { success: false, message: 'Failed to delete save', error };
    }
  }

  async createBackup() {
    try {
      const jsonData = await AsyncStorage.getItem(this.saveKey);
      
      if (jsonData === null) {
        return { success: false, message: 'No save data to backup' };
      }

      const backupKey = `${this.saveKey}_backup_${Date.now()}`;
      await AsyncStorage.setItem(backupKey, jsonData);

      return { success: true, message: 'Backup created', backupKey };
    } catch (error) {
      console.error('Error creating backup:', error);
      return { success: false, message: 'Failed to create backup', error };
    }
  }

  async listBackups() {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const backupKeys = allKeys.filter(key => key.startsWith(`${this.saveKey}_backup_`));
      
      const backups = await Promise.all(
        backupKeys.map(async (key) => {
          const data = await AsyncStorage.getItem(key);
          const parsed = JSON.parse(data);
          return {
            key,
            timestamp: parsed.timestamp
          };
        })
      );

      return { success: true, backups };
    } catch (error) {
      console.error('Error listing backups:', error);
      return { success: false, message: 'Failed to list backups', error };
    }
  }

  async restoreBackup(backupKey) {
    try {
      const backupData = await AsyncStorage.getItem(backupKey);
      
      if (backupData === null) {
        return { success: false, message: 'Backup not found' };
      }

      await AsyncStorage.setItem(this.saveKey, backupData);
      
      return { success: true, message: 'Backup restored successfully' };
    } catch (error) {
      console.error('Error restoring backup:', error);
      return { success: false, message: 'Failed to restore backup', error };
    }
  }

  startAutoSave(gameEngine, intervalMinutes = 5) {
    if (this.autoSaveInterval) {
      this.stopAutoSave();
    }

    this.autoSaveInterval = setInterval(() => {
      const gameState = gameEngine.getState();
      this.saveGame(gameState).then(result => {
        if (result.success) {
          console.log('Auto-save completed');
        }
      });
    }, intervalMinutes * 60 * 1000);

    return { success: true, message: `Auto-save enabled (every ${intervalMinutes} minutes)` };
  }

  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
      return { success: true, message: 'Auto-save disabled' };
    }
    return { success: false, message: 'Auto-save was not running' };
  }

  async savePlayerPreferences(preferences) {
    try {
      const prefKey = '@AIDM_Quests_Preferences';
      const jsonData = JSON.stringify(preferences);
      await AsyncStorage.setItem(prefKey, jsonData);
      return { success: true };
    } catch (error) {
      console.error('Error saving preferences:', error);
      return { success: false, error };
    }
  }

  async loadPlayerPreferences() {
    try {
      const prefKey = '@AIDM_Quests_Preferences';
      const jsonData = await AsyncStorage.getItem(prefKey);
      
      if (jsonData === null) {
        return {
          success: true,
          preferences: {
            voiceSpeed: 1.0,
            voicePitch: 1.0,
            volume: 1.0,
            autoSave: true,
            narrationVerbosity: 'detailed'
          }
        };
      }

      return {
        success: true,
        preferences: JSON.parse(jsonData)
      };
    } catch (error) {
      console.error('Error loading preferences:', error);
      return { success: false, error };
    }
  }
}
