# AIDM Quests

**An AI-Driven, Voice-Controlled Fantasy RPG for Blind and Visually Impaired Players**

AIDM Quests is an immersive audio-first fantasy role-playing game that leverages voice commands, AI-powered storytelling, and dynamic audio to create an accessible gaming experience designed specifically for blind and visually impaired players.

---

## 🎮 Features

### Core Systems
- **Voice Input System** - Speech-to-text for hands-free gameplay
- **AI Dungeon Master** - OpenAI-powered dynamic storytelling and narration
- **Text-to-Speech Narrator** - All game content read aloud
- **Turn-Based Combat** - Strategic battles with audio feedback
- **Inventory Management** - Equipment, items, and resource tracking
- **Quest System** - Progressive storylines with objectives
- **Procedural Encounters** - Dynamic enemy spawns, treasure, and events
- **Save/Load System** - Persistent game state with auto-save
- **Dynamic Audio Engine** - Ambient sounds and music that react to gameplay

### Accessibility Features
- **Voice-First Design** - Primary interaction through voice commands
- **Screen Reader Support** - Full accessibility labels
- **Audio-Rich Environment** - Sound-based world building
- **Large Touch Targets** - Easy-to-activate buttons
- **High Contrast UI** - Clear visual design for low vision users

---

## 🏗️ Architecture

```
/src
  /engine
    GameEngine.js          # Central game controller
    CombatEngine.js        # Turn-based combat system
    EncounterEngine.js     # Random encounter generation
    QuestEngine.js         # Quest tracking and progression
    InventoryEngine.js     # Item and equipment management
    MemoryEngine.js        # Save/load functionality
  
  /services
    AIService.js           # OpenAI integration for narration
    SpeechService.js       # Text-to-speech output
    VoiceListener.js       # Speech-to-text input
    AudioService.js        # Ambient sounds and music
  
  /data
    enemies.js             # Enemy definitions
    items.js               # Item catalog
    locations.js           # World locations and descriptions
```

---

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator / Android Emulator / Physical device
- OpenAI API Key (for AI Dungeon Master)

---

## 🚀 Installation

### 1. Clone or Download the Project

```bash
cd "c:/Users/phant/CascadeProjects/Aidm Quests"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure OpenAI API Key

Open `App.js` and replace the placeholder with your actual API key:

```javascript
const apiKey = 'YOUR_OPENAI_API_KEY_HERE'; // Line ~45
```

**To get an API key:**
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys
4. Create a new secret key

### 4. Add Audio Assets (Optional)

Create the following directory structure and add audio files:

```
/assets
  /audio
    /ambient
      - fireplace.mp3
      - forest.mp3
      - dark.mp3
      - ruins.mp3
      - haunted.mp3
      - mountain.mp3
      - cave.mp3
      - dragon_lair.mp3
      - peaceful.mp3
      - magical.mp3
    /music
      - main_theme.mp3
      - combat.mp3
      - victory.mp3
      - boss.mp3
```

**Note:** The game will function without audio files but will use fallback behavior. You can find royalty-free fantasy audio at:
- [Freesound.org](https://freesound.org/)
- [OpenGameArt.org](https://opengameart.org/)
- [Incompetech](https://incompetech.com/)

---

## ▶️ Running the App

### Start Development Server

```bash
npm start
```

### Run on Specific Platform

```bash
npm run android    # Android
npm run ios        # iOS
npm run web        # Web browser
```

### Testing on Physical Device

1. Install **Expo Go** app on your device
2. Scan the QR code from the terminal
3. Grant microphone permissions when prompted

---

## 🎯 How to Play

### Voice Commands

The game recognizes natural language commands:

**Exploration**
- "explore", "move forward", "go"
- "look around", "inspect"
- "rest" (in safe zones only)

**Combat**
- "attack", "fight", "strike"
- "defend", "block", "guard"
- "flee", "run away", "escape"
- "use potion", "drink healing potion"

**Inventory & Stats**
- "inventory", "check items", "what do I have"
- "status", "health", "check stats"
- "equip [item]", "wear [armor]"

**Quests & Game**
- "quests", "objectives"
- "save game"
- "help", "commands"

### Quick Action Buttons

For accessibility and convenience, the UI includes:
- **🎤 SPEAK** - Activate voice input
- **Explore** - Quick exploration button
- **Inventory** - Check your items
- **Status** - View player stats

### Starting a New Game

1. Launch the app
2. Tap the microphone button or say "begin"
3. The Dungeon Master will guide you through the intro
4. Follow voice prompts to start exploring

### Loading a Saved Game

1. Tap "Continue" button or say "continue"
2. Your previous progress will be restored

---

## 🎮 Game Mechanics

### Player Progression
- Defeat enemies to gain experience
- Level up to increase health, attack, and defense
- Collect items and equipment to improve stats

### Combat System
- **Turn-based** - Player acts, then enemy acts
- **Actions:** Attack, Defend (reduce damage), Flee (chance-based), Use Item
- **Health Management** - Rest at safe zones or use potions

### World Exploration
- **Locations** - Each area has unique atmosphere and danger level
- **Random Encounters** - Enemies, treasure, and events
- **Quest Objectives** - Visit locations, defeat enemies, collect items

### Inventory
- **Weapons** - Increase attack power
- **Armor** - Increase defense
- **Consumables** - Potions restore health
- **Materials** - Loot from defeated enemies
- **Gold** - Currency (future feature)

---

## 🧩 System Components

### GameEngine
Central controller that coordinates all subsystems. Manages:
- Player state and progression
- World state and location
- Command processing and AI interaction
- Event system for UI updates

### CombatEngine
Handles all combat interactions:
- Turn-based combat flow
- Damage calculations with attack/defense
- Loot distribution
- Victory/defeat conditions

### EncounterEngine
Generates random encounters based on:
- Location danger level
- Player level
- Steps since last encounter
- Encounter types: enemies, treasure, events

### QuestEngine
Tracks quest progression:
- Multiple active quests
- Objective completion (location, enemy kills, item collection)
- Reward distribution
- Quest history

### InventoryEngine
Manages player inventory:
- Item addition/removal with stacking
- Equipment system (weapon, armor, accessory)
- Item usage (consumables)
- Stat bonuses from equipped items

### MemoryEngine
Persistent storage using AsyncStorage:
- Save/load game state
- Auto-save functionality
- Backup and restore
- Player preferences

### AIService
OpenAI GPT integration:
- Dynamic narration generation
- Location descriptions
- Event outcomes
- Combat narration
- Maintains conversation context

### SpeechService
Text-to-speech output using Expo Speech:
- Adjustable rate, pitch, and volume
- Queue management
- Voice selection
- Event callbacks

### VoiceListener
Speech recognition using React Native Voice:
- Continuous listening
- Real-time transcription
- Command pattern recognition
- Error handling

### AudioService
Audio playback using Expo AV:
- Ambient sound loops
- Music tracks
- Sound effects
- Volume controls per category
- Fade in/out effects

---

## 🔧 Customization

### Adding New Enemies

Edit `src/data/enemies.js`:

```javascript
{
  id: 'new_enemy',
  name: 'Enemy Name',
  description: 'Description',
  health: 50,
  attack: 10,
  defense: 5,
  level: 3,
  sounds: {
    appear: 'Audio description',
    attack: 'Attack description',
    hit: 'Hit reaction',
    death: 'Death description'
  },
  loot: [
    { itemId: 'item_id', quantity: 1, chance: 0.5 }
  ]
}
```

### Adding New Items

Edit `src/data/items.js`:

```javascript
{
  id: 'new_item',
  name: 'Item Name',
  type: 'weapon|armor|consumable|material',
  description: 'Description',
  effect: { type: 'attack|defense|heal', value: 10 },
  rarity: 'common|uncommon|rare|legendary',
  sound: 'Audio feedback when used/equipped',
  stackable: true,
  maxStack: 99
}
```

### Adding New Locations

Edit `src/data/locations.js`:

```javascript
{
  id: 'new_location',
  name: 'Location Name',
  type: 'wilderness|dungeon|settlement|safe_zone',
  description: 'Atmospheric description',
  ambientSound: 'sound_id',
  weather: ['sunny', 'rainy'],
  dangerLevel: 3,
  encounters: ['enemy1', 'enemy2'],
  encounterChance: 0.4,
  connections: ['location1', 'location2'],
  narrativeIntro: 'First time description'
}
```

---

## 🐛 Troubleshooting

### Voice Recognition Not Working

**iOS:**
- Go to Settings > Privacy > Speech Recognition
- Enable for Expo Go or AIDM Quests

**Android:**
- Go to Settings > Apps > Permissions > Microphone
- Grant permission to Expo Go or AIDM Quests

### Audio Not Playing

- Ensure audio files exist in `/assets/audio/`
- Check volume settings on device
- Verify app has media playback permissions

### AI Responses Failing

- Verify OpenAI API key is correct
- Check internet connection
- Ensure API key has credits remaining
- Monitor console for API error messages

### App Crashes on Startup

- Run `npm install` to ensure dependencies are installed
- Clear Expo cache: `expo start -c`
- Check React Native version compatibility

---

## 📱 Deployment

### Building for Production

**Android:**
```bash
expo build:android
```

**iOS:**
```bash
expo build:ios
```

### Publishing Update

```bash
expo publish
```

---

## 🛣️ Roadmap

- [ ] Multiplayer co-op mode
- [ ] Character creation system
- [ ] Skill trees and abilities
- [ ] Crafting system
- [ ] Trading with NPCs
- [ ] Dynamic story branching
- [ ] Multiple language support
- [ ] Cloud save synchronization
- [ ] Achievement system
- [ ] Boss battle mechanics

---

## 🤝 Contributing

This is an educational/portfolio project. Feel free to:
- Fork and modify for your own use
- Report bugs or suggest features
- Create pull requests with improvements

---

## 📄 License

This project is provided as-is for educational purposes.

**Third-Party Dependencies:**
- Expo and React Native (MIT License)
- OpenAI API (subject to OpenAI terms)
- Audio assets (ensure proper licensing)

---

## 🙏 Acknowledgments

- Designed for accessibility with input from visually impaired gamers
- Built with React Native and Expo for cross-platform support
- Powered by OpenAI for dynamic storytelling
- Inspired by classic text adventure games and audio dramas

---

## 📞 Support

For issues or questions:
- Check console logs for error messages
- Review API documentation for dependencies
- Verify all configuration steps were completed

---

**Enjoy your adventure, Adventurer!** 🏰⚔️🎮
