import { getItemById } from '../data/items';

export class InventoryEngine {
  constructor() {
    this.inventory = [];
    this.equippedItems = {
      weapon: null,
      armor: null,
      accessory: null
    };
  }

  addItem(itemId, quantity = 1) {
    const itemTemplate = getItemById(itemId);
    if (!itemTemplate) {
      console.warn(`Item ${itemId} not found`);
      return false;
    }

    const existingItem = this.inventory.find(item => item.id === itemId);
    
    if (itemTemplate.stackable && existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      const maxStack = itemTemplate.maxStack || 99;
      
      if (newQuantity <= maxStack) {
        existingItem.quantity = newQuantity;
      } else {
        existingItem.quantity = maxStack;
      }
    } else {
      this.inventory.push({
        id: itemId,
        ...itemTemplate,
        quantity: itemTemplate.stackable ? quantity : 1
      });
    }

    return true;
  }

  removeItem(itemId, quantity = 1) {
    const itemIndex = this.inventory.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return false;
    }

    const item = this.inventory[itemIndex];
    
    if (item.stackable) {
      item.quantity -= quantity;
      if (item.quantity <= 0) {
        this.inventory.splice(itemIndex, 1);
      }
    } else {
      this.inventory.splice(itemIndex, 1);
    }

    return true;
  }

  hasItem(itemId, quantity = 1) {
    const item = this.inventory.find(item => item.id === itemId);
    if (!item) return false;
    
    return item.stackable ? item.quantity >= quantity : true;
  }

  getItem(itemId) {
    return this.inventory.find(item => item.id === itemId);
  }

  useItem(itemId) {
    const item = this.getItem(itemId);
    if (!item) {
      return { success: false, message: 'Item not found in inventory' };
    }

    if (item.type === 'consumable') {
      const result = {
        success: true,
        effect: item.effect,
        message: item.sound
      };
      
      this.removeItem(itemId, 1);
      return result;
    }

    return { success: false, message: 'This item cannot be used directly' };
  }

  equipItem(itemId) {
    const item = this.getItem(itemId);
    if (!item) {
      return { success: false, message: 'Item not found in inventory' };
    }

    const equipSlot = item.type === 'weapon' ? 'weapon' : 
                      item.type === 'armor' ? 'armor' : 
                      item.type === 'accessory' ? 'accessory' : null;

    if (!equipSlot) {
      return { success: false, message: 'This item cannot be equipped' };
    }

    if (this.equippedItems[equipSlot]) {
      this.unequipItem(equipSlot);
    }

    this.equippedItems[equipSlot] = item;
    this.removeItem(itemId);

    return {
      success: true,
      message: `You equipped ${item.name}. ${item.sound}`,
      effect: item.effect
    };
  }

  unequipItem(slot) {
    if (!this.equippedItems[slot]) {
      return { success: false, message: 'Nothing equipped in that slot' };
    }

    const item = this.equippedItems[slot];
    this.addItem(item.id, 1);
    this.equippedItems[slot] = null;

    return {
      success: true,
      message: `You unequipped ${item.name}`,
      effect: item.effect
    };
  }

  getEquippedStats() {
    let totalAttack = 0;
    let totalDefense = 0;

    Object.values(this.equippedItems).forEach(item => {
      if (item && item.effect) {
        if (item.effect.type === 'attack') {
          totalAttack += item.effect.value;
        } else if (item.effect.type === 'defense') {
          totalDefense += item.effect.value;
        }
      }
    });

    return { attack: totalAttack, defense: totalDefense };
  }

  getInventoryList() {
    return this.inventory.map(item => ({
      id: item.id,
      name: item.name,
      type: item.type,
      quantity: item.stackable ? item.quantity : 1,
      description: item.description
    }));
  }

  getEquippedItems() {
    return { ...this.equippedItems };
  }

  getTotalGold() {
    const goldItem = this.getItem('gold_coins');
    return goldItem ? goldItem.quantity : 0;
  }

  getInventoryDescription() {
    if (this.inventory.length === 0) {
      return 'Your inventory is empty.';
    }

    const descriptions = this.inventory.map(item => {
      const qty = item.stackable ? ` (${item.quantity})` : '';
      return `${item.name}${qty}`;
    });

    const equipped = Object.entries(this.equippedItems)
      .filter(([_, item]) => item !== null)
      .map(([slot, item]) => `${item.name} equipped as ${slot}`);

    let desc = 'You are carrying: ' + descriptions.join(', ');
    if (equipped.length > 0) {
      desc += '. Equipped: ' + equipped.join(', ');
    }

    return desc;
  }

  getState() {
    return {
      inventory: this.inventory,
      equippedItems: this.equippedItems
    };
  }

  loadState(state) {
    if (state) {
      this.inventory = state.inventory || [];
      this.equippedItems = state.equippedItems || {
        weapon: null,
        armor: null,
        accessory: null
      };
    }
  }
}
