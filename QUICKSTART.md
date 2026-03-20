# AIDM Quests - Quick Start Guide

## 🚀 Get Up and Running in 5 Minutes

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Add Your OpenAI API Key

Open `App.js` and find line ~45:

```javascript
const apiKey = 'YOUR_OPENAI_API_KEY_HERE';
```

Replace with your actual OpenAI API key.

**Get a key at:** https://platform.openai.com/api-keys

### Step 3: Start the App

```bash
npm start
```

### Step 4: Run on Device/Emulator

- **iOS:** Press `i` or scan QR code with Expo Go
- **Android:** Press `a` or scan QR code with Expo Go
- **Web:** Press `w`

### Step 5: Grant Permissions

When prompted, allow:
- ✅ Microphone access (for voice commands)
- ✅ Media playback

### Step 6: Play!

1. Tap "New Game" or say "begin"
2. Listen to the Dungeon Master's introduction
3. Tap the 🎤 microphone button to speak commands
4. Say "explore" to start your adventure!

---

## 🎮 Essential Commands

**Start Playing:**
- "begin" or "start"
- "explore" or "move forward"

**In Combat:**
- "attack"
- "defend"
- "flee" or "run"
- "use potion"

**Manage Character:**
- "inventory"
- "status"
- "equip [item name]"

**Get Help:**
- "help"
- "save game"

---

## ⚠️ Troubleshooting

### Voice Not Working?
- Check microphone permissions in device settings
- Try restarting the app
- Use quick action buttons as backup

### No Audio?
- Audio assets are optional for testing
- Game will work with fallback behavior
- Check device volume settings

### AI Not Responding?
- Verify OpenAI API key is correct
- Check internet connection
- Ensure API account has credits

---

## 📱 Recommended Testing

**Best Experience:**
- Physical device with headphones
- Quiet environment for voice recognition
- Screen reader enabled for full accessibility

**Quick Testing:**
- Use web version with keyboard input simulation
- Click quick action buttons instead of voice
- Monitor console logs for debugging

---

## 🎯 First Quest

After starting the game:

1. **Listen** to the Dungeon Master's greeting
2. **Say "explore"** to enter the Mystic Gateway
3. **Keep exploring** until you encounter an enemy
4. **Say "attack"** to defeat your first foe
5. **Say "inventory"** to see your loot
6. **Say "rest"** when you find a safe place

You've now experienced the core game loop! 🎉

---

## 📚 Learn More

- **Full Documentation:** README.md
- **Architecture Details:** ARCHITECTURE.md
- **Add Content:** Edit files in `/src/data/`

---

**Happy Adventuring!** ⚔️
