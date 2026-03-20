export const items = [
  {
    id: 'healing_potion',
    name: 'Healing Potion',
    type: 'consumable',
    description: 'A glowing red liquid that restores health',
    effect: { type: 'heal', value: 30 },
    rarity: 'common',
    sound: 'You drink the potion and feel warmth spreading through your body',
    stackable: true,
    maxStack: 10
  },
  {
    id: 'greater_healing_potion',
    name: 'Greater Healing Potion',
    type: 'consumable',
    description: 'A radiant crimson elixir with powerful restorative properties',
    effect: { type: 'heal', value: 60 },
    rarity: 'rare',
    sound: 'The potent elixir surges through you, mending your wounds rapidly',
    stackable: true,
    maxStack: 5
  },
  {
    id: 'mana_potion',
    name: 'Mana Potion',
    type: 'consumable',
    description: 'A shimmering blue liquid that restores magical energy',
    effect: { type: 'mana', value: 40 },
    rarity: 'common',
    sound: 'You feel mystical energy coursing through your veins',
    stackable: true,
    maxStack: 10
  },
  {
    id: 'rusty_dagger',
    name: 'Rusty Dagger',
    type: 'weapon',
    description: 'A worn blade, barely sharp but better than nothing',
    effect: { type: 'attack', value: 3 },
    rarity: 'common',
    sound: 'You grip the dagger. It feels light but unreliable'
  },
  {
    id: 'iron_sword',
    name: 'Iron Sword',
    type: 'weapon',
    description: 'A sturdy blade forged from solid iron',
    effect: { type: 'attack', value: 8 },
    rarity: 'common',
    sound: 'The iron sword feels balanced and dependable in your hand'
  },
  {
    id: 'ancient_sword',
    name: 'Ancient Sword',
    type: 'weapon',
    description: 'A blade from a forgotten age, still sharp and deadly',
    effect: { type: 'attack', value: 12 },
    rarity: 'rare',
    sound: 'The ancient blade hums with power as you wield it'
  },
  {
    id: 'legendary_sword',
    name: 'Dragonbane',
    type: 'weapon',
    description: 'A legendary blade said to have slain dragons of old',
    effect: { type: 'attack', value: 25 },
    rarity: 'legendary',
    sound: 'The legendary sword pulses with immense power, eager for battle'
  },
  {
    id: 'leather_armor',
    name: 'Leather Armor',
    type: 'armor',
    description: 'Tough leather that provides basic protection',
    effect: { type: 'defense', value: 5 },
    rarity: 'common',
    sound: 'You don the leather armor. It fits snugly around your body'
  },
  {
    id: 'chainmail',
    name: 'Chainmail Armor',
    type: 'armor',
    description: 'Interlocking metal rings that offer solid protection',
    effect: { type: 'defense', value: 10 },
    rarity: 'uncommon',
    sound: 'The chainmail clinks as you put it on, weighing heavily but reassuringly'
  },
  {
    id: 'plate_armor',
    name: 'Plate Armor',
    type: 'armor',
    description: 'Full body armor of thick steel plates',
    effect: { type: 'defense', value: 18 },
    rarity: 'rare',
    sound: 'The plate armor encases you in solid steel, a fortress around your body'
  },
  {
    id: 'gold_coins',
    name: 'Gold Coins',
    type: 'currency',
    description: 'Shining gold coins that jingle pleasantly',
    rarity: 'common',
    sound: 'The coins clink together in your pouch',
    stackable: true,
    maxStack: 9999
  },
  {
    id: 'wolf_pelt',
    name: 'Wolf Pelt',
    type: 'material',
    description: 'A thick, dark fur that could be sold or crafted',
    rarity: 'common',
    sound: 'The soft pelt feels warm to the touch',
    stackable: true,
    maxStack: 20
  },
  {
    id: 'troll_hide',
    name: 'Troll Hide',
    type: 'material',
    description: 'Incredibly tough skin that resists most blades',
    rarity: 'rare',
    sound: 'The hide is thick and leathery, almost stone-like',
    stackable: true,
    maxStack: 10
  },
  {
    id: 'dragon_scale',
    name: 'Dragon Scale',
    type: 'material',
    description: 'A shimmering scale from a dragon, nearly indestructible',
    rarity: 'legendary',
    sound: 'The scale gleams with an inner fire and feels impossibly hard',
    stackable: true,
    maxStack: 10
  },
  {
    id: 'dragon_tooth',
    name: 'Dragon Tooth',
    type: 'material',
    description: 'A massive tooth, sharp as the finest blade',
    rarity: 'legendary',
    sound: 'The tooth is as long as your forearm and razor-sharp',
    stackable: true,
    maxStack: 5
  },
  {
    id: 'bone_dust',
    name: 'Bone Dust',
    type: 'material',
    description: 'Fine powder from ancient bones, used in dark rituals',
    rarity: 'uncommon',
    sound: 'The dust is cold and feels oddly heavy for something so fine',
    stackable: true,
    maxStack: 50
  },
  {
    id: 'ectoplasm',
    name: 'Ectoplasm',
    type: 'material',
    description: 'A ghostly substance that shimmers between the physical and ethereal',
    rarity: 'rare',
    sound: 'The ectoplasm is cold and seems to phase in and out of existence',
    stackable: true,
    maxStack: 20
  },
  {
    id: 'soul_gem',
    name: 'Soul Gem',
    type: 'material',
    description: 'A crystalline gem that contains trapped spiritual energy',
    rarity: 'rare',
    sound: 'The gem whispers with trapped souls, pulsing with eerie light',
    stackable: true,
    maxStack: 10
  },
  {
    id: 'magic_amulet',
    name: 'Amulet of Protection',
    type: 'accessory',
    description: 'A mystical amulet that wards off harm',
    effect: { type: 'defense', value: 7 },
    rarity: 'rare',
    sound: 'The amulet hums with protective magic as you wear it'
  },
  {
    id: 'ring_of_strength',
    name: 'Ring of Strength',
    type: 'accessory',
    description: 'A golden ring that enhances the wearer\'s power',
    effect: { type: 'attack', value: 5 },
    rarity: 'rare',
    sound: 'You feel your muscles surge with unnatural strength'
  }
];

export const getItemById = (id) => {
  return items.find(item => item.id === id);
};

export const getItemsByType = (type) => {
  return items.filter(item => item.type === type);
};

export const getItemsByRarity = (rarity) => {
  return items.filter(item => item.rarity === rarity);
};
