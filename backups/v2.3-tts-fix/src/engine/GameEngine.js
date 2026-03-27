import { CombatEngine } from './CombatEngine';
import { InventoryEngine } from './InventoryEngine';
import { EncounterEngine } from './EncounterEngine';
import { QuestEngine } from './QuestEngine';
import { MemoryEngine } from './MemoryEngine';
import { getLocationById, getRandomWeather } from '../data/locations';

export class GameEngine {
  constructor(aiService, speechService, audioService) {
    this.aiService = aiService;
    this.speechService = speechService;
    this.audioService = audioService;

    this.combatEngine = new CombatEngine();
    this.inventoryEngine = new InventoryEngine();
    this.encounterEngine = new EncounterEngine();
    this.questEngine = new QuestEngine();
    this.memoryEngine = new MemoryEngine();

    this.gameState = this.initializeGameState();
    this.eventListeners = {};
    this.commandHistory = [];
  }

  initializeGameState() {
    return {
      player: {
        name: 'Adventurer',
        health: 100,
        maxHealth: 100,
        attack: 10,
        defense: 5,
        level: 1,
        experience: 0,
        experienceToNext: 100
      },
      world: {
        currentLocation: 'dungeon_masters_hut',
        previousLocation: null,
        timeOfDay: 'morning',
        weather: 'clear',
        dayCount: 1
      },
      gameStarted: false,
      inIntro: true,
      recentEvents: [],
      turnCount: 0
    };
  }

  async startNewGame() {
    this.gameState = this.initializeGameState();
    this.questEngine.initializeQuests();

    // Immersive DM welcome sequence
    const welcomeMessage = "OH! Hello Adventurer, and welcome! Come, come, sit down and rest a while. Make yourself comfortable by the fire.";
    await this.speak(welcomeMessage);
    await this.audioService.playAmbient('crackling_fireplace');
    
    // Pause for effect
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const choiceMessage = "So, brave soul... Do you wish to embark on a brand NEW quest into the mystical Realm of AIDM Quests? Or would you like to CONTINUE from where you last ventured? Speak your choice.";
    await this.speak(choiceMessage);

    this.addEvent('Game initialized - awaiting choice');
    this.emit('gameStarted', { message: welcomeMessage + '\n\n' + choiceMessage });
    
    // Signal to auto-enable microphone after DM finishes speaking
    this.emit('awaitingVoiceInput', { prompt: 'Ready for your choice' });

    // Set timeout reminder if no response
    this.introReminderTimeout = setTimeout(async () => {
      if (this.gameState.inIntro) {
        const reminder = "I'm still here, Adventurer. Would you like a NEW quest, or shall we CONTINUE your previous adventure? Simply speak your choice.";
        await this.speak(reminder);
        // speak() awaits audio completion; small extra buffer for echo
        await new Promise(resolve => setTimeout(resolve, 800));
        this.emit('awaitingVoiceInput', { prompt: 'Still waiting for choice' });
      }
    }, 15000); // 15 seconds

    return { success: true, message: welcomeMessage + '\n\n' + choiceMessage };
  }

  async continueGame() {
    const loadResult = await this.memoryEngine.loadGame();

    if (!loadResult.success) {
      await this.speak("No previous adventure found. Let us begin anew.");
      return this.startNewGame();
    }

    this.loadState(loadResult.gameState);

    const location = getLocationById(this.gameState.world.currentLocation);
    const message = `Welcome back, Adventurer. You continue your journey in ${location.name}. ${location.description}`;

    await this.speak(message);
    await this.updateAmbientAudio();

    this.addEvent('Game loaded');
    // Text already added to UI via speak() -> narration event
    this.emit('gameLoaded', {});

    // Auto-enable mic after loading saved game
    await this.autoEnableMic('Ready for player action');

    return { success: true, message };
  }

  async processCommand(command) {
    console.log(`[GameEngine] processCommand called with: "${command}"`);
    this.commandHistory.push({ command, timestamp: Date.now() });
    this.gameState.turnCount++;

    const normalizedCommand = command.toLowerCase().trim();
    console.log(`[GameEngine] Normalized command: "${normalizedCommand}"`);
    console.log(`[GameEngine] inIntro: ${this.gameState.inIntro}, inCombat: ${this.combatEngine.isInCombat()}`);

    if (this.gameState.inIntro) {
      console.log('[GameEngine] Routing to handleIntroCommand');
      return this.handleIntroCommand(normalizedCommand);
    }

    if (this.combatEngine.isInCombat()) {
      return this.handleCombatCommand(normalizedCommand);
    }

    return this.handleExplorationCommand(normalizedCommand);
  }

  async handleIntroCommand(command) {
    console.log(`[GameEngine] handleIntroCommand called with: "${command}"`);
    
    // Clear the intro reminder timeout
    if (this.introReminderTimeout) {
      clearTimeout(this.introReminderTimeout);
      this.introReminderTimeout = null;
    }

    // New quest chosen
    if (command.includes('new') || command.includes('begin') || command.includes('start') || command.includes('fresh')) {
      console.log('[GameEngine] NEW quest branch triggered - starting epic door sequence');
      
      // Initial setup for the epic door sequence
      const doorMessage = "Ah, a NEW quest it is! Excellent choice. Come with me, Adventurer. Before us stands the Gateway to your destiny...";
      await this.speak(doorMessage);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        // Try to generate AI-powered cinematic door opening sequence
        console.log('[GameEngine] Requesting epic door narration from AI...');
        const epicDoorNarration = await this.aiService.generateEpicNarration('DOOR_OPENING', this.getState());
        
        if (epicDoorNarration && epicDoorNarration.length > 50) {
          console.log('[GameEngine] Epic narration received, length:', epicDoorNarration.length);
          await this.speak(epicDoorNarration);
        } else {
          throw new Error('Epic narration too short or empty');
        }
      } catch (error) {
        console.error('[GameEngine] Epic narration failed, using fallback sequence:', error);
        // Fallback to enhanced hardcoded sequence
        const fallbackSequence = "[VOLUME: ambient=0.1][VOLUME: music=0.2] Before us stands an ancient wooden door, weathered by countless ages. Its surface is carved with runes that pulse with a faint, ethereal glow. [SOUND: mystical hum] The air around it hums with magical energy, and you can feel the power radiating from its ancient wood. [VOLUME: music=0.4] I step forward and knock twice upon the door. [SOUND: door knocks] The sound echoes through the hut, resonating with otherworldly power. Now, watch closely as I speak the words of opening. [VOLUME: music=0.6] APERIO PORTAS MYSTICUS! [SOUND: magic] The runes blaze to life! [VOLUME: music=0.9] Ancient magic courses through the door frame, and the air crackles with arcane power! [SOUND: door open] With a thunderous groan, the door swings open, revealing a swirling portal of light and shadow beyond. [VOLUME: music=1.0] Step through, brave Adventurer. Your destiny awaits on the other side!";
        await this.speak(fallbackSequence);
      }
      
      // Play main theme after the epic sequence
      await this.audioService.playMusic('main_theme');
      
      // Mark intro complete and start actual game
      this.gameState.inIntro = false;
      this.gameState.gameStarted = true;
      
      // Move player to Whispering Forest (mystic forest starting location)
      this.gameState.world.currentLocation = 'whispering_forest';
      await this.updateAmbientAudio();
      
      // Generate first location with AI
      await this.startFirstLocation();
      
      return { success: true, message: 'Your adventure begins...', action: 'game_started' };
    }

    // Continue existing game
    if (command.includes('continue') || command.includes('load') || command.includes('resume')) {
      const continueMessage = "Ah yes, I remember you! Let me retrieve your tale from the archives...";
      await this.speak(continueMessage);
      return this.continueGame();
    }

    const message = "I didn't quite catch that. Would you like to start a NEW quest, or CONTINUE a previous adventure?";
    await this.speak(message);
    await new Promise(resolve => setTimeout(resolve, 800));
    this.emit('awaitingVoiceInput', { prompt: 'Waiting for NEW or CONTINUE' });
    return { success: false, message };
  }

  async handleCombatCommand(command) {
    const playerStats = this.getPlayerStats();

    if (command.includes('attack') || command.includes('fight') || command.includes('strike') || command.includes('hit') || command.includes('slash') || command.includes('swing') || command.includes('smash') || command.includes('stab')) {
      const result = this.combatEngine.playerAttack(playerStats);
      
      if (result.success) {
        // Play sword swing SFX for player attack
        await this.audioService.playSfx('sword_swing');
        this.gameState.player.health = result.playerHealth;

        if (this.gameState.player.health <= 0) {
          await this.handleCombatEnd({ victory: false, enemy: this.combatEngine.getCurrentEnemy() });
          return { success: true, message: 'You have been defeated...', combatOver: true, victory: false };
        }

        if (result.combatOver === true) {
          // Play enemy death SFX
          await this.playCombatSfx(result.enemy, 'death');
          await this.handleCombatEnd(result);
          return result;
        } else {
          // Emit updated enemy state as a chat bubble
          const enemy = this.combatEngine.getCurrentEnemy();
          this.emit('enemyUpdate', { enemy: { ...enemy }, message: enemy.sounds?.hit || 'Recoils from the blow...' });
          // Play enemy attack SFX for counter-attack
          await this.playCombatSfx(enemy, 'attack');
          await this.speak(result.message);
          // Prompt for next combat action
          await new Promise(resolve => setTimeout(resolve, 1500));
          const enemyHealthPct = this.combatEngine.getCurrentEnemy() ? Math.round((this.combatEngine.getCurrentEnemy().health / (result.enemy?.health || 100)) * 100) : 50;
          const playerHealthPct = Math.round((this.gameState.player.health / this.gameState.player.maxHealth) * 100);
          let combatAdvice = 'What is your next move?';
          if (playerHealthPct < 30) combatAdvice = 'You are badly wounded! Use a healing potion or defend yourself! What will you do?';
          else if (enemyHealthPct < 25) combatAdvice = 'The enemy staggers, nearly defeated! Press the attack! What will you do?';
          else combatAdvice = 'The battle rages on! Attack, Defend, Flee, or Use an item. What is your next move?';
          await this.speak(combatAdvice);
          await new Promise(resolve => setTimeout(resolve, 800));
          this.emit('awaitingVoiceInput', { prompt: 'Combat action needed' });
        }

        return result;
      }
    }

    if (command.includes('defend') || command.includes('block') || command.includes('guard') || command.includes('shield') || command.includes('protect') || command.includes('brace')) {
      const result = this.combatEngine.playerDefend(playerStats);
      
      if (result.success) {
        // Emit enemy update bubble for defend round
        const defEnemy = this.combatEngine.getCurrentEnemy();
        this.emit('enemyUpdate', { enemy: { ...defEnemy }, message: defEnemy.sounds?.attack || 'Attacks!' });
        // Play enemy attack SFX (player is defending)
        await this.playCombatSfx(defEnemy, 'attack');
        this.gameState.player.health = result.playerHealth;

        if (this.gameState.player.health <= 0) {
          await this.handleCombatEnd({ victory: false, enemy: this.combatEngine.getCurrentEnemy() });
          return { success: true, message: 'You have been defeated...', combatOver: true, victory: false };
        }

        await this.speak(result.message);
        // Prompt for next combat action with tactical advice
        await new Promise(resolve => setTimeout(resolve, 1500));
        const defPlayerHealthPct = Math.round((this.gameState.player.health / this.gameState.player.maxHealth) * 100);
        let defAdvice = 'Your defense held! Now strike back with an attack, or continue defending!';
        if (defPlayerHealthPct < 30) defAdvice = 'You blocked the blow, but you are gravely wounded! Use a healing potion quickly, or try to flee!';
        await this.speak(defAdvice);
        await new Promise(resolve => setTimeout(resolve, 800));
        this.emit('awaitingVoiceInput', { prompt: 'Combat action needed' });
        return result;
      }
    }

    if (command.includes('flee') || command.includes('run') || command.includes('escape') || command.includes('retreat') || command.includes('back away') || command.includes('get away')) {
      const result = this.combatEngine.playerFlee(playerStats);
      
      if (result.fled) {
        await this.speak(result.message);
        await this.updateAmbientAudio();
        this.emit('combatEnded', { victory: false, fled: true });
        
        // Auto-enable mic after escaping combat
        await this.autoEnableMic('Post-flee action');
      } else if (result.success === false) {
        // Emit enemy update for failed flee
        const fleeEnemy = this.combatEngine.getCurrentEnemy();
        if (fleeEnemy) {
          this.emit('enemyUpdate', { enemy: { ...fleeEnemy }, message: fleeEnemy.sounds?.attack || 'Strikes as you try to escape!' });
        }
        this.gameState.player.health = result.playerHealth;

        if (this.gameState.player.health <= 0) {
          await this.handleCombatEnd({ victory: false, enemy: this.combatEngine.getCurrentEnemy() });
          return { success: true, message: 'You have been defeated...', combatOver: true, victory: false };
        }

        await this.speak(result.message);
        // Prompt for next combat action after failed flee
        await new Promise(resolve => setTimeout(resolve, 1000));
        await this.speak('What is your next move?');
        await new Promise(resolve => setTimeout(resolve, 800));
        this.emit('awaitingVoiceInput', { prompt: 'Combat action needed' });
      }

      return result;
    }

    if (command.includes('use') || command.includes('drink') || command.includes('potion')) {
      const item = this.findItemInCommand(command);
      if (item) {
        return this.useItemInCombat(item);
      }
    }

    const message = "In combat, you can: attack, defend, flee, or use an item. What will you do?";
    await this.speak(message);
    await new Promise(resolve => setTimeout(resolve, 800));
    this.emit('awaitingVoiceInput', { prompt: 'Combat action needed' });
    return { success: false, message };
  }

  async handleExplorationCommand(command) {
    if (command.includes('explore') || command.includes('forward') || command.includes('move') || command.includes('go')) {
      return this.explore();
    }

    if (command.includes('inventory') || command.includes('items') || command.includes('bag')) {
      return this.checkInventory();
    }

    if (command.includes('status') || command.includes('stats') || command.includes('health')) {
      return this.checkStatus();
    }

    if (command.includes('quest')) {
      return this.checkQuests();
    }

    if (command.includes('use') || command.includes('drink') || command.includes('consume')) {
      const item = this.findItemInCommand(command);
      if (item) {
        return this.useItem(item);
      }
    }

    if (command.includes('equip') || command.includes('wear') || command.includes('wield')) {
      const item = this.findItemInCommand(command);
      if (item) {
        return this.equipItem(item);
      }
    }

    if (command.includes('look') || command.includes('observe') || command.includes('inspect')) {
      return this.lookAround();
    }

    if (command.includes('rest') || command.includes('sleep') || command.includes('camp')) {
      return this.rest();
    }

    if (command.includes('save')) {
      const saveResult = await this.saveGame();
      await this.autoEnableMic('Post-save action');
      return saveResult;
    }

    if (command.includes('help') || command.includes('commands')) {
      return this.showHelp();
    }

    const aiResponse = await this.aiService.processAction(command, this.getContextForAI());
    await this.speak(aiResponse);
    
    // Auto-enable mic after AI response
    await this.autoEnableMic('Post-AI response');
    return { success: true, message: aiResponse, action: 'ai_response' };
  }

  async explore() {
    const location = getLocationById(this.gameState.world.currentLocation);

    if (this.gameState.world.currentLocation === 'dungeon_masters_hut' && this.gameState.gameStarted) {
      this.gameState.world.currentLocation = 'mystic_gateway';
      const newLocation = getLocationById('mystic_gateway');
      
      const message = `You step through the magical portal. Reality shifts around you. ${newLocation.narrativeIntro} ${newLocation.description}`;
      
      await this.speak(message);
      await this.updateAmbientAudio();
      
      // Auto-enable mic after arriving at new location
      await this.autoEnableMic('Ready for next action');
      
      return { success: true, message, action: 'moved' };
    }

    const encounterCheck = this.encounterEngine.checkForEncounter(
      this.gameState.world.currentLocation,
      this.gameState.player.level
    );

    if (encounterCheck.encounterTriggered) {
      return this.handleEncounter(encounterCheck.encounter);
    }

    const aiContext = this.getContextForAI();
    const rawNarrative = await this.aiService.generateExploration(aiContext);
    
    await this.speak(rawNarrative);

    const shouldMove = Math.random() > 0.5;
    if (shouldMove && location.connections.length > 0) {
      const randomConnection = location.connections[Math.floor(Math.random() * location.connections.length)];
      this.gameState.world.previousLocation = this.gameState.world.currentLocation;
      this.gameState.world.currentLocation = randomConnection;
      
      await this.updateAmbientAudio();
      
      const questResults = this.questEngine.checkLocationObjectives(randomConnection);
      if (questResults.length > 0) {
        await this.handleQuestUpdates(questResults);
      }
    }

    // Prompt player for next action
    await new Promise(resolve => setTimeout(resolve, 1500));
    const prompt = "What would you like to do next, Adventurer?";
    await this.speak(prompt);
    // speak() awaits audio completion; short buffer for echo
    await new Promise(resolve => setTimeout(resolve, 800));
    this.emit('awaitingVoiceInput', { prompt: 'Ready for next action' });

    return { success: true, message: rawNarrative, action: 'explored' };
  }

  async handleEncounter(encounter) {
    if (encounter.type === 'enemy') {
      // Pass location type so encounter intro matches the environment
      const location = getLocationById(this.gameState.world.currentLocation);
      const locationType = location?.type || 'generic';
      const combatResult = this.combatEngine.startCombat(encounter.enemy, this.getPlayerStats(), locationType);
      // Sound cues are now embedded in the combat line templates
      await this.speak(combatResult.message);
      await this.audioService.playAmbient('combat_music');
      
      this.addEvent(`Combat started: ${encounter.enemy.name}`);
      this.emit('combatStarted', { enemy: encounter.enemy });
      
      // Prompt player for combat action and activate mic
      await new Promise(resolve => setTimeout(resolve, 1500));
      const healthTip = this.gameState.player.health < this.gameState.player.maxHealth * 0.5
        ? 'Your wounds ache. Consider using a healing potion if you have one!'
        : 'You feel strong and ready for battle!';
      const combatPrompt = `A ${encounter.enemy.name} stands before you! ${healthTip} You can ATTACK to strike the enemy, DEFEND to reduce incoming damage, FLEE to try escaping, or USE a potion. What will you do, Adventurer?`;
      await this.speak(combatPrompt);
      await new Promise(resolve => setTimeout(resolve, 800));
      this.emit('awaitingVoiceInput', { prompt: 'Combat action needed' });
      
      return { success: true, message: combatResult.message + '\n\n' + combatPrompt, action: 'combat_started', encounter };
    }

    if (encounter.type === 'treasure') {
      encounter.items.forEach(item => {
        this.inventoryEngine.addItem(item.itemId, item.quantity);
      });
      
      await this.speak(encounter.message);
      await this.audioService.playSound('treasure_found');
      
      this.addEvent('Found treasure');
      
      // Auto-enable mic after finding treasure
      await this.autoEnableMic('Post-treasure action');
      
      return { success: true, message: encounter.message, action: 'treasure_found', encounter };
    }

    if (encounter.type === 'event') {
      await this.speak(encounter.message);
      const rawAiResponse = await this.aiService.handleEvent(encounter, this.getContextForAI());
      await this.speak(rawAiResponse);
      
      this.addEvent(`Event: ${encounter.event}`);
      
      // Auto-enable mic after event
      await this.autoEnableMic('Post-event action');
      
      return { success: true, message: encounter.message + ' ' + rawAiResponse, action: 'event', encounter };
    }

    return { success: false, message: 'Unknown encounter type' };
  }

  async handleCombatEnd(result) {
    if (result.victory) {
      result.loot.forEach(loot => {
        this.inventoryEngine.addItem(loot.itemId, loot.quantity);
      });

      const expGain = result.enemy.level * 25;
      this.gainExperience(expGain);

      const questResults = this.questEngine.checkEnemyKillObjectives(result.enemy.id);
      
      let message = result.message + ` You gain ${expGain} experience.`;
      await this.speak(message);
      await this.audioService.playSound('victory');
      await this.updateAmbientAudio();

      if (questResults.length > 0) {
        await this.handleQuestUpdates(questResults);
      }

      this.addEvent(`Defeated ${result.enemy.name}`);
      this.emit('combatEnded', { victory: true });
      
      // Auto-enable mic after combat victory
      await this.autoEnableMic('Post-combat action');
    } else {
      await this.audioService.playSfx('character_death');
      const message = "You have been defeated. Your vision fades to black... You awaken back at the Dungeon Master's hut.";
      await this.speak(message);
      
      this.gameState.player.health = Math.floor(this.gameState.player.maxHealth * 0.5);
      this.gameState.world.currentLocation = 'dungeon_masters_hut';
      
      await this.updateAmbientAudio();
      this.addEvent('Defeated in combat');
      this.emit('combatEnded', { victory: false });
      
      // Prompt player after respawn
      await this.promptAndListen('You awaken by the fire, battered but alive. What would you like to do, Adventurer?', 'Post-defeat action');
    }
  }

  async useItem(itemId) {
    const result = this.inventoryEngine.useItem(itemId);
    
    if (!result.success) {
      await this.speak(result.message);
      await this.autoEnableMic('Post-item-fail action');
      return result;
    }

    if (result.effect.type === 'heal') {
      this.gameState.player.health = Math.min(
        this.gameState.player.maxHealth,
        this.gameState.player.health + result.effect.value
      );
      
      const message = `${result.message} You restored ${result.effect.value} health. Current health: ${this.gameState.player.health}`;
      await this.speak(message);
      await this.autoEnableMic('Post-item action');
      return { success: true, message };
    }

    await this.speak(result.message);
    await this.autoEnableMic('Post-item action');
    return result;
  }

  async useItemInCombat(itemId) {
    const result = this.inventoryEngine.useItem(itemId);
    
    if (!result.success) {
      await this.speak(result.message);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.speak('What is your next move?');
      await new Promise(resolve => setTimeout(resolve, 800));
      this.emit('awaitingVoiceInput', { prompt: 'Combat action needed' });
      return result;
    }

    if (result.effect.type === 'heal') {
      this.gameState.player.health = Math.min(
        this.gameState.player.maxHealth,
        this.gameState.player.health + result.effect.value
      );
    }

    const playerStats = this.getPlayerStats();
    const enemyResult = this.combatEngine.enemyAttack(playerStats);
    this.gameState.player.health = enemyResult.playerHealth;

    if (this.gameState.player.health <= 0) {
      await this.handleCombatEnd({ victory: false, enemy: this.combatEngine.getCurrentEnemy() });
      return { success: true, message: 'You have been defeated...', combatOver: true, victory: false };
    }

    const message = `${result.message} ${enemyResult.message}`;
    await this.speak(message);
    
    // Prompt for next combat action after using item
    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.speak('What is your next move?');
    await new Promise(resolve => setTimeout(resolve, 800));
    this.emit('awaitingVoiceInput', { prompt: 'Combat action needed' });

    return { success: true, message, combatContinues: true };
  }

  async equipItem(itemId) {
    const result = this.inventoryEngine.equipItem(itemId);
    await this.speak(result.message);
    await this.autoEnableMic('Post-equip action');
    return result;
  }

  async checkInventory() {
    const description = this.inventoryEngine.getInventoryDescription();
    await this.speak(description);
    await this.autoEnableMic('Post-inventory action');
    return { success: true, message: description };
  }

  async checkStatus() {
    const stats = this.getPlayerStats();
    const message = `You are a level ${stats.level} adventurer. Health: ${stats.health} out of ${stats.maxHealth}. Attack: ${stats.attack}. Defense: ${stats.defense}. Experience: ${this.gameState.player.experience} out of ${this.gameState.player.experienceToNext}.`;
    
    await this.speak(message);
    await this.autoEnableMic('Post-status action');
    return { success: true, message };
  }

  async checkQuests() {
    const description = this.questEngine.getQuestDescription();
    await this.speak(description);
    await this.autoEnableMic('Post-quest check');
    return { success: true, message: description };
  }

  async lookAround() {
    const location = getLocationById(this.gameState.world.currentLocation);
    const aiContext = this.getContextForAI();
    const description = await this.aiService.describeLocation(location, aiContext);
    
    await this.speak(description);
    await this.autoEnableMic('Post-look action');
    return { success: true, message: description };
  }

  async rest() {
    const location = getLocationById(this.gameState.world.currentLocation);
    
    if (location.type !== 'safe_zone') {
      const message = "This location is too dangerous to rest. Find a safe place first.";
      await this.speak(message);
      await this.autoEnableMic('Post-rest-fail action');
      return { success: false, message };
    }

    this.gameState.player.health = this.gameState.player.maxHealth;
    await this.saveGame();

    const message = "You rest peacefully. Your health is fully restored, and your progress has been saved.";
    await this.speak(message);
    await this.audioService.playSound('rest_complete');
    
    await this.autoEnableMic('Post-rest action');
    return { success: true, message };
  }

  async saveGame() {
    const result = await this.memoryEngine.saveGame(this.getState());
    if (result.success) {
      await this.speak('Your progress has been saved.');
    } else {
      await this.speak('Failed to save game. Please try again.');
    }
    return result;
  }

  async showHelp() {
    const message = "You can use the following commands: explore, attack, defend, flee, use item, equip item, inventory, status, quests, look, rest, save, and help. Simply speak naturally, and I will understand your intent.";
    await this.speak(message);
    await this.autoEnableMic('Post-help action');
    return { success: true, message };
  }

  async gainExperience(amount) {
    this.gameState.player.experience += amount;

    while (this.gameState.player.experience >= this.gameState.player.experienceToNext) {
      await this.levelUp();
    }
  }

  async levelUp() {
    this.gameState.player.level++;
    this.gameState.player.experience -= this.gameState.player.experienceToNext;
    this.gameState.player.experienceToNext = Math.floor(this.gameState.player.experienceToNext * 1.5);

    this.gameState.player.maxHealth += 20;
    this.gameState.player.health = this.gameState.player.maxHealth;
    this.gameState.player.attack += 3;
    this.gameState.player.defense += 2;

    const message = `Level up! You are now level ${this.gameState.player.level}. Your stats have increased!`;
    await this.speak(message);
    await this.audioService.playSound('level_up');
    this.addEvent(`Reached level ${this.gameState.player.level}`);
  }

  getPlayerStats() {
    const equippedStats = this.inventoryEngine.getEquippedStats();
    
    return {
      ...this.gameState.player,
      attack: this.gameState.player.attack + equippedStats.attack,
      defense: this.gameState.player.defense + equippedStats.defense
    };
  }

  findItemInCommand(command) {
    const inventory = this.inventoryEngine.getInventoryList();
    
    for (const item of inventory) {
      const itemName = item.name.toLowerCase();
      if (command.includes(itemName)) {
        return item.id;
      }
    }

    if (command.includes('potion') && this.inventoryEngine.hasItem('healing_potion')) {
      return 'healing_potion';
    }

    return null;
  }

  async handleQuestUpdates(questResults) {
    for (const result of questResults) {
      await this.speak(result.message);
      
      if (result.questComplete && result.rewards) {
        if (result.rewards.experience) {
          this.gainExperience(result.rewards.experience);
        }
        
        if (result.rewards.items) {
          result.rewards.items.forEach(item => {
            this.inventoryEngine.addItem(item.itemId, item.quantity);
          });
        }
      }
    }
  }

  async updateAmbientAudio() {
    const location = getLocationById(this.gameState.world.currentLocation);
    
    if (location && location.ambientSound) {
      // Play new location's ambient (will stop old one if different)
      await this.audioService.playAmbient(location.ambientSound);
    } else {
      // Location has no ambient sound, stop any playing ambient
      await this.audioService.stopAmbient();
    }
  }

  async startFirstLocation() {
    // AI generates the first location dynamically with epic narration
    const location = getLocationById(this.gameState.world.currentLocation);
    const aiContext = {
      player: this.gameState.player,
      world: this.gameState.world,
      location: location,
      inventory: this.inventoryEngine.getInventoryList(),
      justStarted: true,
      audioState: this.audioService.getAudioState()
    };
    
    let questStartNarrative;
    
    try {
      // Try to use epic narration for the quest start - this is a pivotal moment
      console.log('[GameEngine] Requesting epic quest start narration from AI...');
      questStartNarrative = await this.aiService.generateEpicNarration('QUEST_START', aiContext);
      
      if (!questStartNarrative || questStartNarrative.length < 50) {
        throw new Error('Quest start narration too short or empty');
      }
      console.log('[GameEngine] Epic quest start received, length:', questStartNarrative.length);
    } catch (error) {
      console.error('[GameEngine] Epic quest start failed, using regular exploration:', error);
      // Fallback to regular exploration narration
      questStartNarrative = await this.aiService.generateExploration(aiContext);
    }
    
    await this.speak(questStartNarrative);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    this.addEvent('Adventure began');
    
    // Save game immediately after starting so continue works
    await this.saveGame();
    
    // Auto-enable mic without extra prompt - player can respond naturally
    await this.autoEnableMic('Ready for player action');
    
    return { success: true, message: questStartNarrative };
  }

  getContextForAI() {
    const location = getLocationById(this.gameState.world.currentLocation);
    
    return {
      player: this.getPlayerStats(),
      location,
      inventory: this.inventoryEngine.getInventoryList(),
      quests: this.questEngine.getActiveQuests(),
      recentEvents: this.gameState.recentEvents.slice(-5),
      inCombat: this.combatEngine.isInCombat(),
      currentEnemy: this.combatEngine.getCurrentEnemy(),
      audioState: this.audioService.getAudioState()
    };
  }

  async speak(message) {
    if (!this.speechService) return;
    
    // Parse message into ordered timeline segments (text, sound, volume)
    const segments = this.parseMessageSegments(message);
    const isLastSegment = (i) => i === segments.length - 1;
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      
      if (segment.type === 'volume') {
        // Apply volume change instantly - no pause needed
        await this.applyVolumeCue(segment);
        
      } else if (segment.type === 'sound') {
        // Play sound effect and pause to let it register
        await this.playSoundCue(segment.content);
        await new Promise(resolve => setTimeout(resolve, 700));
        
      } else if (segment.type === 'text') {
        // Safety: strip any cues that the parser might have missed
        let cleanContent = this.aiService.stripSoundCues(segment.content);
        cleanContent = this.aiService.stripVolumeCues(cleanContent);
        cleanContent = cleanContent.replace(/\s+/g, ' ').trim();
        if (!cleanContent) continue;
        
        // Display full text in UI and speak as one block
        this.emit('narration', { message: cleanContent });
        await this.speechService.speak(cleanContent);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
  }

  parseMessageSegments(text) {
    // Parse message into ordered timeline: text, sound cues, volume cues
    // This preserves the interleaving so sounds play at the right moment
    const segments = [];
    const cueRegex = /\[(?:SOUND|VOLUME):\s*[^\]]+\]/gi;
    let lastIndex = 0;
    let match;
    
    while ((match = cueRegex.exec(text)) !== null) {
      // Capture any text before this cue
      if (match.index > lastIndex) {
        const textBefore = text.substring(lastIndex, match.index).trim();
        if (textBefore.length > 0) {
          segments.push({ type: 'text', content: textBefore });
        }
      }
      
      // Parse the cue itself
      const cueStr = match[0];
      
      if (/\[SOUND:/i.test(cueStr)) {
        const soundMatch = cueStr.match(/\[SOUND:\s*([^\]]+)\]/i);
        if (soundMatch) {
          segments.push({ type: 'sound', content: soundMatch[1].trim() });
        }
      } else if (/\[VOLUME:/i.test(cueStr)) {
        const volMatch = cueStr.match(/\[VOLUME:\s*([a-z]+)=([\d.]+)\]/i);
        if (volMatch) {
          const value = parseFloat(volMatch[2]);
          if (!isNaN(value) && value >= 0 && value <= 1) {
            segments.push({ 
              type: 'volume', 
              volumeType: volMatch[1].trim().toLowerCase(), 
              value 
            });
          }
        }
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Remaining text after the last cue
    if (lastIndex < text.length) {
      const remaining = text.substring(lastIndex).trim();
      if (remaining.length > 0) {
        segments.push({ type: 'text', content: remaining });
      }
    }
    
    // If no cues found at all, treat entire text as one segment
    if (segments.length === 0 && text.trim().length > 0) {
      segments.push({ type: 'text', content: text.trim() });
    }
    
    return segments;
  }

  async applyVolumeCue(segment) {
    console.log(`[GameEngine] Setting ${segment.volumeType} volume to ${segment.value}`);
    switch (segment.volumeType) {
      case 'ambient':
        await this.setAmbientVolume(segment.value);
        break;
      case 'music':
        await this.setMusicVolume(segment.value);
        break;
      case 'effects':
        await this.setEffectsVolume(segment.value);
        break;
      case 'master':
        await this.setMasterVolume(segment.value);
        break;
      default:
        console.warn(`[GameEngine] Unknown volume type: ${segment.volumeType}`);
    }
  }

  async playSoundCue(description) {
    // Normalize AI description to match sound map keys
    // e.g. "door knocks" → "door_knocks", "heavy breathing" → "heavy_breathing"
    const normalized = description.toLowerCase().trim().replace(/\s+/g, '_');
    
    // 1. Try exact match on normalized key
    let soundFile = this.audioService.getSoundFile(normalized);
    if (soundFile) {
      console.log(`[GameEngine] Sound exact match: "${description}" → ${soundFile}`);
      await this.audioService.playSfx(soundFile);
      return;
    }
    
    // 2. Try original description as key
    soundFile = this.audioService.getSoundFile(description);
    if (soundFile) {
      console.log(`[GameEngine] Sound original match: "${description}" → ${soundFile}`);
      await this.audioService.playSfx(soundFile);
      return;
    }
    
    // 3. Fall back to keyword matching
    console.log(`[GameEngine] Sound keyword fallback for: "${description}"`);
    this.audioService.playFallbackSound(description);
  }

  async playCombatSfx(enemy, event) {
    if (enemy && enemy.sfx && enemy.sfx[event]) {
      await this.audioService.playSfx(enemy.sfx[event]);
    }
  }

  async processSoundCues(text) {
    // Legacy method - now handled by parseMessageSegments + speak
    // Keep for any code that still calls it directly
    const segments = this.parseMessageSegments(text);
    for (const segment of segments) {
      if (segment.type === 'volume') {
        await this.applyVolumeCue(segment);
      } else if (segment.type === 'sound') {
        await this.playSoundCue(segment.content);
      }
    }
    let cleanText = this.aiService.stripSoundCues(text);
    cleanText = this.aiService.stripVolumeCues(cleanText);
    return cleanText;
  }

  // Audio volume controls for AI to use dynamically
  async setAmbientVolume(volume) {
    if (this.audioService) {
      await this.audioService.setAmbientVolume(volume);
      this.addEvent(`Ambient volume set to ${Math.round(volume * 100)}%`);
    }
  }

  async setMusicVolume(volume) {
    if (this.audioService) {
      await this.audioService.setMusicVolume(volume);
      this.addEvent(`Music volume set to ${Math.round(volume * 100)}%`);
    }
  }

  async setEffectsVolume(volume) {
    if (this.audioService) {
      await this.audioService.setEffectsVolume(volume);
      this.addEvent(`Effects volume set to ${Math.round(volume * 100)}%`);
    }
  }

  async setMasterVolume(volume) {
    if (this.audioService) {
      await this.audioService.setMasterVolume(volume);
      this.addEvent(`Master volume set to ${Math.round(volume * 100)}%`);
    }
  }

  getCurrentVolumes() {
    if (this.audioService) {
      return this.audioService.getVolume();
    }
    return null;
  }

  async promptAndListen(prompt, context = 'Ready for input') {
    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.speak(prompt);
    // speak() already awaits audio completion + 300ms buffer
    // Add extra buffer to prevent mic from capturing residual audio
    await new Promise(resolve => setTimeout(resolve, 800));
    this.emit('awaitingVoiceInput', { prompt: context });
  }

  async autoEnableMic(context = 'Ready for input') {
    // Enable mic after narration without additional prompts
    // speak() already includes buffers, so just small delay
    await new Promise(resolve => setTimeout(resolve, 800));
    this.emit('awaitingVoiceInput', { prompt: context });
  }

  addEvent(event) {
    this.gameState.recentEvents.push({
      event,
      timestamp: Date.now(),
      location: this.gameState.world.currentLocation
    });

    if (this.gameState.recentEvents.length > 20) {
      this.gameState.recentEvents.shift();
    }
  }

  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  emit(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => callback(data));
    }
  }

  getState() {
    return {
      gameState: this.gameState,
      combat: this.combatEngine.getState(),
      inventory: this.inventoryEngine.getState(),
      encounters: this.encounterEngine.getState(),
      quests: this.questEngine.getState()
    };
  }

  loadState(state) {
    if (state) {
      this.gameState = state.gameState || this.initializeGameState();
      this.combatEngine.loadState(state.combat);
      this.inventoryEngine.loadState(state.inventory);
      this.encounterEngine.loadState(state.encounters);
      this.questEngine.loadState(state.quests);
    }
  }
}
