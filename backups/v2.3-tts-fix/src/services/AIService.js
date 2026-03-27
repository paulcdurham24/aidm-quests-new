import axios from 'axios';

export class AIService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.apiEndpoint = 'https://api.openai.com/v1/chat/completions';
    this.model = 'gpt-4';
    this.conversationHistory = [];
    this.systemPrompt = this.createSystemPrompt();
  }

  createSystemPrompt() {
    return `You are the Dungeon Master for "AIDM Quests", an immersive fantasy RPG designed for blind and visually impaired players.

CRITICAL RULES:
1. ALWAYS respond as a fantasy narrator and Dungeon Master
2. NEVER break character or mention the real world
3. Address the player as "Adventurer"
4. Focus heavily on SOUND, ATMOSPHERE, and SENSORY descriptions
5. Describe what the player HEARS, FEELS, and SMELLS - not what they "see"
6. Keep responses concise but vivid (2-4 sentences)
7. ALWAYS end with clear guidance - tell the player exactly what they can do next
8. Create tension and excitement through audio cues
9. Make the world feel alive and dangerous
10. Use immersive fantasy language
11. Be a HELPFUL guide - give tactical advice in combat and exploration tips

GUIDANCE RULES:
- After describing a scene, ALWAYS suggest 2-3 specific actions the player can take
- In combat, give tactical advice like "The creature looks weakened, press the attack!" or "You're wounded, consider defending or using a healing potion!"
- When exploring, hint at what might be nearby: "You hear water ahead - perhaps a stream to rest by" or "The air smells of danger - be ready for a fight"
- If the player seems lost, offer direction: "You could explore further, check your inventory, or rest to recover"
- Reference sounds playing in the environment to build immersion

SOUND CUE FORMAT:
When you want a specific sound effect to play, include it in brackets like [SOUND: description].
Examples: [SOUND: wolf growl], [SOUND: door creaking], [SOUND: sword clashing], [SOUND: thunder rumble]
The game engine will find and play the matching audio clip.

⚠️ CRITICAL - TIMELINE-BASED AUDIO SYSTEM:
Your text is processed as a FILM TIMELINE. The game engine reads your response LEFT TO RIGHT and executes each cue AT THE EXACT POINT where it appears in your text. This means:

1. [SOUND] and [VOLUME] cues trigger at the MOMENT they appear in the text
2. Text BEFORE a cue is spoken BEFORE the sound plays
3. Text AFTER a cue is spoken AFTER the sound plays
4. Think of your response as a FILM SCRIPT - place audio cues exactly where the action happens

PLACEMENT RULES:
- Place [SOUND: ...] IMMEDIATELY AFTER the sentence that describes the action
- Place [VOLUME: ...] IMMEDIATELY BEFORE the text that needs that volume level
- NEVER bunch multiple cues together at the start or end of your response
- SPREAD cues throughout your narration at the right dramatic moments
- Each sentence is spoken individually with pauses between them

✅ CORRECT PLACEMENT (sounds play at the right moment):
"I step forward and knock twice upon the ancient wood. [SOUND: door_knocks] The sound echoes through the chamber. [VOLUME: music=0.6] Now watch closely as I speak the words of power. APERIO PORTAS MYSTIC US! [SOUND: magic] The runes blaze with light! [SOUND: door_open] The great door swings wide, revealing darkness beyond."

❌ WRONG PLACEMENT (all sounds play at once at the start):
"[SOUND: door knocks][SOUND: magic][SOUND: door open][VOLUME: music=0.6] I step forward and knock twice. The runes blaze. The door opens."

❌ WRONG PLACEMENT (all sounds play at the end after everything is spoken):
"I knock twice. The runes blaze. The door opens. [SOUND: door knocks][SOUND: magic][SOUND: door open]"

AUDIO VOLUME CONTROL:
You can dynamically control audio volumes. Use these commands INLINE in your narration:
[VOLUME: ambient=0.5] - Set ambient background sounds (0.0 to 1.0)
[VOLUME: music=0.8] - Set music volume (0.0 to 1.0)
[VOLUME: effects=0.7] - Set sound effects volume (0.0 to 1.0)
[VOLUME: master=1.0] - Set overall master volume (0.0 to 1.0)

CRITICAL: You will be told what ambient sounds are CURRENTLY PLAYING. You MUST adjust volumes to match your narration!

AUDIO AWARENESS RULES:
1. If you say "silence falls" or "everything goes quiet" → place [VOLUME: ambient=0.0][VOLUME: music=0.0] RIGHT BEFORE that text
2. If you say "the forest grows still" but forest_ambience is playing → [VOLUME: ambient=0.0] BEFORE that sentence
3. If you describe "distant sounds" → [VOLUME: ambient=0.1] BEFORE that sentence
4. If you describe "loud" or "deafening" sounds → [VOLUME: ambient=0.8] BEFORE that sentence
5. ALWAYS check what's currently playing and adjust volumes to match your narrative!

COMPLETE TIMELINE EXAMPLE (study this carefully):
"[VOLUME: ambient=0.3][VOLUME: music=0.2] You creep through the darkened corridor, the stone cold beneath your fingers. [SOUND: footsteps] Your boots scrape against ancient flagstones. [VOLUME: ambient=0.0][VOLUME: music=0.0] Suddenly, everything falls deathly silent. [SOUND: heartbeat] You can hear nothing but the pounding of your own heart. [VOLUME: music=0.8] Then from the shadows, a terrible roar splits the air! [SOUND: monster_roar] A beast lunges toward you! [VOLUME: music=1.0] Steel yourself, Adventurer! You must fight, flee, or find cover!"

Notice how each cue appears at EXACTLY the right moment:
- Footsteps play AFTER mentioning walking
- Silence volumes set BEFORE the silence is described
- Heartbeat plays AFTER mentioning heart
- Monster roar plays AFTER mentioning the roar
- Music builds gradually through the scene

AVAILABLE SOUNDS - USE THESE EXACT NAMES (copy-paste them):
- Doors: door_open, door_close, door_knocks, door_creak, door_slam
- Combat: sword_swing, sword_fight, sword_stab, hit_impact, punch, swoosh, blade
- Magic: magic, magic_spell, spell_cast, holy_spell, fire_spell, ice_spell, wind_spell, water_spell, light_spell, flame_spell
- Monsters: monster_growl, monster_roar, monster_howl, monster_bite, monster_screech, goblin_cackle, goblin_scream, troll_roars, dragon_roar, dragon_growl, dragon_fire_attack, wolf_growl, wolf_howl, zombie_moan, banshee_scream, ghost, death_wraith, skeleton_death_breath, slime, flying_monster_screech
- Animals: horse_gallop, horse_neigh, crow, eagle, cat_meow, seagull, frogs
- Environment: footsteps, footsteps_nature, rustling_bushes, splash, wet_splash, explosion, bell, clock_ticking, bubbles
- Weather: thunder (maps to thunderstorm), wind (maps to ominous wind), rain
- Atmosphere: heartbeat, heartbeat_fast, spooky_chimes, danger, war_drums, ghost
- Human: cry_of_pain, male_pain, man_scream, woman_crying, crowd_cheer, snore
- Items: chest_open, coin_pickup, potion_drink, item_pickup
- Victory/Death: victory, death, dying_beast, level_up, character_death, dragon_death, goblin_death, cave_troll_death

DO NOT invent sound names. ONLY use names from this list above. If no exact match exists, pick the closest one.

AVOID:
- "You see..." (instead use "You sense..." or "You hear...")
- Modern language or references
- Bunching cues together instead of spreading them through the narrative
- Describing audio that contradicts what's playing
- Leaving the player without clear options

Your goal is to make the player feel like they are truly IN the fantasy world through audio and sensory storytelling, while always guiding them on what to do next.`;
  }

  async generateExploration(context) {
    const audioInfo = context.audioState ? `\n\n🔊 CURRENT AUDIO STATE (IMPORTANT - MATCH YOUR NARRATION TO THIS!):\n- Ambient: ${context.audioState.currentAmbient || 'none'} (volume: ${context.audioState.volume?.ambient || 0.2})\n- Music: ${context.audioState.currentMusic || 'none'} (volume: ${context.audioState.volume?.music || 0.5})\n- If you describe silence/quiet, SET VOLUMES TO 0.0!\n- If you describe loud sounds, RAISE VOLUMES!` : '';
    const prompt = `The adventurer explores ${context.location.name}. 

Current situation:
- Location: ${context.location.name} (${context.location.description})
- Player Level: ${context.player.level}
- Player Health: ${context.player.health}/${context.player.maxHealth}
- Time: ${context.location.weather || 'unknown'}${audioInfo}

Create a rich, immersive narration (3-4 paragraphs) of what the player experiences. Build the scene gradually like a movie director.

NARRATION REQUIREMENTS:
1. Start with immediate sensory input (what they hear, feel, smell)
2. Build atmosphere with layered descriptions
3. Include 1-2 sound cues at key dramatic moments only (NOT on every sentence)
4. Use volume controls sparingly to create emotional moments
5. Make the environment feel alive and dynamic
6. Consider the time of day and weather effects

REMEMBER - TIMELINE PLACEMENT:
- Place each [SOUND: ...] IMMEDIATELY AFTER the sentence describing that sound
- Place each [VOLUME: ...] IMMEDIATELY BEFORE the text that needs that volume
- SPREAD cues evenly through your response - never bunch them together
- Your text is read LEFT TO RIGHT as a film timeline - cues trigger where they appear

End with 3-4 clear action suggestions that make sense for this environment.`;

    return this.makeRequest(prompt);
  }

  async describeLocation(location, context) {
    const prompt = `The adventurer looks around ${location.name}.

Location details:
- Name: ${location.name}
- Type: ${location.type}
- Description: ${location.description}
- Danger Level: ${location.dangerLevel}

Describe what the adventurer senses in this location. Focus on sounds, atmosphere, temperature, and feeling. Keep it vivid but concise (2-3 sentences).`;

    return this.makeRequest(prompt);
  }

  async handleEvent(encounter, context) {
    const prompt = `An event occurs: ${encounter.message}

The adventurer has these choices: ${encounter.choices.join(', ')}

Current situation:
- Player Level: ${context.player.level}
- Player Health: ${context.player.health}/${context.player.maxHealth}
- Location: ${context.location.name}

Narrate the outcome based on what makes sense for a fantasy adventure. Keep it exciting and atmospheric. Focus on what the adventurer HEARS and FEELS. 2-3 sentences.
Include [SOUND: description] for any sounds in the scene.
End with clear guidance on what the adventurer should do next.`;

    return this.makeRequest(prompt);
  }

  async processAction(action, context) {
    const audioInfo = context.audioState ? `\n\n🔊 CURRENT AUDIO STATE:\n- Ambient: ${context.audioState.currentAmbient || 'none'} (volume: ${context.audioState.volume?.ambient || 0.2})\n- Music: ${context.audioState.currentMusic || 'none'} (volume: ${context.audioState.volume?.music || 0.5})\n- Recent SFX: ${(context.audioState.recentSfx || []).map(s => s.name).join(', ') || 'none'}\nREMEMBER: Match your narration to current audio! If you say "quiet", set volumes low!` : '';
    const inventoryInfo = context.inventory ? `\n- Inventory: ${context.inventory.map(i => `${i.quantity}x ${i.name || i.itemId}`).join(', ') || 'empty'}` : '';
    const prompt = `The adventurer says: "${action}"

Current situation:
- Location: ${context.location.name}
- Player Level: ${context.player.level}
- Player Health: ${context.player.health}/${context.player.maxHealth}
- In Combat: ${context.inCombat}${audioInfo}${inventoryInfo}
${context.currentEnemy ? `- Fighting: ${context.currentEnemy.name}` : ''}

As the Dungeon Master, respond to the adventurer's action with rich, detailed narration (3-4 paragraphs). Build the response like a cinematic scene.

RESPONSE REQUIREMENTS:
1. Acknowledge the player's action immediately
2. Describe the immediate consequences with sensory details
3. Build atmosphere with layered descriptions
4. Include 1-2 sound cues at key dramatic moments only
5. Use volume controls sparingly
6. Make the world feel responsive to player actions

REMEMBER - TIMELINE PLACEMENT:
- Place each [SOUND: ...] IMMEDIATELY AFTER the sentence describing that sound
- Place each [VOLUME: ...] IMMEDIATELY BEFORE the text that needs that volume
- SPREAD cues evenly through your response - never bunch them together
- Your text is read LEFT TO RIGHT as a film timeline - cues trigger where they appear

ALWAYS end with clear guidance on what the player can do next (3-4 specific options).`;

    return this.makeRequest(prompt);
  }

  async generateCombatNarration(combatState, action) {
    const healthPercent = Math.round((combatState.enemyHealth / (combatState.enemy.health || 100)) * 100);
    const playerHealthPercent = combatState.playerHealth ? Math.round((combatState.playerHealth / (combatState.playerMaxHealth || 100)) * 100) : 100;
    const prompt = `COMBAT SCENE - Cinematic Battle Narration
- Enemy: ${combatState.enemy.name} (${healthPercent}% health remaining)
- Player Health: ${playerHealthPercent}%
- Player Action: ${action}

Create an intense, cinematic combat scene (2-3 paragraphs) that feels like a movie battle sequence. Focus on the SOUNDS and SENSATIONS of combat.

COMBAT NARRATION REQUIREMENTS:
1. Describe the action immediately and viscerally
2. Focus on sounds: weapon impacts, creature roars, armor sounds, breathing
3. Include 1-2 combat-specific sound cues at the most dramatic moment only
4. Use volume controls sparingly
5. Describe the physical sensations of combat
6. Make the battle feel dangerous and exciting

REMEMBER - TIMELINE PLACEMENT:
- Place each [SOUND: ...] IMMEDIATELY AFTER the sentence describing that sound
- Place each [VOLUME: ...] IMMEDIATELY BEFORE the text that needs that volume
- SPREAD cues evenly - never bunch them together
- Your text is a FILM TIMELINE - cues trigger at the exact point they appear

TACTICAL GUIDANCE:
- If enemy health < 30%: "The creature staggers, nearly defeated! Press the attack!"
- If player health < 30%: "You're badly wounded! Use a healing potion or defend yourself!"
- If both healthy: "The battle rages! Attack, Defend, Flee, or Use an item"

Make every combat moment feel epic and dangerous. The player should feel the intensity of battle.

End with clear tactical options: ATTACK, DEFEND, FLEE, or USE an item.`;

    return this.makeRequest(prompt);
  }

  async generateLootDescription(items) {
    if (items.length === 0) return '';

    const itemList = items.map(i => `${i.quantity}x ${i.itemId}`).join(', ');
    const prompt = `The adventurer found: ${itemList}

Describe in a brief, exciting way what they discovered. Focus on how the items SOUND or FEEL. 1 sentence.`;

    return this.makeRequest(prompt);
  }

  async generateEpicNarration(sceneType, context) {
    // For key story moments - create film-script style narration
    const audioInfo = context.audioState ? `\nCurrently playing: ambient=${context.audioState.currentAmbient || 'none'}, music=${context.audioState.currentMusic || 'none'}` : '';
    
    const prompt = `EPIC NARRATION REQUEST - Film Script Style
Scene Type: ${sceneType}
Location: ${context.location.name}
Player Level: ${context.player.level}
Player Health: ${context.player.health}/${context.player.maxHealth}
${audioInfo}

Create a CINEMATIC, film-script style narration (4-6 paragraphs) that feels like a professional fantasy movie scene. This is a pivotal story moment that deserves maximum immersion and atmosphere.

FILM SCRIPT REQUIREMENTS:
1. Build atmosphere gradually like a movie scene
2. Use sensory details extensively (sounds, smells, temperature, air quality)
3. Create emotional impact through pacing and description
4. Plan audio cues like a sound designer - think about what sounds build tension, what sounds create wonder, what sounds signal danger
5. Use volume controls dynamically to create audio crescendos and decrescendos
6. Make it feel like the player is truly THERE in the scene

AUDIO DESIGN REQUIREMENTS:
- Include 8-12 sound cues SPREAD evenly throughout the narration
- Use volume changes to create emotional arcs (start quiet, build to climax, then resolve)
- Consider silence and quiet moments for dramatic effect

⚠️ CRITICAL - TIMELINE PLACEMENT:
Your text is processed as a FILM TIMELINE, left to right. Each [SOUND] and [VOLUME] triggers at the EXACT POINT it appears.
- Place [SOUND: ...] IMMEDIATELY AFTER the sentence that describes the sound
- Place [VOLUME: ...] IMMEDIATELY BEFORE the text that needs that volume level
- NEVER bunch cues together! SPREAD them through the narration at the right moments

✅ CORRECT EXAMPLE:
"[VOLUME: ambient=0.1][VOLUME: music=0.2] The door begins to glow faintly. [SOUND: magic] A soft hum fills the air. I step forward and knock twice upon the ancient wood. [SOUND: door knocks] The sound echoes through the chamber. [VOLUME: music=0.6] Now watch closely. APERIO PORTAS MYSTICUS! [SOUND: magic] The runes blaze with light! [VOLUME: music=0.9] Ancient power courses through the frame! [SOUND: door open] The great door swings wide. [VOLUME: music=1.0] Step through, brave Adventurer!"

❌ WRONG - BUNCHED TOGETHER:
"[SOUND: magic][SOUND: door knocks][SOUND: door open][VOLUME: music=1.0] The door glows. I knock. It opens."

SCENE TYPES AND APPROACHES:
- DOOR_OPENING: Build mystery → magical activation → dramatic reveal
- QUEST_START: Wonder → anticipation → call to adventure  
- BOSS_INTRO: Tension buildup → menace → combat readiness
- DISCOVERY: Curiosity → awe → revelation
- ESCAPE: Panic → urgency → relief

AVAILABLE SOUNDS (use these exact names):
door knocks, door open, door creak, magic, spell cast, footsteps, heartbeat, monster roar, wolf howl, sword swing, rustling bushes, thunder, war drums, spooky chimes, crowd cheer

Make this feel like a professionally directed scene from a fantasy film. Take time to build the atmosphere properly. The player should feel completely immersed in this moment.

End with 3-4 clear action choices that flow naturally from the scene.`;

    return this.makeRequestWithExtendedTokens(prompt);
  }

  async makeRequestWithExtendedTokens(userMessage) {
    try {
      this.conversationHistory.push({
        role: 'user',
        content: userMessage
      });

      if (this.conversationHistory.length > 10) {
        this.conversationHistory = this.conversationHistory.slice(-10);
      }

      const messages = [
        { role: 'system', content: this.systemPrompt },
        ...this.conversationHistory
      ];

      const response = await axios.post(
        this.apiEndpoint,
        {
          model: this.model,
          messages: messages,
          temperature: 0.8,
          max_tokens: 800, // Extended for longer, cinematic responses
          presence_penalty: 0.6,
          frequency_penalty: 0.3
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000 // Extended timeout for longer responses
        }
      );

      const aiResponse = response.data.choices[0].message.content.trim();

      this.conversationHistory.push({
        role: 'assistant',
        content: aiResponse
      });

      return aiResponse;
    } catch (error) {
      console.error('AI Service Error:', error);

      if (error.response) {
        console.error('API Response Error:', error.response.data);
      }

      return this.getFallbackResponse(userMessage);
    }
  }

  async makeRequest(userMessage) {
    try {
      this.conversationHistory.push({
        role: 'user',
        content: userMessage
      });

      if (this.conversationHistory.length > 10) {
        this.conversationHistory = this.conversationHistory.slice(-10);
      }

      const messages = [
        { role: 'system', content: this.systemPrompt },
        ...this.conversationHistory
      ];

      const response = await axios.post(
        this.apiEndpoint,
        {
          model: this.model,
          messages: messages,
          temperature: 0.8,
          max_tokens: 400, // Increased from 200 for longer responses
          presence_penalty: 0.6,
          frequency_penalty: 0.3
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 45000 // Increased timeout
        }
      );

      const aiResponse = response.data.choices[0].message.content.trim();

      this.conversationHistory.push({
        role: 'assistant',
        content: aiResponse
      });

      return aiResponse;
    } catch (error) {
      console.error('AI Service Error:', error);

      if (error.response) {
        console.error('API Response Error:', error.response.data);
      }

      return this.getFallbackResponse(userMessage);
    }
  }

  extractSoundCues(text) {
    const soundCues = [];
    const regex = /\[SOUND:\s*([^\]]+)\]/gi;
    let match;
    while ((match = regex.exec(text)) !== null) {
      soundCues.push(match[1].trim());
    }
    return soundCues;
  }

  stripSoundCues(text) {
    return text.replace(/\[SOUND:\s*[^\]]+\]/gi, '').replace(/\s+/g, ' ').trim();
  }

  extractVolumeCues(text) {
    const volumeCues = [];
    // Match [VOLUME: type=value] format
    const regex = /\[VOLUME:\s*([a-z]+)=([\d.]+)\]/gi;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const type = match[1].trim().toLowerCase();
      const value = parseFloat(match[2]);
      if (!isNaN(value) && value >= 0 && value <= 1) {
        volumeCues.push({ type, value });
      }
    }
    return volumeCues;
  }

  stripVolumeCues(text) {
    return text.replace(/\[VOLUME:\s*[a-z]+=[\d.]+\]/gi, '').replace(/\s+/g, ' ').trim();
  }

  getFallbackResponse(userMessage) {
    const fallbacks = [
      "The path ahead is shrouded in mystery. You hear distant sounds echoing through the air. You could explore further, check your inventory, or rest here a while.",
      "An eerie silence falls. Something stirs in the shadows nearby. Stay alert, Adventurer! You could investigate, move on, or prepare for trouble.",
      "The wind picks up, carrying strange whispers. Your instincts warn you to be cautious. You might want to explore carefully, rest to recover, or check your equipment.",
      "You sense a presence watching. The air grows thick with anticipation. Ready yourself, Adventurer! You can explore, check your status, or prepare for what lies ahead.",
      "Time seems to slow. Every sound is amplified in the tense atmosphere. What will you do? Explore onward, rest, or check your supplies?"
    ];

    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  clearHistory() {
    this.conversationHistory = [];
  }

  setModel(model) {
    this.model = model;
  }

  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  getConversationHistory() {
    return [...this.conversationHistory];
  }
}
