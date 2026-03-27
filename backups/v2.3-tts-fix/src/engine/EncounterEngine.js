import { getLocationById } from '../data/locations';
import { getRandomEnemy } from '../data/enemies';
import { randomLine, treasureLines } from '../data/combatLines';

export class EncounterEngine {
  constructor() {
    this.stepsSinceEncounter = 0;
    this.encounterHistory = [];
  }

  checkForEncounter(currentLocation, playerLevel) {
    const location = getLocationById(currentLocation);
    
    if (!location || location.dangerLevel === 0 || !location.encounters || location.encounters.length === 0) {
      return { encounterTriggered: false };
    }

    this.stepsSinceEncounter++;

    const baseChance = location.encounterChance || 0.3;
    const adjustedChance = Math.min(0.8, baseChance + (this.stepsSinceEncounter * 0.05));

    if (Math.random() < adjustedChance) {
      return this.triggerEncounter(location, playerLevel);
    }

    return { encounterTriggered: false };
  }

  triggerEncounter(location, playerLevel) {
    this.stepsSinceEncounter = 0;

    const encounterTypes = ['enemy', 'treasure', 'event'];
    const typeWeights = [0.6, 0.2, 0.2];
    
    const roll = Math.random();
    let encounterType;
    
    if (roll < typeWeights[0]) {
      encounterType = 'enemy';
    } else if (roll < typeWeights[0] + typeWeights[1]) {
      encounterType = 'treasure';
    } else {
      encounterType = 'event';
    }

    let encounter;

    switch (encounterType) {
      case 'enemy':
        encounter = this.generateEnemyEncounter(location, playerLevel);
        break;
      case 'treasure':
        encounter = this.generateTreasureEncounter(location, playerLevel);
        break;
      case 'event':
        encounter = this.generateEventEncounter(location, playerLevel);
        break;
      default:
        encounter = this.generateEnemyEncounter(location, playerLevel);
    }

    this.encounterHistory.push({
      timestamp: Date.now(),
      location: location.id,
      type: encounterType,
      encounter
    });

    if (this.encounterHistory.length > 50) {
      this.encounterHistory.shift();
    }

    return {
      encounterTriggered: true,
      encounter
    };
  }

  generateEnemyEncounter(location, playerLevel) {
    const possibleEnemies = location.encounters;
    const randomEnemyId = possibleEnemies[Math.floor(Math.random() * possibleEnemies.length)];
    
    const enemy = getRandomEnemy(playerLevel);

    return {
      type: 'enemy',
      enemy
    };
  }

  generateTreasureEncounter(location, playerLevel) {
    const treasures = [
      { itemId: 'healing_potion', quantity: 2 },
      { itemId: 'gold_coins', quantity: 20 + (playerLevel * 10) },
      { itemId: 'mana_potion', quantity: 1 },
      { itemId: 'greater_healing_potion', quantity: 1 }
    ];

    const treasure = treasures[Math.floor(Math.random() * treasures.length)];

    return {
      type: 'treasure',
      items: [treasure],
      message: `${randomLine(treasureLines)} You find ${treasure.quantity}x ${treasure.itemId}.`
    };
  }

  generateEventEncounter(location, playerLevel) {
    const events = [
      {
        id: 'mysterious_merchant',
        message: 'You encounter a mysterious merchant willing to trade rare goods.',
        choices: ['Trade', 'Decline', 'Inspect Wares']
      },
      {
        id: 'wounded_traveler',
        message: 'A wounded traveler begs for help. They claim to have valuable information.',
        choices: ['Help', 'Ignore', 'Question']
      },
      {
        id: 'ancient_rune',
        message: 'You discover an ancient rune carved into stone. It pulses with magical energy.',
        choices: ['Touch', 'Study', 'Leave']
      },
      {
        id: 'fork_in_path',
        message: 'The path splits in two directions. One feels ominous, the other inviting.',
        choices: ['Take Dark Path', 'Take Light Path', 'Rest Here']
      },
      {
        id: 'animal_sounds',
        message: 'You hear strange animal sounds nearby. It could be prey, or predator.',
        choices: ['Investigate', 'Avoid', 'Hide']
      }
    ];

    const event = events[Math.floor(Math.random() * events.length)];

    return {
      type: 'event',
      event: event.id,
      message: event.message,
      choices: event.choices
    };
  }

  forceEncounter(type, location, playerLevel) {
    const locationData = getLocationById(location);
    
    switch (type) {
      case 'enemy':
        return {
          encounterTriggered: true,
          encounter: this.generateEnemyEncounter(locationData, playerLevel)
        };
      case 'treasure':
        return {
          encounterTriggered: true,
          encounter: this.generateTreasureEncounter(locationData, playerLevel)
        };
      case 'event':
        return {
          encounterTriggered: true,
          encounter: this.generateEventEncounter(locationData, playerLevel)
        };
      default:
        return { encounterTriggered: false };
    }
  }

  getEncounterHistory(limit = 10) {
    return this.encounterHistory.slice(-limit);
  }

  getState() {
    return {
      stepsSinceEncounter: this.stepsSinceEncounter,
      encounterHistory: this.encounterHistory
    };
  }

  loadState(state) {
    if (state) {
      this.stepsSinceEncounter = state.stepsSinceEncounter || 0;
      this.encounterHistory = state.encounterHistory || [];
    }
  }
}
