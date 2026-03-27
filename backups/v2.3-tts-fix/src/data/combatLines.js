// Pre-written combat narration pools
// These replace AI calls for standard combat turns, saving API costs
// Sound cues are embedded inline so they play at the right moment via the timeline system

// Helper to pick a random line from an array
export const randomLine = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Replaces {enemy}, {damage}, {health} placeholders in a line
export const fillTemplate = (line, data) => {
  return line
    .replace(/\{enemy\}/g, data.enemy || 'the creature')
    .replace(/\{damage\}/g, data.damage || '?')
    .replace(/\{health\}/g, data.health || '?')
    .replace(/\{playerHealth\}/g, data.playerHealth || '?');
};

// ─── PLAYER ATTACK (success) ───
export const attackSuccess = [
  "You swing your weapon with force, striking {enemy} squarely! The blow lands for {damage} damage!",
  "Your blade arcs through the air and connects! {enemy} staggers from the {damage} damage!",
  "With a fierce cry, you drive your weapon into {enemy}! {damage} damage cuts deep!",
  "You lunge forward and strike true! {enemy} recoils from the {damage} damage!",
  "Your attack finds its mark, slicing across {enemy}! {damage} damage dealt!",
  "You bring your weapon down hard! The strike deals {damage} damage to {enemy}!",
  "A powerful blow crashes into {enemy}! {damage} damage! The creature falters!",
  "You spin and strike with precision! {enemy} takes {damage} damage from your assault!",
  "Your weapon whistles through the air and bites deep! {damage} damage to {enemy}!",
  "With deadly aim, you slash at {enemy}! The attack deals {damage} damage!",
];

// ─── PLAYER ATTACK (weak/glancing) ───
export const attackWeak = [
  "Your weapon grazes {enemy}, dealing only {damage} damage. The creature barely flinches!",
  "You swing, but {enemy} partly deflects the blow. Only {damage} damage gets through!",
  "A glancing strike! {enemy} takes {damage} damage, but shrugs it off.",
  "Your attack connects, but the impact is weak. Just {damage} damage to {enemy}.",
];

// ─── ENEMY ATTACKS PLAYER ───
export const enemyAttack = [
  "{enemy} lashes out viciously! You take {damage} damage from the blow!",
  "The {enemy} strikes back with fury! {damage} damage tears through your defenses!",
  "{enemy} lunges at you with savage force! You feel the sting of {damage} damage!",
  "With a snarl, {enemy} attacks! The strike deals {damage} damage!",
  "{enemy} retaliates, claws and fury combined! {damage} damage strikes you!",
  "The {enemy} presses its attack! You take {damage} damage as it crashes into you!",
  "{enemy} swings wildly, catching you off guard! {damage} damage!",
  "A vicious counter from {enemy}! {damage} damage slams into you!",
];

// ─── ENEMY ATTACK (weak/miss) ───
export const enemyAttackWeak = [
  "{enemy} swipes at you, but the blow barely connects. Only {damage} damage.",
  "The {enemy} attacks clumsily! You take just {damage} damage.",
  "{enemy} strikes, but you deflect most of the force. {damage} damage.",
];

// ─── PLAYER DEFEND ───
export const defendLines = [
  "You raise your guard and brace for impact! {enemy} strikes, but your defense holds! Only {damage} damage gets through!",
  "You steady your stance and block! {enemy} hammers against your defense, dealing just {damage} damage!",
  "With practiced skill, you deflect the worst of the blow! {damage} damage slips through your guard!",
  "You shield yourself as {enemy} lunges! Your defense absorbs most of the hit! Only {damage} damage!",
  "Bracing hard, you weather the attack! {enemy} deals only {damage} damage against your guard!",
  "Your defensive stance holds firm! {damage} damage, but far less than it could have been!",
];

// ─── FLEE SUCCESS ───
export const fleeSuccess = [
  "You turn and sprint away from {enemy}! [SOUND: footsteps] The sounds of battle fade behind you as you escape into safety!",
  "With a burst of speed, you break away from {enemy}! [SOUND: footsteps] You live to fight another day!",
  "You dodge past {enemy} and run! [SOUND: footsteps] The creature's roar fades as distance grows between you!",
  "Seizing your chance, you flee from {enemy}! [SOUND: footsteps] Your heart pounds as you reach safety!",
];

// ─── FLEE FAILURE ───
export const fleeFail = [
  "You try to run, but {enemy} blocks your escape! [SOUND: monster_growl]",
  "Your attempt to flee fails! {enemy} cuts off your retreat! [SOUND: monster_growl]",
  "You turn to run, but {enemy} is too fast! [SOUND: swoosh] There's no escape!",
  "{enemy} anticipates your retreat and lunges to block you! [SOUND: monster_growl]",
];

// ─── VICTORY ───
export const victoryLines = [
  "With one final, devastating blow, {enemy} crumbles! [SOUND: victory] The battle is won!",
  "{enemy} lets out a last gasp and collapses in defeat! [SOUND: victory] Victory is yours, Adventurer!",
  "Your weapon strikes true for the last time! [SOUND: victory] {enemy} falls before your might!",
  "The fight is over! {enemy} crashes to the ground, vanquished! [SOUND: victory] Triumph!",
  "With a powerful final strike, you slay {enemy}! [SOUND: victory] The threat has been ended!",
];

// ─── DEFEAT ───
export const defeatLines = [
  "The world grows dark as {enemy}'s final blow strikes you down... [SOUND: dramatic_death_collapse]",
  "Your strength fails you... {enemy} stands victorious as everything fades... [SOUND: dramatic_death_collapse]",
  "You fall to your knees, unable to fight on... [SOUND: cry_of_pain] {enemy} looms over you as darkness takes hold...",
];

// ─── COMBAT START (encounter intro templates) ───
// These are modular: intro × reveal = many combinations
export const encounterIntros = {
  forest: [
    "The undergrowth rustles violently ahead of you.",
    "A twig snaps somewhere nearby, and the forest falls silent.",
    "The air shifts. Something is moving through the trees.",
    "A shadow darts between the trunks ahead.",
    "The birds go quiet. An ominous stillness settles over the path.",
  ],
  ruins: [
    "A scraping sound echoes off the ancient stone walls.",
    "Dust falls from above as something stirs in the ruins.",
    "The shadows between the crumbling pillars shift unnaturally.",
    "A cold draft carries the scent of decay from deeper within.",
    "Loose stones clatter somewhere in the darkness ahead.",
  ],
  cave: [
    "A low growl reverberates through the cavern.",
    "Something splashes in the dark water ahead.",
    "The flickering light of your torch reveals movement in the shadows.",
    "A guttural sound echoes from the tunnel ahead.",
    "The cave air grows heavy with a predatory presence.",
  ],
  generic: [
    "Your instincts scream danger. Something is close.",
    "The hairs on the back of your neck stand on end.",
    "A sudden sound breaks the stillness around you.",
    "You sense movement nearby. You are not alone.",
    "The atmosphere shifts. Danger approaches.",
  ],
};

export const encounterReveals = {
  goblin: [
    "[SOUND: goblin_cackle] A goblin bursts from cover, cackling with malice!",
    "[SOUND: goblin_cackle] A small, twisted figure leaps into view — a goblin, blade in hand!",
    "[SOUND: goblin_cackle] With a shrill cry, a goblin lunges toward you!",
  ],
  wolf: [
    "[SOUND: wolf_growl] A massive shadow wolf emerges, its red eyes burning with hunger!",
    "[SOUND: wolf_growl] A deep growl fills the air as a shadow wolf circles into view!",
    "[SOUND: wolf_growl] Gleaming fangs catch the light as a shadow wolf stalks forward!",
  ],
  skeleton: [
    "[SOUND: spooky_chimes] An ancient skeleton rises from the dust, bones rattling as it draws a rusted blade!",
    "[SOUND: spooky_chimes] The clatter of bones fills the air as an undead warrior assembles before you!",
    "[SOUND: spooky_chimes] From the shadows, a skeletal figure steps forward, its empty eyes fixed on you!",
  ],
  troll: [
    "[SOUND: troll_roars] The ground shakes as a massive cave troll lumbers into view!",
    "[SOUND: troll_roars] A thunderous roar announces the arrival of a hulking troll!",
    "[SOUND: troll_roars] Stone cracks beneath enormous feet as a cave troll charges forward!",
  ],
  wraith: [
    "[SOUND: ghost] An unnatural chill fills the air as a spectral wraith materializes before you!",
    "[SOUND: ghost] The temperature plummets. A ghostly figure drifts into existence, its whispers filling your mind!",
    "[SOUND: ghost] A haunting wail pierces the silence as an ethereal wraith appears from nothing!",
  ],
  dragon: [
    "[SOUND: dragon_roar] The sky darkens as massive wings blot out the light! A young dragon descends upon you!",
    "[SOUND: dragon_roar] Heat washes over you as a young dragon lands with earth-shaking force!",
    "[SOUND: dragon_roar] A deafening roar splits the air! A dragon drops from above, blocking your path!",
  ],
  zombie: [
    "[SOUND: zombie_moan] A rotting figure stumbles from the darkness, arms outstretched and moaning!",
    "[SOUND: zombie_moan] The stench of death precedes a shambling zombie that lurches toward you!",
    "[SOUND: zombie_moan] Decaying hands claw at the ground as a zombie drags itself into your path!",
  ],
  generic: [
    "[SOUND: danger] A hostile creature emerges from the shadows, ready to fight!",
    "[SOUND: danger] An enemy blocks your path, snarling with aggression!",
    "[SOUND: monster_growl] A menacing creature appears before you!",
  ],
};

// ─── TREASURE DISCOVERY ───
export const treasureLines = [
  "Something catches your attention on the ground. [SOUND: coin_pickup] A hidden cache of treasure!",
  "You notice a glint amongst the debris. [SOUND: chest_open] A small chest, still intact!",
  "Your foot strikes something solid. [SOUND: coin_pickup] Buried treasure!",
  "Tucked away in a crevice, you discover a stash someone left behind. [SOUND: chest_open]",
  "The faint jingle of coins draws your attention to a hidden pouch. [SOUND: coin_pickup]",
];

// ─── ENVIRONMENT ATMOSPHERE ───
export const environmentAtmosphere = {
  forest: [
    "[SOUND: rustling_bushes] The forest breathes around you. Leaves whisper in a gentle breeze as distant birds call through the canopy.",
    "[SOUND: footsteps_nature] You press deeper into the woods. The scent of moss and damp earth fills your lungs.",
    "Tall trees stretch endlessly above, their branches creaking softly. [SOUND: rustling_bushes] Something small scurries through the undergrowth.",
    "[SOUND: crow] A lone crow calls overhead as shafts of light filter through the dense canopy.",
  ],
  ruins: [
    "[SOUND: ominous_wind] A hollow wind moans through the crumbling ruins. Ancient stone walls rise around you, cracked and overgrown.",
    "Dust motes drift through shafts of pale light. [SOUND: footsteps] Your steps echo off the broken flagstones.",
    "[SOUND: spooky_chimes] The ruins hum with residual magic. Faded runes pulse faintly on weathered walls.",
    "Cracked pillars stand as silent witnesses to a forgotten age. [SOUND: ominous_wind] The wind carries whispers of the past.",
  ],
  cave: [
    "[SOUND: water_drips] Droplets echo in the darkness ahead. The cave air is cool and damp against your skin.",
    "The tunnel narrows around you. [SOUND: footsteps] Each step echoes endlessly into the deep.",
    "[SOUND: water_drips] Stalactites drip steadily. The only sound in the oppressive underground silence.",
    "The cave walls glisten with moisture. [SOUND: footsteps] You press forward into the unknown depths.",
  ],
  village: [
    "The sounds of daily life surround you. [SOUND: crowd_cheer] Voices mingle with the clatter of commerce.",
    "[SOUND: bell] A distant bell tolls as villagers go about their business around you.",
    "Warm light spills from doorways. The smell of bread and woodsmoke fills the air.",
    "[SOUND: horse_gallop] A cart rumbles past on the cobblestones as the village bustles with activity.",
  ],
};

// ─── LOCATION TYPE MAPPER ───
// Maps game location.type values to encounter intro categories
export const mapLocationType = (locationType) => {
  const typeMap = {
    wilderness: 'forest',
    dungeon: 'cave',
    settlement: 'ruins',
    boss_area: 'cave',
    safe_zone: 'generic',
    transition: 'generic',
  };
  return typeMap[locationType] || 'generic';
};

// ─── ITEM USE LINES ───
export const itemUseLines = {
  healing_potion: [
    "You uncork the healing potion and drink deeply. [SOUND: potion_drink] Warmth spreads through your body as wounds begin to mend.",
    "The healing potion glows as you raise it to your lips. [SOUND: potion_drink] Strength returns to your limbs!",
    "You gulp down the healing potion. [SOUND: potion_drink] A soothing energy washes over you, restoring your vitality.",
  ],
  greater_healing_potion: [
    "You drink the greater healing potion. [SOUND: potion_drink] Powerful restorative magic surges through every fiber of your being!",
    "The potent potion floods your body with healing energy! [SOUND: potion_drink] Wounds close and strength returns in full!",
  ],
  mana_potion: [
    "The mana potion tastes of starlight and thunder. [SOUND: potion_drink] [SOUND: magic] Arcane energy crackles through your veins!",
    "You drink the mana potion. [SOUND: potion_drink] [SOUND: magic] Your magical reserves swell with renewed power!",
  ],
};
