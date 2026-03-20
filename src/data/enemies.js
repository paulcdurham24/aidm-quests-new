export const enemies = [
  {
    id: 'goblin',
    name: 'Goblin',
    description: 'A small, twisted creature with sharp claws and glowing yellow eyes',
    health: 30,
    attack: 5,
    defense: 2,
    level: 1,
    sounds: {
      appear: 'You hear guttural grunting and the patter of small feet',
      attack: 'The goblin lunges at you with its jagged claws',
      hit: 'You hear a pained shriek as your weapon strikes the goblin',
      death: 'The goblin collapses with a final whimper'
    },
    loot: [
      { itemId: 'gold_coins', quantity: 5, chance: 0.8 },
      { itemId: 'rusty_dagger', quantity: 1, chance: 0.3 }
    ]
  },
  {
    id: 'wolf',
    name: 'Shadow Wolf',
    description: 'A large predatory wolf with midnight-black fur and piercing red eyes',
    health: 45,
    attack: 8,
    defense: 3,
    level: 2,
    sounds: {
      appear: 'A menacing growl echoes through the air, followed by the sound of padded paws',
      attack: 'The wolf snarls and snaps its powerful jaws at you',
      hit: 'The wolf yelps in pain as your attack connects',
      death: 'The wolf lets out one final howl before falling silent'
    },
    loot: [
      { itemId: 'wolf_pelt', quantity: 1, chance: 0.9 },
      { itemId: 'gold_coins', quantity: 10, chance: 0.7 }
    ]
  },
  {
    id: 'skeleton',
    name: 'Ancient Skeleton',
    description: 'The rattling bones of a long-dead warrior, animated by dark magic',
    health: 40,
    attack: 7,
    defense: 4,
    level: 2,
    sounds: {
      appear: 'You hear the eerie rattling of bones echoing in the darkness',
      attack: 'The skeleton swings its rusty sword with surprising speed',
      hit: 'Bones crack and splinter as you strike the undead warrior',
      death: 'The skeleton collapses into a pile of lifeless bones'
    },
    loot: [
      { itemId: 'bone_dust', quantity: 3, chance: 0.9 },
      { itemId: 'ancient_sword', quantity: 1, chance: 0.4 },
      { itemId: 'gold_coins', quantity: 15, chance: 0.6 }
    ]
  },
  {
    id: 'troll',
    name: 'Cave Troll',
    description: 'A massive, hulking creature with rock-hard skin and immense strength',
    health: 80,
    attack: 12,
    defense: 6,
    level: 4,
    sounds: {
      appear: 'The ground trembles beneath heavy footsteps. A deep, rumbling roar fills the air',
      attack: 'The troll swings its massive fist with earth-shaking force',
      hit: 'Your weapon barely pierces the troll\'s thick hide, but it roars in anger',
      death: 'The mighty troll crashes to the ground like a falling boulder'
    },
    loot: [
      { itemId: 'troll_hide', quantity: 1, chance: 0.8 },
      { itemId: 'gold_coins', quantity: 50, chance: 1.0 },
      { itemId: 'healing_potion', quantity: 2, chance: 0.5 }
    ]
  },
  {
    id: 'wraith',
    name: 'Ethereal Wraith',
    description: 'A ghostly figure that seems to exist between worlds, its touch drains life itself',
    health: 50,
    attack: 10,
    defense: 2,
    level: 3,
    sounds: {
      appear: 'An unnatural chill fills the air. You hear whispers of the damned',
      attack: 'The wraith reaches out with spectral claws, draining your very essence',
      hit: 'Your weapon passes through the wraith, but it shrieks in ethereal pain',
      death: 'The wraith dissolves into mist with a final, haunting wail'
    },
    loot: [
      { itemId: 'ectoplasm', quantity: 2, chance: 0.9 },
      { itemId: 'soul_gem', quantity: 1, chance: 0.3 },
      { itemId: 'gold_coins', quantity: 25, chance: 0.7 }
    ]
  },
  {
    id: 'dragon',
    name: 'Young Dragon',
    description: 'Even in youth, this dragon is a formidable opponent with scales like armor and breath of fire',
    health: 150,
    attack: 20,
    defense: 10,
    level: 7,
    sounds: {
      appear: 'The air grows hot. You hear the beating of massive wings and a thunderous roar',
      attack: 'The dragon unleashes a torrent of scorching flame',
      hit: 'Your attack strikes true, causing the dragon to roar in fury',
      death: 'The dragon crashes down with a final earth-shaking impact'
    },
    loot: [
      { itemId: 'dragon_scale', quantity: 3, chance: 1.0 },
      { itemId: 'dragon_tooth', quantity: 1, chance: 0.8 },
      { itemId: 'gold_coins', quantity: 200, chance: 1.0 },
      { itemId: 'legendary_sword', quantity: 1, chance: 0.2 }
    ]
  }
];

export const getEnemyById = (id) => {
  return enemies.find(enemy => enemy.id === id);
};

export const getRandomEnemy = (playerLevel = 1) => {
  const suitableEnemies = enemies.filter(enemy => 
    enemy.level <= playerLevel + 2 && enemy.level >= Math.max(1, playerLevel - 1)
  );
  
  if (suitableEnemies.length === 0) {
    return enemies[0];
  }
  
  const randomIndex = Math.floor(Math.random() * suitableEnemies.length);
  return { ...suitableEnemies[randomIndex] };
};
