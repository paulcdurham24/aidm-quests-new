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
        // Wait for speech to complete before activating mic
        await new Promise(resolve => setTimeout(resolve, 3000));
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
    this.emit('gameLoaded', { message });

    // Prompt player for action after loading saved game
    await this.promptAndListen('What would you like to do, Adventurer?', 'Ready for player action');

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
      console.log('[GameEngine] NEW quest branch triggered - starting door sequence');
      // Mystical door sequence
      const doorMessage = "Ah, a NEW quest it is! Excellent choice. Come with me, Adventurer.";
      await this.speak(doorMessage);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const doorSequence = "Before us stands an old wooden door, weathered by time and magic. Watch closely...";
      await this.speak(doorSequence);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const knockMessage = "I knock twice upon the ancient wood...";
      await this.speak(knockMessage);
      await this.audioService.playSound('door_knocks');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const magicWord = "APERIO PORTAS MYSTICUS!";
      await this.speak(magicWord);
      await this.audioService.playSound('magic');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const doorOpens = "The door blazes with ethereal light! The runes dance and shimmer! And now... it opens...";
      await this.speak(doorOpens);
      await this.audioService.playSound('door_open');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const guidance = "Step through, brave Adventurer. Your destiny awaits!";
      await this.speak(guidance);
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
    await new Promise(resolve => setTimeout(resolve, 3000));
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
          // Play enemy attack SFX for counter-attack
          await this.playCombatSfx(this.combatEngine.getCurrentEnemy(), 'attack');
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
          await new Promise(resolve => setTimeout(resolve, 3000));
          this.emit('awaitingVoiceInput', { prompt: 'Combat action needed' });
        }

        return result;
      }
    }

    if (command.includes('defend') || command.includes('block') || command.includes('guard') || command.includes('shield') || command.includes('protect') || command.includes('brace')) {
      const result = this.combatEngine.playerDefend(playerStats);
      
      if (result.success) {
        // Play enemy attack SFX (player is defending)
        await this.playCombatSfx(this.combatEngine.getCurrentEnemy(), 'attack');
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
        await new Promise(resolve => setTimeout(resolve, 3000));
        this.emit('awaitingVoiceInput', { prompt: 'Combat action needed' });
        return result;
      }
    }

    if (command.includes('flee') || command.includes('run') || command.includes('escape') || command.includes('retreat') || command.includes('back away') || command.includes('get away')) {
      const result = this.combatEngine.playerFlee(playerStats);
      
      if (result.fled) {
        await this.speak(result.message);
        await this.updateAmbientAudio();
        
        // Prompt player after escaping combat
        await this.promptAndListen('You escaped! What would you like to do next, Adventurer?', 'Post-flee action');
      } else if (result.success === false) {
        this.gameState.player.health = result.playerHealth;

        if (this.gameState.player.health <= 0) {
          await this.handleCombatEnd({ victory: false, enemy: this.combatEngine.getCurrentEnemy() });
          return { success: true, message: 'You have been defeated...', combatOver: true, victory: false };
        }

        await this.speak(result.message);
        // Prompt for next combat action after failed flee
        await new Promise(resolve => setTimeout(resolve, 1500));
        await this.speak('What is your next move?');
        await new Promise(resolve => setTimeout(resolve, 3000));
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
    await new Promise(resolve => setTimeout(resolve, 3000));
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
      await this.promptAndListen('What would you like to do next, Adventurer?', 'Post-save action');
      return saveResult;
    }

    if (command.includes('help') || command.includes('commands')) {
      return this.showHelp();
    }

    const aiResponse = await this.aiService.processAction(command, this.getContextForAI());
    const cleanResponse = await this.processSoundCues(aiResponse);
    await this.speak(cleanResponse);
    
    // Prompt player after AI response
    await this.promptAndListen('What would you like to do next, Adventurer?', 'Post-AI response');
    return { success: true, message: cleanResponse, action: 'ai_response' };
  }

  async explore() {
    const location = getLocationById(this.gameState.world.currentLocation);

    if (this.gameState.world.currentLocation === 'dungeon_masters_hut' && this.gameState.gameStarted) {
      this.gameState.world.currentLocation = 'mystic_gateway';
      const newLocation = getLocationById('mystic_gateway');
      
      const message = `You step through the magical portal. Reality shifts around you. ${newLocation.narrativeIntro} ${newLocation.description}`;
      
      await this.speak(message);
      await this.updateAmbientAudio();
      
      // Prompt player after arriving at new location
      await this.promptAndListen('What would you like to do next, Adventurer?', 'Ready for next action');
      
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
    const explorationNarrative = await this.processSoundCues(rawNarrative);
    
    await this.speak(explorationNarrative);

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
    // Wait for speech to complete before activating mic
    await new Promise(resolve => setTimeout(resolve, 3000));
    this.emit('awaitingVoiceInput', { prompt: 'Ready for next action' });

    return { success: true, message: explorationNarrative, action: 'explored' };
  }

  async handleEncounter(encounter) {
    if (encounter.type === 'enemy') {
      const combatResult = this.combatEngine.startCombat(encounter.enemy, this.getPlayerStats());
      // Play the enemy's appear SFX (e.g. growl for wolf, cackle for goblin)
      await this.playCombatSfx(encounter.enemy, 'appear');
      await this.speak(combatResult.message);
      await this.audioService.playAmbient('combat_music');
      
      this.addEvent(`Combat started: ${encounter.enemy.name}`);
      
      // Prompt player for combat action and activate mic
      await new Promise(resolve => setTimeout(resolve, 1500));
      const healthTip = this.gameState.player.health < this.gameState.player.maxHealth * 0.5
        ? 'Your wounds ache. Consider using a healing potion if you have one!'
        : 'You feel strong and ready for battle!';
      const combatPrompt = `A ${encounter.enemy.name} stands before you! ${healthTip} You can ATTACK to strike the enemy, DEFEND to reduce incoming damage, FLEE to try escaping, or USE a potion. What will you do, Adventurer?`;
      await this.speak(combatPrompt);
      await new Promise(resolve => setTimeout(resolve, 3000));
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
      
      // Prompt player after finding treasure
      await this.promptAndListen('What would you like to do next, Adventurer?', 'Post-treasure action');
      
      return { success: true, message: encounter.message, action: 'treasure_found', encounter };
    }

    if (encounter.type === 'event') {
      await this.speak(encounter.message);
      const rawAiResponse = await this.aiService.handleEvent(encounter, this.getContextForAI());
      const aiResponse = await this.processSoundCues(rawAiResponse);
      await this.speak(aiResponse);
      
      this.addEvent(`Event: ${encounter.event}`);
      
      // Prompt player after event
      await this.promptAndListen('What would you like to do next, Adventurer?', 'Post-event action');
      
      return { success: true, message: encounter.message + ' ' + aiResponse, action: 'event', encounter };
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
      
      // Prompt player after combat victory
      await this.promptAndListen('The battle is won! What would you like to do next, Adventurer?', 'Post-combat action');
    } else {
      await this.audioService.playSfx('character_death');
      const message = "You have been defeated. Your vision fades to black... You awaken back at the Dungeon Master's hut.";
      await this.speak(message);
      
      this.gameState.player.health = Math.floor(this.gameState.player.maxHealth * 0.5);
      this.gameState.world.currentLocation = 'dungeon_masters_hut';
      
      await this.updateAmbientAudio();
      this.addEvent('Defeated in combat');
      
      // Prompt player after respawn
      await this.promptAndListen('You awaken by the fire, battered but alive. What would you like to do, Adventurer?', 'Post-defeat action');
    }
  }

  async useItem(itemId) {
    const result = this.inventoryEngine.useItem(itemId);
    
    if (!result.success) {
      await this.speak(result.message);
      await this.promptAndListen('What would you like to do next?', 'Post-item-fail action');
      return result;
    }

    if (result.effect.type === 'heal') {
      this.gameState.player.health = Math.min(
        this.gameState.player.maxHealth,
        this.gameState.player.health + result.effect.value
      );
      
      const message = `${result.message} You restored ${result.effect.value} health. Current health: ${this.gameState.player.health}`;
      await this.speak(message);
      await this.promptAndListen('What would you like to do next, Adventurer?', 'Post-item action');
      return { success: true, message };
    }

    await this.speak(result.message);
    await this.promptAndListen('What would you like to do next?', 'Post-item action');
    return result;
  }

  async useItemInCombat(itemId) {
    const result = this.inventoryEngine.useItem(itemId);
    
    if (!result.success) {
      await this.speak(result.message);
      await new Promise(resolve => setTimeout(resolve, 1500));
      await this.speak('What is your next move?');
      await new Promise(resolve => setTimeout(resolve, 3000));
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
    await new Promise(resolve => setTimeout(resolve, 1500));
    await this.speak('What is your next move?');
    await new Promise(resolve => setTimeout(resolve, 3000));
    this.emit('awaitingVoiceInput', { prompt: 'Combat action needed' });

    return { success: true, message, combatContinues: true };
  }

  async equipItem(itemId) {
    const result = this.inventoryEngine.equipItem(itemId);
    await this.speak(result.message);
    await this.promptAndListen('What would you like to do next?', 'Post-equip action');
    return result;
  }

  async checkInventory() {
    const description = this.inventoryEngine.getInventoryDescription();
    await this.speak(description);
    await this.promptAndListen('What would you like to do next, Adventurer?', 'Post-inventory action');
    return { success: true, message: description };
  }

  async checkStatus() {
    const stats = this.getPlayerStats();
    const message = `You are a level ${stats.level} adventurer. Health: ${stats.health} out of ${stats.maxHealth}. Attack: ${stats.attack}. Defense: ${stats.defense}. Experience: ${this.gameState.player.experience} out of ${this.gameState.player.experienceToNext}.`;
    
    await this.speak(message);
    await this.promptAndListen('What would you like to do next?', 'Post-status action');
    return { success: true, message };
  }

  async checkQuests() {
    const description = this.questEngine.getQuestDescription();
    await this.speak(description);
    await this.promptAndListen('What would you like to do next, Adventurer?', 'Post-quest check');
    return { success: true, message: description };
  }

  async lookAround() {
    const location = getLocationById(this.gameState.world.currentLocation);
    const aiContext = this.getContextForAI();
    const description = await this.aiService.describeLocation(location, aiContext);
    
    await this.speak(description);
    await this.promptAndListen('What would you like to do next, Adventurer?', 'Post-look action');
    return { success: true, message: description };
  }

  async rest() {
    const location = getLocationById(this.gameState.world.currentLocation);
    
    if (location.type !== 'safe_zone') {
      const message = "This location is too dangerous to rest. Find a safe place first.";
      await this.speak(message);
      await this.promptAndListen('What would you like to do instead, Adventurer?', 'Post-rest-fail action');
      return { success: false, message };
    }

    this.gameState.player.health = this.gameState.player.maxHealth;
    await this.saveGame();

    const message = "You rest peacefully. Your health is fully restored, and your progress has been saved.";
    await this.speak(message);
    await this.audioService.playSound('rest_complete');
    
    await this.promptAndListen('What would you like to do next, Adventurer?', 'Post-rest action');
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
    await this.promptAndListen('What would you like to do, Adventurer?', 'Post-help action');
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
    // AI generates the first location dynamically
    const location = getLocationById(this.gameState.world.currentLocation);
    const aiContext = {
      player: this.gameState.player,
      world: this.gameState.world,
      location: location,
      inventory: this.inventoryEngine.getInventoryList(),
      justStarted: true
    };
    
    const firstLocationNarrative = await this.aiService.generateExploration(aiContext);
    await this.speak(firstLocationNarrative);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Give player direction and options
    const prompt = "What would you like to do, Adventurer? You can EXPLORE further, LOOK AROUND for details, check your STATUS, or simply tell me what action you wish to take.";
    await this.speak(prompt);
    
    this.addEvent('Adventure began');
    this.emit('narration', { message: firstLocationNarrative + '\n\n' + prompt });
    
    // Wait for speech to complete before activating mic
    await new Promise(resolve => setTimeout(resolve, 3000));
    this.emit('awaitingVoiceInput', { prompt: 'Ready for player action' });
    
    return { success: true, message: firstLocationNarrative };
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
    if (this.speechService) {
      await this.speechService.speak(message);
    }
  }

  async playCombatSfx(enemy, event) {
    if (enemy && enemy.sfx && enemy.sfx[event]) {
      await this.audioService.playSfx(enemy.sfx[event]);
    }
  }

  async processSoundCues(text) {
    const soundCues = this.aiService.extractSoundCues(text);
    for (const cue of soundCues) {
      // Try to play from local sound map first, then keyword fallback, then ElevenLabs
      const soundFile = this.audioService.getSoundFile(cue);
      if (soundFile) {
        await this.audioService.playSfx(soundFile);
      } else {
        this.audioService.playFallbackSound(cue);
      }
    }
    return this.aiService.stripSoundCues(text);
  }

  async promptAndListen(prompt, context = 'Ready for input') {
    await new Promise(resolve => setTimeout(resolve, 1500));
    await this.speak(prompt);
    await new Promise(resolve => setTimeout(resolve, 3000));
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
