import {
  randomLine, fillTemplate,
  attackSuccess, attackWeak,
  enemyAttack, enemyAttackWeak,
  defendLines,
  fleeSuccess, fleeFail,
  victoryLines, defeatLines,
  encounterIntros, encounterReveals,
  mapLocationType,
} from '../data/combatLines';

export class CombatEngine {
  constructor() {
    this.inCombat = false;
    this.currentEnemy = null;
    this.turnCount = 0;
    this.combatLog = [];
  }

  startCombat(enemy, playerStats, locationType) {
    this.inCombat = true;
    this.currentEnemy = { ...enemy };
    this.turnCount = 0;
    this.combatLog = [];

    // Build rich encounter intro from templates
    const mappedType = mapLocationType(locationType);
    const introPool = encounterIntros[mappedType] || encounterIntros.generic;
    const revealPool = encounterReveals[enemy.id] || encounterReveals.generic;
    const introMessage = `${randomLine(introPool)} ${randomLine(revealPool)}`;
    this.addToLog(introMessage);

    return {
      inCombat: true,
      enemy: this.currentEnemy,
      message: introMessage
    };
  }

  playerAttack(playerStats) {
    if (!this.inCombat || !this.currentEnemy) {
      return { success: false, message: 'Not in combat' };
    }

    this.turnCount++;

    const baseDamage = playerStats.attack + Math.floor(Math.random() * 5);
    const actualDamage = Math.max(1, baseDamage - this.currentEnemy.defense);

    this.currentEnemy.health -= actualDamage;

    // Use rich pre-written lines with inline sound cues
    const pool = actualDamage <= 2 ? attackWeak : attackSuccess;
    let message = fillTemplate(randomLine(pool), {
      enemy: this.currentEnemy.name,
      damage: actualDamage,
    });

    this.addToLog(message);

    if (this.currentEnemy.health <= 0) {
      return this.endCombat(true);
    }

    const enemyResult = this.enemyAttack(playerStats);

    return {
      success: true,
      playerDamage: actualDamage,
      enemyHealth: this.currentEnemy.health,
      enemyDamage: enemyResult.damage,
      playerHealth: enemyResult.playerHealth,
      message: message + ' ' + enemyResult.message,
      combatLog: [...this.combatLog],
      combatOver: false
    };
  }

  enemyAttack(playerStats) {
    const baseDamage = this.currentEnemy.attack + Math.floor(Math.random() * 3);
    const actualDamage = Math.max(1, baseDamage - playerStats.defense);

    const pool = actualDamage <= 2 ? enemyAttackWeak : enemyAttack;
    const message = fillTemplate(randomLine(pool), {
      enemy: this.currentEnemy.name,
      damage: actualDamage,
    });
    this.addToLog(message);

    return {
      damage: actualDamage,
      playerHealth: playerStats.health - actualDamage,
      message
    };
  }

  playerDefend(playerStats) {
    if (!this.inCombat || !this.currentEnemy) {
      return { success: false, message: 'Not in combat' };
    }

    this.turnCount++;

    const baseDamage = this.currentEnemy.attack + Math.floor(Math.random() * 3);
    const reducedDamage = Math.max(0, Math.floor((baseDamage - playerStats.defense) * 0.5));

    const message = fillTemplate(randomLine(defendLines), {
      enemy: this.currentEnemy.name,
      damage: reducedDamage,
    });
    this.addToLog(message);

    return {
      success: true,
      enemyDamage: reducedDamage,
      playerHealth: playerStats.health - reducedDamage,
      message,
      combatLog: [...this.combatLog],
      combatOver: false
    };
  }

  playerFlee(playerStats) {
    if (!this.inCombat || !this.currentEnemy) {
      return { success: false, message: 'Not in combat' };
    }

    const fleeChance = 0.5 + (playerStats.level * 0.05);
    const fled = Math.random() < fleeChance;

    if (fled) {
      const message = fillTemplate(randomLine(fleeSuccess), { enemy: this.currentEnemy.name });
      this.addToLog(message);
      this.endCombatWithoutReward();

      return {
        success: true,
        fled: true,
        message,
        combatOver: true
      };
    } else {
      this.turnCount++;
      const message = fillTemplate(randomLine(fleeFail), { enemy: this.currentEnemy.name });
      this.addToLog(message);

      const enemyResult = this.enemyAttack(playerStats);

      return {
        success: false,
        fled: false,
        enemyDamage: enemyResult.damage,
        playerHealth: enemyResult.playerHealth,
        message: message + ' ' + enemyResult.message,
        combatLog: [...this.combatLog],
        combatOver: false
      };
    }
  }

  endCombat(playerVictory) {
    const enemy = this.currentEnemy;
    let message = '';
    let loot = [];

    if (playerVictory) {
      message = fillTemplate(randomLine(victoryLines), { enemy: enemy.name });
      
      if (enemy.loot) {
        enemy.loot.forEach(lootItem => {
          if (Math.random() < lootItem.chance) {
            loot.push({
              itemId: lootItem.itemId,
              quantity: lootItem.quantity
            });
          }
        });
      }

      if (loot.length > 0) {
        message += ' You found: ' + loot.map(l => `${l.quantity}x ${l.itemId}`).join(', ');
      }
    } else {
      message = 'You have been defeated...';
    }

    this.addToLog(message);

    const result = {
      victory: playerVictory,
      loot,
      message,
      enemy: { ...enemy },
      combatLog: [...this.combatLog],
      combatOver: true,
      success: true
    };

    this.inCombat = false;
    this.currentEnemy = null;

    return result;
  }

  endCombatWithoutReward() {
    this.inCombat = false;
    this.currentEnemy = null;
  }

  addToLog(message) {
    this.combatLog.push({
      turn: this.turnCount,
      message,
      timestamp: Date.now()
    });
  }

  isInCombat() {
    return this.inCombat;
  }

  getCurrentEnemy() {
    return this.currentEnemy ? { ...this.currentEnemy } : null;
  }

  getCombatLog() {
    return [...this.combatLog];
  }

  getState() {
    return {
      inCombat: this.inCombat,
      currentEnemy: this.currentEnemy,
      turnCount: this.turnCount,
      combatLog: this.combatLog
    };
  }

  loadState(state) {
    if (state) {
      this.inCombat = state.inCombat || false;
      this.currentEnemy = state.currentEnemy || null;
      this.turnCount = state.turnCount || 0;
      this.combatLog = state.combatLog || [];
    }
  }
}
