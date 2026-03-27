export class QuestEngine {
  constructor() {
    this.activeQuests = [];
    this.completedQuests = [];
    this.questProgress = {};
  }

  initializeQuests() {
    const starterQuest = {
      id: 'first_steps',
      name: 'First Steps',
      description: 'Explore the world beyond the Mystic Gateway',
      type: 'exploration',
      objectives: [
        {
          id: 'visit_forest',
          description: 'Visit the Whispering Forest',
          type: 'location',
          target: 'whispering_forest',
          completed: false
        }
      ],
      rewards: {
        experience: 50,
        items: [{ itemId: 'healing_potion', quantity: 2 }]
      },
      status: 'active'
    };

    this.addQuest(starterQuest);
  }

  addQuest(quest) {
    if (this.activeQuests.find(q => q.id === quest.id)) {
      return { success: false, message: 'Quest already active' };
    }

    this.activeQuests.push({
      ...quest,
      startedAt: Date.now()
    });

    this.questProgress[quest.id] = {
      objectivesCompleted: 0,
      totalObjectives: quest.objectives.length
    };

    return {
      success: true,
      message: `New quest accepted: ${quest.name}`,
      quest
    };
  }

  updateQuestProgress(questId, objectiveId) {
    const quest = this.activeQuests.find(q => q.id === questId);
    
    if (!quest) {
      return { success: false, message: 'Quest not found' };
    }

    const objective = quest.objectives.find(obj => obj.id === objectiveId);
    
    if (!objective) {
      return { success: false, message: 'Objective not found' };
    }

    if (objective.completed) {
      return { success: false, message: 'Objective already completed' };
    }

    objective.completed = true;
    this.questProgress[questId].objectivesCompleted++;

    const allCompleted = quest.objectives.every(obj => obj.completed);

    if (allCompleted) {
      return this.completeQuest(questId);
    }

    return {
      success: true,
      message: `Quest objective completed: ${objective.description}`,
      questComplete: false,
      progress: this.questProgress[questId]
    };
  }

  checkLocationObjectives(locationId) {
    const results = [];

    this.activeQuests.forEach(quest => {
      quest.objectives.forEach(objective => {
        if (objective.type === 'location' && 
            objective.target === locationId && 
            !objective.completed) {
          const result = this.updateQuestProgress(quest.id, objective.id);
          results.push(result);
        }
      });
    });

    return results;
  }

  checkEnemyKillObjectives(enemyId) {
    const results = [];

    this.activeQuests.forEach(quest => {
      quest.objectives.forEach(objective => {
        if (objective.type === 'kill_enemy' && 
            (objective.target === enemyId || objective.target === 'any') && 
            !objective.completed) {
          
          objective.currentCount = (objective.currentCount || 0) + 1;
          
          if (objective.currentCount >= (objective.requiredCount || 1)) {
            const result = this.updateQuestProgress(quest.id, objective.id);
            results.push(result);
          }
        }
      });
    });

    return results;
  }

  checkItemCollectionObjectives(itemId) {
    const results = [];

    this.activeQuests.forEach(quest => {
      quest.objectives.forEach(objective => {
        if (objective.type === 'collect_item' && 
            objective.target === itemId && 
            !objective.completed) {
          
          objective.currentCount = (objective.currentCount || 0) + 1;
          
          if (objective.currentCount >= (objective.requiredCount || 1)) {
            const result = this.updateQuestProgress(quest.id, objective.id);
            results.push(result);
          }
        }
      });
    });

    return results;
  }

  completeQuest(questId) {
    const questIndex = this.activeQuests.findIndex(q => q.id === questId);
    
    if (questIndex === -1) {
      return { success: false, message: 'Quest not found' };
    }

    const quest = this.activeQuests[questIndex];
    quest.completedAt = Date.now();
    quest.status = 'completed';

    this.completedQuests.push(quest);
    this.activeQuests.splice(questIndex, 1);

    return {
      success: true,
      message: `Quest completed: ${quest.name}!`,
      questComplete: true,
      rewards: quest.rewards,
      quest
    };
  }

  getActiveQuests() {
    return this.activeQuests.map(quest => ({
      id: quest.id,
      name: quest.name,
      description: quest.description,
      progress: this.questProgress[quest.id],
      objectives: quest.objectives.map(obj => ({
        description: obj.description,
        completed: obj.completed,
        currentCount: obj.currentCount,
        requiredCount: obj.requiredCount
      }))
    }));
  }

  getQuestById(questId) {
    return this.activeQuests.find(q => q.id === questId) || 
           this.completedQuests.find(q => q.id === questId);
  }

  getQuestDescription() {
    if (this.activeQuests.length === 0) {
      return 'You have no active quests.';
    }

    const descriptions = this.activeQuests.map(quest => {
      const progress = this.questProgress[quest.id];
      const incomplete = quest.objectives.filter(obj => !obj.completed);
      
      return `${quest.name}: ${quest.description}. ${progress.objectivesCompleted}/${progress.totalObjectives} objectives complete.`;
    });

    return 'Active Quests: ' + descriptions.join(' | ');
  }

  getState() {
    return {
      activeQuests: this.activeQuests,
      completedQuests: this.completedQuests,
      questProgress: this.questProgress
    };
  }

  loadState(state) {
    if (state) {
      this.activeQuests = state.activeQuests || [];
      this.completedQuests = state.completedQuests || [];
      this.questProgress = state.questProgress || {};
    }
  }
}
