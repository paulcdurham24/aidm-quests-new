# Assets Directory

This directory contains all game assets including audio files and images.

## 📁 Directory Structure

```
/assets
  /audio
    /ambient        # Looping background sounds
    /music          # Background music tracks
    /effects        # One-shot sound effects
  /images
    icon.png        # App icon
    splash.png      # Splash screen
    adaptive-icon.png
    favicon.png
```

## 🎵 Required Audio Files

### Ambient Sounds (Looping)

Place these in `/assets/audio/ambient/`:

- `fireplace.mp3` - Crackling fire (Dungeon Master's hut)
- `forest.mp3` - Forest ambience with birds and rustling
- `dark.mp3` - Ominous dark atmosphere
- `ruins.mp3` - Wind through abandoned buildings
- `haunted.mp3` - Eerie ghostly sounds
- `mountain.mp3` - Howling wind at high altitude
- `cave.mp3` - Dripping water and echoes
- `dragon_lair.mp3` - Heavy breathing and distant roars
- `peaceful.mp3` - Calm nature sounds
- `magical.mp3` - Mystical humming energy

### Music Tracks (Looping)

Place these in `/assets/audio/music/`:

- `main_theme.mp3` - Main game theme
- `combat.mp3` - Combat background music
- `victory.mp3` - Victory fanfare
- `boss.mp3` - Epic boss battle theme

### Sound Effects (One-shot)

Place these in `/assets/audio/effects/`:

- `combat_start.mp3` - Battle initiated sound
- `victory.mp3` - Combat won
- `treasure_found.mp3` - Chest opening
- `level_up.mp3` - Character leveled up
- `rest_complete.mp3` - Rest finished

## 🖼️ Required Images

### App Icons

- `icon.png` - 1024x1024px app icon
- `adaptive-icon.png` - 1024x1024px Android adaptive icon
- `splash.png` - 1242x2436px splash screen
- `favicon.png` - 32x32px web favicon

## 🎨 Creating Your Own Assets

### Audio Recommendations

**Free Audio Resources:**
- [Freesound.org](https://freesound.org/) - Community sound effects
- [OpenGameArt.org](https://opengameart.org/) - Game audio
- [Incompetech](https://incompetech.com/) - Royalty-free music
- [ZapSplat](https://www.zapsplat.com/) - Sound effects
- [Ambient-Mixer](https://www.ambient-mixer.com/) - Ambient sounds

**Audio Specifications:**
- Format: MP3 (best compatibility)
- Sample Rate: 44.1kHz
- Bit Rate: 128-192kbps
- Ambient/Music: Stereo
- Effects: Mono or Stereo

**Looping Audio:**
- Ensure seamless loops for ambient/music
- Fade in/out at endpoints
- Remove clicks/pops at loop point

### Image Creation

**Icon Design:**
- Use fantasy-themed imagery
- High contrast for visibility
- Simple, recognizable shapes
- Test at various sizes

**Splash Screen:**
- Portrait orientation
- Game title centered
- Dark fantasy aesthetic
- Match app color scheme (#1a1a2e background)

## ⚠️ Important Notes

### Audio Files Are Optional

The game will function without audio files:
- AudioService has fallback behavior
- Console logs will show "fallback" messages
- Voice and text functionality remains intact

**For Testing:**
You can skip audio setup initially and add it later for enhanced experience.

### License Compliance

**Always ensure proper licensing for assets:**
- ✅ Use royalty-free or CC0 assets
- ✅ Attribute creators when required
- ✅ Check commercial use permissions
- ❌ Never use copyrighted material without permission

### File Size Optimization

- Compress audio files to reasonable sizes
- Consider streaming for large files
- Balance quality vs. app size
- Test loading times on target devices

## 📦 Example Asset Pack Structure

```
assets/
├── audio/
│   ├── ambient/
│   │   ├── fireplace.mp3 (2.1 MB, 2:00 loop)
│   │   ├── forest.mp3 (2.8 MB, 2:30 loop)
│   │   └── ...
│   ├── music/
│   │   ├── main_theme.mp3 (4.2 MB, 3:00 loop)
│   │   └── ...
│   └── effects/
│       ├── combat_start.mp3 (45 KB, 0:02)
│       └── ...
└── images/
    ├── icon.png (150 KB)
    ├── splash.png (300 KB)
    └── ...
```

## 🔧 Adding New Audio

### 1. Add Audio File

Place file in appropriate directory:
```
/assets/audio/ambient/new_location.mp3
```

### 2. Update AudioService.js

Add to `getAmbientFile()` method:

```javascript
'new_location': require('../../assets/audio/ambient/new_location.mp3')
```

### 3. Reference in Location Data

In `src/data/locations.js`:

```javascript
ambientSound: 'new_location'
```

### 4. Test

- Start game
- Navigate to location
- Verify audio plays automatically

---

**Need help finding or creating assets? Check the game's Discord community or create an issue on GitHub.**
