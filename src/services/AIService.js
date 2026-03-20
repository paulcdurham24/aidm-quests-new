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
7. After narration, offer 2-4 clear choices when appropriate
8. Create tension and excitement through audio cues
9. Make the world feel alive and dangerous
10. Use immersive fantasy language

EXAMPLES OF GOOD NARRATION:
- "The wind howls through the trees. You hear the creak of branches overhead and feel cold air on your skin."
- "Footsteps echo behind you. Something is following, its breathing heavy and ragged."
- "You smell smoke and hear the crackle of fire in the distance."

AVOID:
- "You see..." (instead use "You sense..." or "You hear...")
- Modern language or references
- Long explanations
- Breaking immersion

Your goal is to make the player feel like they are truly IN the fantasy world through audio and sensory storytelling.`;
  }

  async generateExploration(context) {
    const prompt = `The adventurer explores ${context.location.name}. 

Current situation:
- Location: ${context.location.name} (${context.location.description})
- Player Level: ${context.player.level}
- Player Health: ${context.player.health}/${context.player.maxHealth}
- Time: ${context.location.weather || 'unknown'}

Create a vivid, atmospheric narration of what the player experiences. Focus on sounds, smells, and sensations. Keep it to 2-3 sentences. Make it immersive and exciting.`;

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

Narrate the outcome based on what makes sense for a fantasy adventure. Keep it exciting and atmospheric. Focus on what the adventurer HEARS and FEELS. 2-3 sentences.`;

    return this.makeRequest(prompt);
  }

  async processAction(action, context) {
    const prompt = `The adventurer says: "${action}"

Current situation:
- Location: ${context.location.name}
- Player Level: ${context.player.level}
- Player Health: ${context.player.health}/${context.player.maxHealth}
- In Combat: ${context.inCombat}
${context.currentEnemy ? `- Fighting: ${context.currentEnemy.name}` : ''}

As the Dungeon Master, respond to the adventurer's action. Keep it immersive, atmospheric, and focused on sound/sensation. 2-3 sentences.`;

    return this.makeRequest(prompt);
  }

  async generateCombatNarration(combatState, action) {
    const prompt = `Combat narration needed:
- Enemy: ${combatState.enemy.name}
- Enemy Health: ${combatState.enemyHealth}
- Player Action: ${action}

Create a vivid, exciting combat narration focusing on the SOUNDS of battle - clashing weapons, roars, impacts. Keep it to 1-2 sentences.`;

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

  getFallbackResponse(userMessage) {
    const fallbacks = [
      "The path ahead is shrouded in mystery. You hear distant sounds echoing through the air.",
      "An eerie silence falls. Something stirs in the shadows nearby.",
      "The wind picks up, carrying strange whispers. Your instincts warn you to be cautious.",
      "You sense a presence watching. The air grows thick with anticipation.",
      "Time seems to slow. Every sound is amplified in the tense atmosphere."
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
