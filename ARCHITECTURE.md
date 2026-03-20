# AIDM Quests - Technical Architecture

## System Overview

AIDM Quests follows a modular, service-oriented architecture with clear separation of concerns between game logic, AI services, and user interface.

---

## Core Architecture Principles

1. **Modularity** - Each system is independent and communicable through well-defined interfaces
2. **Event-Driven** - Systems communicate via events to maintain loose coupling
3. **State Management** - Centralized game state with distributed subsystem states
4. **Accessibility-First** - Voice and audio as primary interaction methods
5. **Persistence** - Automatic save/load with backup capabilities

---

## System Diagram

```
┌─────────────────────────────────────────────────────────┐
│                        App.js                           │
│                   (React Native UI)                     │
└────────────────┬───────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                     GameEngine                          │
│              (Central Controller)                       │
│                                                         │
│  - Command Processing                                   │
│  - State Coordination                                   │
│  - Event Emission                                       │
│  - Flow Control                                         │
└─────┬──────┬──────┬──────┬──────┬──────────────────────┘
      │      │      │      │      │
      ▼      ▼      ▼      ▼      ▼
┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Combat  │ │Inventory│ │Encounter │ │  Quest   │ │  Memory  │
│ Engine  │ │ Engine  │ │  Engine  │ │  Engine  │ │  Engine  │
└─────────┘ └─────────┘ └──────────┘ └──────────┘ └──────────┘

┌─────────────────────────────────────────────────────────┐
│                    Service Layer                        │
└─────┬──────┬──────┬──────┬──────────────────────────────┘
      │      │      │      │
      ▼      ▼      ▼      ▼
┌─────────┐ ┌─────────┐ ┌───────┐ ┌───────────┐
│   AI    │ │ Speech  │ │ Voice │ │   Audio   │
│ Service │ │ Service │ │Listen │ │  Service  │
└─────────┘ └─────────┘ └───────┘ └───────────┘

┌─────────────────────────────────────────────────────────┐
│                      Data Layer                         │
└─────┬──────┬──────┬──────────────────────────────────────┘
      │      │      │
      ▼      ▼      ▼
┌─────────┐ ┌─────────┐ ┌───────────┐
│ Enemies │ │  Items  │ │ Locations │
└─────────┘ └─────────┘ └───────────┘
```

---

## Component Responsibilities

### GameEngine (Central Controller)

**Purpose:** Orchestrates all game systems and manages overall game flow

**Key Responsibilities:**
- Process player commands (voice or button)
- Coordinate between subsystems
- Maintain game state (player, world, events)
- Handle intro/exploration/combat modes
- Emit events for UI updates
- Manage save/load operations

**State Structure:**
```javascript
{
  player: {
    name, health, maxHealth, attack, defense,
    level, experience, experienceToNext
  },
  world: {
    currentLocation, previousLocation,
    timeOfDay, weather, dayCount
  },
  gameStarted: boolean,
  inIntro: boolean,
  recentEvents: [],
  turnCount: number
}
```

**Key Methods:**
- `startNewGame()` - Initialize new game
- `continueGame()` - Load saved game
- `processCommand(command)` - Main command router
- `explore()` - Handle exploration
- `handleEncounter(encounter)` - Process random encounters
- `handleCombatCommand(command)` - Route combat actions

---

### CombatEngine

**Purpose:** Manage turn-based combat mechanics

**Key Features:**
- Turn-based combat flow
- Damage calculation with attack/defense modifiers
- Combat actions: attack, defend, flee, use item
- Enemy AI behavior
- Loot distribution on victory
- Combat log tracking

**State Structure:**
```javascript
{
  inCombat: boolean,
  currentEnemy: EnemyObject,
  turnCount: number,
  combatLog: []
}
```

**Combat Flow:**
1. Player action (attack/defend/flee/use)
2. Damage calculation
3. Enemy health check
4. If alive: Enemy attacks
5. Player health check
6. Repeat until victory/defeat/flee

**Damage Formula:**
```javascript
actualDamage = max(1, baseDamage - targetDefense)
```

---

### InventoryEngine

**Purpose:** Manage items, equipment, and inventory operations

**Key Features:**
- Item stacking with max stack limits
- Equipment slots (weapon, armor, accessory)
- Item usage (consumables)
- Stat bonuses from equipped items
- Gold tracking
- Inventory descriptions

**State Structure:**
```javascript
{
  inventory: [ItemObject],
  equippedItems: {
    weapon: ItemObject,
    armor: ItemObject,
    accessory: ItemObject
  }
}
```

**Item Types:**
- **Consumable** - Single use (potions)
- **Weapon** - Increases attack
- **Armor** - Increases defense
- **Accessory** - Various bonuses
- **Material** - Crafting components (future)
- **Currency** - Gold coins

---

### EncounterEngine

**Purpose:** Generate and manage random encounters

**Key Features:**
- Probability-based encounter system
- Adjusts based on steps since last encounter
- Three encounter types: enemy, treasure, event
- Level-appropriate enemy selection
- Encounter history tracking

**Encounter Types:**

1. **Enemy Encounter (60%)**
   - Random enemy from location's spawn list
   - Level-appropriate selection
   - Triggers combat

2. **Treasure Encounter (20%)**
   - Random items
   - Gold coins
   - Potions

3. **Event Encounter (20%)**
   - Story events
   - Merchant encounters
   - Mysterious discoveries
   - Choice-based outcomes

**Encounter Chance Formula:**
```javascript
adjustedChance = min(0.8, baseChance + (stepsSinceEncounter * 0.05))
```

---

### QuestEngine

**Purpose:** Track and manage quest progression

**Key Features:**
- Multiple active quests
- Objective types: location visit, enemy kills, item collection
- Progress tracking per objective
- Reward distribution
- Quest completion detection

**Quest Structure:**
```javascript
{
  id: string,
  name: string,
  description: string,
  objectives: [
    {
      id: string,
      description: string,
      type: 'location'|'kill_enemy'|'collect_item',
      target: string,
      completed: boolean,
      currentCount: number,
      requiredCount: number
    }
  ],
  rewards: {
    experience: number,
    items: [ItemReward]
  }
}
```

**Objective Types:**
- **Location** - Visit specific location
- **Kill Enemy** - Defeat X enemies
- **Collect Item** - Gather X items

---

### MemoryEngine

**Purpose:** Handle game persistence and save/load operations

**Key Features:**
- AsyncStorage integration
- Save/load game state
- Backup creation
- Auto-save functionality
- Player preferences storage

**Save Data Structure:**
```javascript
{
  version: '1.0.0',
  timestamp: number,
  gameState: {
    gameState: GameEngineState,
    combat: CombatEngineState,
    inventory: InventoryEngineState,
    encounters: EncounterEngineState,
    quests: QuestEngineState
  }
}
```

---

## Service Layer

### AIService

**Purpose:** OpenAI GPT integration for dynamic narration

**Configuration:**
- Model: GPT-4
- Temperature: 0.8 (creative)
- Max Tokens: 200 (concise responses)
- System Prompt: Dungeon Master persona

**Key Methods:**
- `generateExploration(context)` - Location narration
- `describeLocation(location, context)` - Detailed descriptions
- `handleEvent(encounter, context)` - Event outcomes
- `processAction(action, context)` - Generic command responses
- `generateCombatNarration(state, action)` - Battle descriptions

**Context Provided to AI:**
```javascript
{
  player: PlayerStats,
  location: LocationObject,
  inventory: ItemsList,
  quests: ActiveQuests,
  recentEvents: EventHistory,
  inCombat: boolean,
  currentEnemy: EnemyObject
}
```

**Prompt Engineering:**
- Focus on audio/sensory descriptions
- Avoid visual descriptions
- Fantasy tone and language
- 2-4 sentence responses
- Offer choices when appropriate

---

### SpeechService

**Purpose:** Text-to-speech output using Expo Speech

**Features:**
- Adjustable rate, pitch, volume
- Multiple voices support
- Event callbacks (start, end, error)
- Queue management
- Emphasis and urgency modes

**Preferences:**
```javascript
{
  rate: 1.0,      // 0.1 - 2.0
  pitch: 1.0,     // 0.5 - 2.0
  volume: 1.0,    // 0.0 - 1.0
  language: 'en-US',
  voice: voiceId
}
```

---

### VoiceListener

**Purpose:** Speech-to-text input using React Native Voice

**Features:**
- Continuous listening mode
- Real-time transcription
- Partial results preview
- Command pattern recognition
- Error handling and fallbacks

**Event System:**
- `listeningStarted` - Recording begins
- `listeningStopped` - Recording ends
- `results` - Final transcription
- `partialResults` - Live transcription
- `error` - Recognition errors

**Command Recognition:**
Uses regex patterns to identify commands:
```javascript
{
  explore: /\b(explore|forward|move|go)\b/,
  attack: /\b(attack|fight|strike)\b/,
  // ... etc
}
```

---

### AudioService

**Purpose:** Dynamic audio playback using Expo AV

**Audio Categories:**
- **Ambient** - Looping environment sounds
- **Music** - Background music tracks
- **Effects** - One-shot sound effects

**Volume Controls:**
```javascript
{
  master: 1.0,
  ambient: 0.6,
  effects: 0.8,
  music: 0.7
}
```

**Features:**
- Automatic looping for ambient/music
- Fade in/out effects
- Dynamic audio switching based on location
- Combat music transitions
- Independent volume controls

---

## Data Layer

### enemies.js

**Purpose:** Define all enemy types

**Enemy Properties:**
- Basic stats (health, attack, defense, level)
- Audio descriptions for all combat events
- Loot tables with drop chances
- Unique characteristics per enemy type

### items.js

**Purpose:** Define all items and equipment

**Item Categories:**
- Weapons (attack bonuses)
- Armor (defense bonuses)
- Consumables (instant effects)
- Materials (crafting/selling)
- Accessories (special bonuses)

### locations.js

**Purpose:** Define world locations

**Location Properties:**
- Type (wilderness, dungeon, settlement, safe_zone)
- Ambient sound
- Weather patterns
- Danger level
- Encounter tables
- Connected locations
- Points of interest

---

## Game Flow

### Startup Flow

1. App initializes services
2. GameEngine created with service references
3. Load saved game check
4. Display intro or continue screen
5. User chooses "begin" or "continue"
6. Game starts at appropriate location

### Exploration Flow

1. Player issues command (voice/button)
2. GameEngine.processCommand() routes to handler
3. If exploration: Check for encounter
4. If encounter: Trigger combat/treasure/event
5. If no encounter: AI generates narration
6. Update location (possibly)
7. Check quest objectives
8. Update UI with results
9. Speak response to player

### Combat Flow

1. Encounter triggers combat
2. CombatEngine.startCombat() initializes
3. Ambient audio switches to combat music
4. Player action input
5. Damage calculation and application
6. Check for combat end (victory/defeat)
7. If continues: Enemy action
8. Repeat until combat ends
9. Distribute loot and experience
10. Check quest objectives
11. Return to exploration mode

---

## Event System

The GameEngine uses an event system for UI updates:

```javascript
gameEngine.on('gameStarted', callback)
gameEngine.on('gameLoaded', callback)
gameEngine.on('combatStarted', callback)
gameEngine.on('combatEnded', callback)
gameEngine.on('questUpdated', callback)
gameEngine.on('levelUp', callback)
```

---

## State Persistence

### What Gets Saved:
- Player stats and progression
- Inventory and equipped items
- Current location
- Active and completed quests
- Encounter history
- Combat state (if in combat)
- Recent events log

### Auto-Save Triggers:
- After combat victory
- After resting in safe zone
- After quest completion
- Manual save command
- Periodic auto-save (every 5 minutes)

---

## Error Handling

### AI Service Errors
- Fallback to predefined responses
- Graceful degradation
- Retry logic with exponential backoff

### Voice Recognition Errors
- Display error message
- Retry prompt
- Fallback to button commands

### Audio Playback Errors
- Log error and continue
- Use fallback audio or skip
- Notify player if critical

---

## Performance Considerations

### Memory Management
- Limit conversation history (10 messages)
- Limit event history (20 events)
- Limit encounter history (50 encounters)
- Unload unused audio assets

### API Optimization
- Concise prompts to AI
- Token limits to control costs
- Caching of repeated requests
- Batch operations where possible

---

## Future Enhancements

### Planned Features
1. **Skill System** - Active and passive abilities
2. **Crafting** - Combine materials into items
3. **NPC Trading** - Buy/sell items
4. **Story Branching** - Player choice consequences
5. **Multiplayer** - Co-op adventure mode
6. **Cloud Saves** - Cross-device progression
7. **Achievements** - Milestone tracking
8. **Character Creation** - Customizable attributes

### Technical Improvements
1. **State Management** - Redux or Context API
2. **TypeScript** - Type safety
3. **Testing** - Unit and integration tests
4. **Analytics** - Player behavior tracking
5. **Crash Reporting** - Error monitoring
6. **Push Notifications** - Daily quests
7. **Offline Mode** - Limited functionality without API

---

## Development Guidelines

### Code Style
- ES6+ JavaScript
- Async/await for asynchronous operations
- Descriptive variable and function names
- Comments for complex logic

### Module Structure
- Each engine/service in its own file
- Clear public API
- Private methods prefixed with _
- State immutability

### Testing Strategy
- Unit tests for engines
- Integration tests for game flow
- Manual testing for voice/audio
- Accessibility testing

---

## Conclusion

AIDM Quests is built on a solid, modular architecture that separates concerns, maintains state integrity, and provides a seamless voice-first gaming experience. The system is designed for extensibility, allowing easy addition of new content, features, and improvements.
