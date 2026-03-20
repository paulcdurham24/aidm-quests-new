# AIDM Quests - Usage Examples

This document provides practical examples of how to use and extend the game engine.

---

## 🎮 Basic Game Flow Examples

### Starting a New Game

```javascript
// In App.js or custom component
const gameEngine = new GameEngine(aiService, speechService, audioService);

// Start new game
await gameEngine.startNewGame();
// Output: "Welcome, Adventurer. You find yourself in my humble hut..."

// Process commands
await gameEngine.processCommand("begin");
// Output: "Excellent! The magical door responds..."

await gameEngine.processCommand("explore");
// Output: "You step through the magical portal..."
```

### Loading a Saved Game

```javascript
// Check if save exists
const hasSave = await gameEngine.memoryEngine.saveExists();

if (hasSave) {
  await gameEngine.continueGame();
  // Output: "Welcome back, Adventurer. You continue your journey..."
} else {
  await gameEngine.startNewGame();
}
```

---

## ⚔️ Combat Examples

### Basic Combat Flow

```javascript
// Player explores and triggers encounter
await gameEngine.processCommand("explore");
// Encounter triggered: "An enemy appears! You hear guttural grunting..."

// Combat begins - attack
await gameEngine.processCommand("attack");
// Output: "You strike the Goblin for 8 damage! The goblin lunges..."

// Defend
await gameEngine.processCommand("defend");
// Output: "You take a defensive stance... damage reduced to 2"

// Use potion
await gameEngine.processCommand("use healing potion");
// Output: "You drink the potion... You restored 30 health"

// Flee
await gameEngine.processCommand("flee");
// Output: "You successfully escape!" OR "Failed to escape!"
```

### Programmatic Combat

```javascript
const combatEngine = gameEngine.combatEngine;

// Start combat manually
const enemy = getRandomEnemy(playerLevel);
combatEngine.startCombat(enemy, playerStats);

// Player attacks
const result = combatEngine.playerAttack(playerStats);
console.log(result.message);
console.log(`Enemy health: ${result.enemyHealth}`);

// Check if combat over
if (result.combatOver) {
  console.log(`Victory! Loot: ${result.loot}`);
}
```

---

## 🎒 Inventory Examples

### Adding Items

```javascript
const inventory = gameEngine.inventoryEngine;

// Add single item
inventory.addItem('healing_potion', 1);

// Add multiple items
inventory.addItem('gold_coins', 50);

// Add stackable items
inventory.addItem('bone_dust', 5);
inventory.addItem('bone_dust', 3); // Now has 8 total
```

### Using Items

```javascript
// Use consumable
const result = inventory.useItem('healing_potion');
if (result.success) {
  const healAmount = result.effect.value;
  gameEngine.gameState.player.health += healAmount;
  console.log(`Healed ${healAmount} HP`);
}

// Check if item exists
if (inventory.hasItem('healing_potion', 2)) {
  console.log('You have at least 2 potions');
}
```

### Equipping Items

```javascript
// Equip weapon
const equipResult = inventory.equipItem('iron_sword');
console.log(equipResult.message);
// Output: "You equipped Iron Sword. The iron sword feels balanced..."

// Check equipped stats
const stats = inventory.getEquippedStats();
console.log(`Bonus attack: ${stats.attack}`);
console.log(`Bonus defense: ${stats.defense}`);

// Unequip
inventory.unequipItem('weapon');
```

### Inventory Display

```javascript
// Get inventory list
const items = inventory.getInventoryList();
items.forEach(item => {
  console.log(`${item.name} x${item.quantity}`);
});

// Get narration description
const description = inventory.getInventoryDescription();
// Output: "You are carrying: Iron Sword, Healing Potion (3), Gold Coins (25)"
```

---

## 🗺️ Location & Exploration Examples

### Changing Locations

```javascript
// Get current location
const currentLoc = getLocationById(gameEngine.gameState.world.currentLocation);
console.log(`You are in: ${currentLoc.name}`);

// Move to new location
gameEngine.gameState.world.previousLocation = currentLoc.id;
gameEngine.gameState.world.currentLocation = 'whispering_forest';

// Update ambient audio
await gameEngine.updateAmbientAudio();

// Check quest objectives
const questResults = gameEngine.questEngine.checkLocationObjectives('whispering_forest');
```

### Creating Custom Locations

```javascript
// Add to src/data/locations.js
const newLocation = {
  id: 'crystal_caves',
  name: 'The Crystal Caves',
  type: 'dungeon',
  description: 'Glowing crystals hum with power. The sound echoes endlessly.',
  ambientSound: 'cave_ambience',
  weather: ['damp', 'cold'],
  dangerLevel: 5,
  encounters: ['crystal_golem', 'cave_bat'],
  encounterChance: 0.5,
  connections: ['mountain_pass', 'underground_lake'],
  narrativeIntro: 'You descend into a cavern of living light.',
  points_of_interest: [
    {
      name: 'Singing Crystal',
      description: 'A massive crystal that resonates with a musical tone'
    }
  ]
};
```

---

## 📜 Quest Examples

### Creating a Quest

```javascript
const quest = {
  id: 'slay_the_dragon',
  name: 'Slay the Dragon',
  description: 'Defeat the dragon terrorizing the villages',
  type: 'combat',
  objectives: [
    {
      id: 'reach_peak',
      description: 'Reach Dragon\'s Peak',
      type: 'location',
      target: 'mountain_peak',
      completed: false
    },
    {
      id: 'slay_dragon',
      description: 'Defeat the Young Dragon',
      type: 'kill_enemy',
      target: 'dragon',
      currentCount: 0,
      requiredCount: 1,
      completed: false
    }
  ],
  rewards: {
    experience: 500,
    items: [
      { itemId: 'dragon_scale', quantity: 3 },
      { itemId: 'gold_coins', quantity: 500 }
    ]
  }
};

// Add quest to engine
gameEngine.questEngine.addQuest(quest);
```

### Checking Quest Progress

```javascript
// Check location objective
const results = questEngine.checkLocationObjectives('mountain_peak');
results.forEach(result => {
  console.log(result.message);
  if (result.questComplete) {
    console.log('Quest completed!');
    console.log('Rewards:', result.rewards);
  }
});

// Check enemy kill objective
const killResults = questEngine.checkEnemyKillObjectives('dragon');

// Check item collection
const itemResults = questEngine.checkItemCollectionObjectives('dragon_scale');
```

---

## 🤖 AI Service Examples

### Custom Narration

```javascript
const aiService = new AIService('your-api-key');

// Generate exploration text
const context = {
  player: { level: 3, health: 70, maxHealth: 100 },
  location: getLocationById('dark_grove'),
  inventory: inventoryEngine.getInventoryList()
};

const narration = await aiService.generateExploration(context);
console.log(narration);
// Output: "The darkness here is unnatural. You hear whispers..."

// Process custom action
const response = await aiService.processAction("I light a torch", context);
console.log(response);
// Output: "Your torch flares to life, pushing back the shadows..."
```

### Adjusting AI Behavior

```javascript
// Use different model
aiService.setModel('gpt-3.5-turbo'); // Faster, cheaper

// Adjust temperature (creativity)
// In AIService.js makeRequest():
temperature: 0.9  // More creative
temperature: 0.5  // More consistent

// Adjust max tokens (length)
max_tokens: 150   // Shorter responses
max_tokens: 300   // Longer responses
```

---

## 🎤 Voice & Speech Examples

### Voice Command Processing

```javascript
const voiceListener = new VoiceListener();

// Start listening
await voiceListener.startListening();

// Handle results
voiceListener.on('results', async ({ text }) => {
  console.log('You said:', text);
  
  // Process command
  const parsed = voiceListener.processCommand(text);
  console.log('Command:', parsed.command);
  console.log('Confidence:', parsed.confidence);
  
  await gameEngine.processCommand(text);
});

// Stop listening
await voiceListener.stopListening();
```

### Text-to-Speech Customization

```javascript
const speechService = new SpeechService();

// Adjust voice settings
speechService.setRate(1.2);      // Faster speech
speechService.setPitch(0.9);     // Lower pitch
speechService.setVolume(0.8);    // Quieter

// Speak with emphasis
await speechService.speakWithEmphasis(
  'The dragon breathes fire at you!',
  ['dragon', 'fire']
);

// Urgent speech (faster, higher pitch)
await speechService.speakUrgently('Run! The cave is collapsing!');

// Slow speech (for important info)
await speechService.speakSlowly('You have found the Legendary Sword of Heroes.');
```

---

## 🎵 Audio Examples

### Dynamic Audio Management

```javascript
const audioService = new AudioService();
await audioService.initialize();

// Play ambient sound
await audioService.playAmbient('forest_ambience');

// Switch to combat music
await audioService.fadeOut('ambient', 1000); // 1 second fade
await audioService.playMusic('combat_theme');

// Play victory sound
await audioService.playSound('victory');

// Fade back to ambient
await audioService.fadeOut('music', 2000);
await audioService.playAmbient('forest_ambience');
await audioService.fadeIn('ambient', null, 2000);
```

### Volume Control

```javascript
// Master volume (affects all)
audioService.setMasterVolume(0.7);

// Individual categories
audioService.setAmbientVolume(0.5);
audioService.setMusicVolume(0.6);
audioService.setEffectsVolume(0.9);

// Get current volumes
const volumes = audioService.getVolume();
console.log(volumes);
// { master: 0.7, ambient: 0.5, music: 0.6, effects: 0.9 }
```

---

## 💾 Save/Load Examples

### Manual Save/Load

```javascript
const memoryEngine = new MemoryEngine();

// Save game
const gameState = gameEngine.getState();
const result = await memoryEngine.saveGame(gameState);
console.log(result.message); // "Game saved successfully"

// Load game
const loadResult = await memoryEngine.loadGame();
if (loadResult.success) {
  gameEngine.loadState(loadResult.gameState);
  console.log('Game loaded from:', new Date(loadResult.timestamp));
}

// Check if save exists
const exists = await memoryEngine.saveExists();
```

### Auto-Save

```javascript
// Enable auto-save every 5 minutes
memoryEngine.startAutoSave(gameEngine, 5);

// Disable auto-save
memoryEngine.stopAutoSave();
```

### Backup Management

```javascript
// Create backup
const backup = await memoryEngine.createBackup();
console.log('Backup created:', backup.backupKey);

// List all backups
const backups = await memoryEngine.listBackups();
backups.backups.forEach(b => {
  console.log(`Backup: ${b.key} from ${new Date(b.timestamp)}`);
});

// Restore from backup
await memoryEngine.restoreBackup(backup.backupKey);
```

---

## 🔧 Extending the Engine

### Adding Custom Enemy

```javascript
// In src/data/enemies.js
export const enemies = [
  // ... existing enemies
  {
    id: 'crystal_golem',
    name: 'Crystal Golem',
    description: 'A massive construct of living crystal',
    health: 100,
    attack: 15,
    defense: 12,
    level: 6,
    sounds: {
      appear: 'You hear the grinding of stone and crystal',
      attack: 'The golem swings its massive crystal fist',
      hit: 'Your weapon chips away at the crystal form',
      death: 'The golem shatters into countless fragments'
    },
    loot: [
      { itemId: 'crystal_shard', quantity: 5, chance: 1.0 },
      { itemId: 'gold_coins', quantity: 100, chance: 0.8 }
    ]
  }
];
```

### Custom Event Handler

```javascript
// Add to GameEngine.js
async handleCustomEvent(eventType, data) {
  switch(eventType) {
    case 'merchant_trade':
      return await this.handleMerchantTrade(data);
    case 'riddle_challenge':
      return await this.handleRiddle(data);
    case 'treasure_trap':
      return await this.handleTrap(data);
    default:
      return { success: false, message: 'Unknown event' };
  }
}
```

---

## 🎯 Complete Example: Custom Quest Chain

```javascript
// 1. Define quest series
const questChain = [
  {
    id: 'haunted_manor_1',
    name: 'The Haunted Manor - Investigation',
    objectives: [
      { 
        id: 'reach_manor',
        type: 'location',
        target: 'haunted_manor'
      }
    ],
    rewards: {
      experience: 100,
      items: []
    }
  },
  {
    id: 'haunted_manor_2',
    name: 'The Haunted Manor - Cleansing',
    objectives: [
      {
        id: 'defeat_wraiths',
        type: 'kill_enemy',
        target: 'wraith',
        requiredCount: 3
      }
    ],
    rewards: {
      experience: 300,
      items: [
        { itemId: 'ectoplasm', quantity: 5 },
        { itemId: 'soul_gem', quantity: 1 }
      ]
    }
  }
];

// 2. Initialize first quest
gameEngine.questEngine.addQuest(questChain[0]);

// 3. On completion, add next quest
gameEngine.on('questCompleted', (data) => {
  if (data.questId === 'haunted_manor_1') {
    gameEngine.questEngine.addQuest(questChain[1]);
  }
});
```

---

**These examples demonstrate the modular, extensible nature of the AIDM Quests engine. Mix and match components to create unique gameplay experiences!**
