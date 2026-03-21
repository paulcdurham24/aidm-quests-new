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

AUDIO VOLUME CONTROL:
You can dynamically control audio volumes to enhance immersion and atmosphere. Use these commands in your narration:
[VOLUME: ambient=0.5] - Set ambient background sounds (0.0 to 1.0)
[VOLUME: music=0.8] - Set music volume (0.0 to 1.0)
[VOLUME: effects=0.7] - Set sound effects volume (0.0 to 1.0)
[VOLUME: master=1.0] - Set overall master volume (0.0 to 1.0)

VOLUME EXAMPLES:
- Stealth moment: "You creep silently through the shadows. [VOLUME: ambient=0.1][VOLUME: music=0.2] Every sound feels magnified in the silence."
- Epic battle: "The dragon roars! [VOLUME: music=0.9][SOUND: dragon roar] Steel clashes against scales!"
- Peaceful rest: "You find a quiet clearing. [VOLUME: music=0.3][VOLUME: ambient=0.4] The forest hums softly around you as you rest."
- Tense moment: "Something lurks nearby. [VOLUME: ambient=0.05][VOLUME: music=0.6] You hear its breathing in the darkness..."
- Victory celebration: "Victory! [VOLUME: music=1.0][SOUND: victory fanfare] The creatures flee before you!"

USE VOLUME CONTROL TO:
- Lower ambient/music during dialogue or important narrative moments
- Raise music during combat or dramatic scenes
- Mute/lower sounds during stealth or suspenseful moments
- Create dynamic audio atmosphere that matches the narrative
- Emphasize key moments with volume swells
- Restore normal volumes after special moments (ambient=0.2, music=0.5 is baseline)

EXAMPLES OF GOOD NARRATION:
- "The wind howls through the trees. You hear the creak of branches overhead and feel cold air on your skin. You could press onward into the forest, or take shelter and rest."
- "Footsteps echo behind you. Something is following, its breathing heavy and ragged. [SOUND: heavy breathing] You should ready your weapon or try to hide!"
- "You smell smoke and hear the crackle of fire in the distance. Perhaps a campfire - friend or foe? You could investigate cautiously, or find another path."

AVOID:
- "You see..." (instead use "You sense..." or "You hear...")
- Modern language or references
- Long explanations
- Breaking immersion
- Leaving the player without clear options

Your goal is to make the player feel like they are truly IN the fantasy world through audio and sensory storytelling, while always guiding them on what to do next.`;
  }

  async generateExploration(context) {
    const audioInfo = context.audioState ? `\nCurrently playing: ambient=${context.audioState.currentAmbient || 'none'}, music=${context.audioState.currentMusic || 'none'}` : '';
    const prompt = `The adventurer explores ${context.location.name}. 

Current situation:
- Location: ${context.location.name} (${context.location.description})
- Player Level: ${context.player.level}
- Player Health: ${context.player.health}/${context.player.maxHealth}
- Time: ${context.location.weather || 'unknown'}${audioInfo}

Create a vivid, atmospheric narration of what the player experiences. Focus on sounds, smells, and sensations. Keep it to 2-3 sentences. Make it immersive and exciting.
Include [SOUND: description] tags for any specific sounds you describe.
End with 2-3 clear action suggestions for the player.`;

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
    const audioInfo = context.audioState ? `\n- Ambient audio: ${context.audioState.currentAmbient || 'none'}\n- Recent sounds: ${(context.audioState.recentSfx || []).map(s => s.name).join(', ') || 'none'}` : '';
    const inventoryInfo = context.inventory ? `\n- Inventory: ${context.inventory.map(i => `${i.quantity}x ${i.name || i.itemId}`).join(', ') || 'empty'}` : '';
    const prompt = `The adventurer says: "${action}"

Current situation:
- Location: ${context.location.name}
- Player Level: ${context.player.level}
- Player Health: ${context.player.health}/${context.player.maxHealth}
- In Combat: ${context.inCombat}${audioInfo}${inventoryInfo}
${context.currentEnemy ? `- Fighting: ${context.currentEnemy.name}` : ''}

As the Dungeon Master, respond to the adventurer's action. Keep it immersive, atmospheric, and focused on sound/sensation. 2-3 sentences.
Include [SOUND: description] for any sounds you narrate.
ALWAYS end with clear guidance on what the player can do next.`;

    return this.makeRequest(prompt);
  }

  async generateCombatNarration(combatState, action) {
    const healthPercent = Math.round((combatState.enemyHealth / (combatState.enemy.health || 100)) * 100);
    const playerHealthPercent = combatState.playerHealth ? Math.round((combatState.playerHealth / (combatState.playerMaxHealth || 100)) * 100) : 100;
    const prompt = `Combat narration needed:
- Enemy: ${combatState.enemy.name} (${healthPercent}% health remaining)
- Player Health: ${playerHealthPercent}%
- Player Action: ${action}

Create a vivid, exciting combat narration focusing on the SOUNDS of battle - clashing weapons, roars, impacts. Keep it to 1-2 sentences.
Include [SOUND: description] for battle sounds.
ALWAYS give tactical advice: if the enemy is weak say "press the attack!", if the player is hurt suggest "use a healing potion" or "try defending". Tell them their options: ATTACK, DEFEND, FLEE, or USE an item.`;

    return this.makeRequest(prompt);
  }

  async generateLootDescription(items) {
    if (items.length === 0) return '';

    const itemList = items.map(i => `${i.quantity}x ${i.itemId}`).join(', ');
    const prompt = `The adventurer found: ${itemList}

Describe in a brief, exciting way what they discovered. Focus on how the items SOUND or FEEL. 1 sentence.`;

    return this.makeRequest(prompt);
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
          max_tokens: 200,
          presence_penalty: 0.6,
          frequency_penalty: 0.3
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
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
