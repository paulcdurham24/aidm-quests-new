export const locations = [
  {
    id: 'dungeon_masters_hut',
    name: 'Dungeon Master\'s Hut',
    type: 'safe_zone',
    description: 'A cozy wooden hut filled with the scent of burning candles and old parchment. This is where your journey begins and where you can always return to rest.',
    ambientSound: 'crackling_fireplace',
    weather: 'indoor',
    dangerLevel: 0,
    encounters: [],
    connections: ['mystic_gateway'],
    narrativeIntro: 'You find yourself in a warm, welcoming hut. The Dungeon Master greets you with a knowing smile.',
    points_of_interest: [
      {
        name: 'Magical Door',
        description: 'An ornate door covered in glowing runes. When you\'re ready, this door will lead you to adventure.'
      },
      {
        name: 'Resting Chair',
        description: 'A comfortable chair where you can rest and save your progress.'
      }
    ]
  },
  {
    id: 'mystic_gateway',
    name: 'The Mystic Gateway',
    type: 'transition',
    description: 'A swirling portal of energy stands before you. Through it, you can hear distant sounds of a vast world awaiting exploration.',
    ambientSound: 'magical_hum',
    weather: 'mystical',
    dangerLevel: 0,
    encounters: [],
    connections: ['whispering_forest', 'abandoned_village', 'mountain_pass'],
    narrativeIntro: 'As you step through the magical door, reality shifts around you. You emerge at a crossroads between worlds.'
  },
  {
    id: 'whispering_forest',
    name: 'The Whispering Forest',
    type: 'wilderness',
    description: 'Ancient trees tower above, their leaves rustling with secrets. Shafts of dappled sunlight pierce the canopy, and you hear the distant calls of unknown creatures.',
    ambientSound: 'forest_ambience',
    weather: ['sunny', 'overcast', 'foggy'],
    dangerLevel: 2,
    encounters: ['goblin', 'wolf', 'bandit'],
    encounterChance: 0.3,
    connections: ['mystic_gateway', 'dark_grove', 'forest_shrine', 'abandoned_village'],
    narrativeIntro: 'You enter a vast forest. The trees seem to whisper among themselves, as if aware of your presence.',
    points_of_interest: [
      {
        name: 'Ancient Oak',
        description: 'A massive oak tree that looks thousands of years old. Strange symbols are carved into its bark.'
      },
      {
        name: 'Forest Stream',
        description: 'A crystal-clear stream babbles through the undergrowth. The water looks pure and refreshing.'
      }
    ]
  },
  {
    id: 'dark_grove',
    name: 'The Dark Grove',
    type: 'dungeon',
    description: 'The forest grows darker here. No sunlight penetrates this cursed place. You hear unsettling sounds echoing through the twisted trees.',
    ambientSound: 'dark_ambience',
    weather: ['always_dark'],
    dangerLevel: 4,
    encounters: ['skeleton', 'wraith', 'wolf'],
    encounterChance: 0.5,
    connections: ['whispering_forest'],
    narrativeIntro: 'An unnatural darkness surrounds you as you step into the cursed grove. Evil dwells here.',
    points_of_interest: [
      {
        name: 'Cursed Altar',
        description: 'An ancient stone altar stained with dark magic. It emanates a palpable sense of dread.'
      }
    ]
  },
  {
    id: 'abandoned_village',
    name: 'Abandoned Village',
    type: 'settlement',
    description: 'Crumbling buildings stand silent. This village was once bustling with life, but now only echoes remain.',
    ambientSound: 'wind_through_ruins',
    weather: ['overcast', 'rainy', 'foggy'],
    dangerLevel: 3,
    encounters: ['goblin', 'skeleton', 'bandit'],
    encounterChance: 0.4,
    connections: ['mystic_gateway', 'whispering_forest', 'haunted_manor'],
    narrativeIntro: 'You arrive at a ghost of civilization. Empty windows stare at you like hollow eyes.',
    points_of_interest: [
      {
        name: 'Old Well',
        description: 'A deep stone well in the village center. You hear strange echoes from its depths.'
      },
      {
        name: 'Merchant\'s Shop',
        description: 'A collapsed shop. Some items might still be salvageable in the ruins.'
      }
    ]
  },
  {
    id: 'haunted_manor',
    name: 'The Haunted Manor',
    type: 'dungeon',
    description: 'A decaying mansion looms before you. Broken windows and creaking doors promise terror within.',
    ambientSound: 'haunted_house',
    weather: ['stormy', 'always_dark'],
    dangerLevel: 5,
    encounters: ['wraith', 'skeleton', 'ghost'],
    encounterChance: 0.6,
    connections: ['abandoned_village'],
    narrativeIntro: 'The manor\'s doors creak open as you approach. A chill runs down your spine.',
    points_of_interest: [
      {
        name: 'Grand Staircase',
        description: 'A once-magnificent staircase, now rotted and dangerous. Portraits line the walls.'
      },
      {
        name: 'Dusty Library',
        description: 'Shelves of ancient books covered in cobwebs. Knowledge and secrets lie within.'
      }
    ]
  },
  {
    id: 'mountain_pass',
    name: 'Mountain Pass',
    type: 'wilderness',
    description: 'A narrow path winds through towering peaks. Wind howls around you, and loose stones skitter beneath your feet.',
    ambientSound: 'mountain_wind',
    weather: ['windy', 'snowy', 'clear'],
    dangerLevel: 3,
    encounters: ['wolf', 'troll', 'bandit'],
    encounterChance: 0.35,
    connections: ['mystic_gateway', 'troll_cave', 'mountain_peak'],
    narrativeIntro: 'The air grows thin as you climb higher. Majestic peaks surround you on all sides.',
    points_of_interest: [
      {
        name: 'Lookout Point',
        description: 'A flat outcropping with a breathtaking view of the lands below.'
      }
    ]
  },
  {
    id: 'troll_cave',
    name: 'Troll Cave',
    type: 'dungeon',
    description: 'A massive cavern carved into the mountainside. The stench is overwhelming, and bones litter the floor.',
    ambientSound: 'cave_ambience',
    weather: ['indoor'],
    dangerLevel: 6,
    encounters: ['troll'],
    encounterChance: 0.8,
    connections: ['mountain_pass'],
    narrativeIntro: 'You enter the lair of a fearsome creature. Your footsteps echo ominously.',
    points_of_interest: [
      {
        name: 'Troll Hoard',
        description: 'A pile of treasure and bones. The troll has been collecting for years.'
      }
    ]
  },
  {
    id: 'mountain_peak',
    name: 'Dragon\'s Peak',
    type: 'boss_area',
    description: 'The highest point in the realm. The air crackles with power, and you see massive claw marks in the stone.',
    ambientSound: 'dragon_lair',
    weather: ['clear', 'stormy'],
    dangerLevel: 8,
    encounters: ['dragon'],
    encounterChance: 0.9,
    connections: ['mountain_pass'],
    narrativeIntro: 'You have reached the legendary Dragon\'s Peak. Few who come here leave alive.',
    points_of_interest: [
      {
        name: 'Dragon Nest',
        description: 'A massive nest made of precious metals and gems. Steam rises from within.'
      }
    ]
  },
  {
    id: 'forest_shrine',
    name: 'Forest Shrine',
    type: 'safe_zone',
    description: 'A peaceful clearing with a small shrine dedicated to nature spirits. You feel protected here.',
    ambientSound: 'peaceful_nature',
    weather: ['sunny', 'clear'],
    dangerLevel: 0,
    encounters: [],
    connections: ['whispering_forest'],
    narrativeIntro: 'You discover a sacred place. The air here is pure and healing.',
    points_of_interest: [
      {
        name: 'Healing Fountain',
        description: 'A small fountain with crystal-clear water. Drinking from it restores your vitality.'
      }
    ]
  }
];

export const getLocationById = (id) => {
  return locations.find(location => location.id === id);
};

export const getLocationsByType = (type) => {
  return locations.filter(location => location.type === type);
};

export const getConnectedLocations = (locationId) => {
  const location = getLocationById(locationId);
  if (!location) return [];
  
  return location.connections.map(connId => getLocationById(connId)).filter(Boolean);
};

export const getRandomWeather = (location) => {
  if (typeof location.weather === 'string') {
    return location.weather;
  }
  
  if (Array.isArray(location.weather)) {
    const randomIndex = Math.floor(Math.random() * location.weather.length);
    return location.weather[randomIndex];
  }
  
  return 'clear';
};
