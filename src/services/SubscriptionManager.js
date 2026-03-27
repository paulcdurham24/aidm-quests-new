import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initConnection,
  getSubscriptions,
  requestSubscription,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
  getAvailablePurchases,
  endConnection,
} from 'react-native-iap';

// Google Play product IDs — must match what you set up in Play Console
const PRODUCT_IDS = {
  STANDARD: 'aidm_standard_monthly',
  ADVANCED: 'aidm_advanced_monthly',
};

const STORAGE_KEY = '@aidm_subscription';
const TRIAL_KEY = '@aidm_trial';

export const TIERS = {
  FREE: 'free',
  STANDARD: 'standard',
  ADVANCED: 'advanced',
};

export class SubscriptionManager {
  constructor() {
    this.currentTier = TIERS.FREE;
    this.trialActive = false;
    this.trialExpiry = null;
    this.purchaseUpdateSubscription = null;
    this.purchaseErrorSubscription = null;
    this.availableProducts = [];
    this.initialized = false;
    this.eventListeners = {};
  }

  // ─── Event System ───
  on(event, callback) {
    if (!this.eventListeners[event]) this.eventListeners[event] = [];
    this.eventListeners[event].push(callback);
  }

  emit(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(cb => cb(data));
    }
  }

  // ─── Initialize ───
  async initialize() {
    try {
      // Load persisted state first
      await this.loadState();

      // Check if trial is still active
      this.checkTrialStatus();

      // Connect to Google Play Billing
      await initConnection();
      console.log('[SubscriptionManager] Connected to Play Billing');

      // Fetch available subscription products
      try {
        this.availableProducts = await getSubscriptions(
          [PRODUCT_IDS.STANDARD, PRODUCT_IDS.ADVANCED]
        );
        console.log('[SubscriptionManager] Products loaded:', this.availableProducts.length);
      } catch (prodErr) {
        console.warn('[SubscriptionManager] Could not load products (not configured in Play Console yet?):', prodErr.message);
        this.availableProducts = [];
      }

      // Listen for purchase updates
      this.purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase) => {
        console.log('[SubscriptionManager] Purchase update:', purchase.productId);
        await this.handlePurchase(purchase);
      });

      this.purchaseErrorSubscription = purchaseErrorListener((error) => {
        console.warn('[SubscriptionManager] Purchase error:', error);
        this.emit('purchaseError', error);
      });

      // Validate existing purchases
      await this.validateExistingPurchases();

      this.initialized = true;
      console.log('[SubscriptionManager] Initialized. Tier:', this.currentTier);
      return true;
    } catch (error) {
      console.error('[SubscriptionManager] Init error:', error);
      // Still functional in offline/free mode
      this.initialized = true;
      return false;
    }
  }

  // ─── Trial System ───
  async startTrial() {
    if (this.trialExpiry) {
      // Trial already used
      console.log('[SubscriptionManager] Trial already used');
      return false;
    }

    const now = Date.now();
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    this.trialExpiry = now + threeDays;
    this.trialActive = true;
    this.currentTier = TIERS.STANDARD;

    await this.saveTrialState();
    await this.saveState();

    this.emit('tierChanged', { tier: this.currentTier, isTrial: true });
    console.log('[SubscriptionManager] Trial started, expires:', new Date(this.trialExpiry).toISOString());
    return true;
  }

  checkTrialStatus() {
    if (!this.trialExpiry) {
      this.trialActive = false;
      return;
    }

    if (Date.now() < this.trialExpiry) {
      this.trialActive = true;
      // Only set to standard if not already on a paid tier
      if (this.currentTier === TIERS.FREE) {
        this.currentTier = TIERS.STANDARD;
      }
    } else {
      this.trialActive = false;
      // Trial expired — revert to free unless they have a paid subscription
      if (this.currentTier === TIERS.STANDARD) {
        // Will be overridden by validateExistingPurchases if they have a real sub
        this.currentTier = TIERS.FREE;
      }
    }
  }

  getTrialDaysRemaining() {
    if (!this.trialExpiry || !this.trialActive) return 0;
    const remaining = this.trialExpiry - Date.now();
    return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
  }

  hasUsedTrial() {
    return this.trialExpiry !== null;
  }

  // ─── Purchase Handling ───
  async purchaseSubscription(tier) {
    try {
      const productId = tier === TIERS.ADVANCED ? PRODUCT_IDS.ADVANCED : PRODUCT_IDS.STANDARD;

      const product = this.availableProducts.find(p => p.productId === productId);
      if (!product) {
        throw new Error(`Product ${productId} not found. Configure it in Play Console first.`);
      }

      await requestSubscription(productId);

      // Purchase result comes through the purchaseUpdatedListener
    } catch (error) {
      console.error('[SubscriptionManager] Purchase failed:', error);
      this.emit('purchaseError', error);
      throw error;
    }
  }

  async handlePurchase(purchase) {
    try {
      // Acknowledge the purchase
      await finishTransaction(purchase, false);

      // Determine tier from product
      if (purchase.productId === PRODUCT_IDS.ADVANCED) {
        this.currentTier = TIERS.ADVANCED;
      } else if (purchase.productId === PRODUCT_IDS.STANDARD) {
        this.currentTier = TIERS.STANDARD;
      }

      this.trialActive = false; // No longer on trial
      await this.saveState();

      this.emit('tierChanged', { tier: this.currentTier, isTrial: false });
      console.log('[SubscriptionManager] Purchase completed. Tier:', this.currentTier);
    } catch (error) {
      console.error('[SubscriptionManager] Error acknowledging purchase:', error);
    }
  }

  async validateExistingPurchases() {
    try {
      const purchases = await getAvailablePurchases();
      console.log('[SubscriptionManager] Existing purchases:', purchases.length);

      for (const purchase of purchases) {
        if (purchase.productId === PRODUCT_IDS.ADVANCED) {
          this.currentTier = TIERS.ADVANCED;
          this.trialActive = false;
          break;
        }
        if (purchase.productId === PRODUCT_IDS.STANDARD) {
          this.currentTier = TIERS.STANDARD;
          this.trialActive = false;
        }
      }

      await this.saveState();
    } catch (error) {
      console.warn('[SubscriptionManager] Could not validate purchases:', error.message);
    }
  }

  // ─── State Persistence ───
  async saveState() {
    try {
      const state = {
        currentTier: this.currentTier,
        trialActive: this.trialActive,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('[SubscriptionManager] Error saving state:', error);
    }
  }

  async loadState() {
    try {
      const stateStr = await AsyncStorage.getItem(STORAGE_KEY);
      if (stateStr) {
        const state = JSON.parse(stateStr);
        this.currentTier = state.currentTier || TIERS.FREE;
        this.trialActive = state.trialActive || false;
      }

      const trialStr = await AsyncStorage.getItem(TRIAL_KEY);
      if (trialStr) {
        const trial = JSON.parse(trialStr);
        this.trialExpiry = trial.expiry || null;
      }
    } catch (error) {
      console.error('[SubscriptionManager] Error loading state:', error);
    }
  }

  async saveTrialState() {
    try {
      await AsyncStorage.setItem(TRIAL_KEY, JSON.stringify({
        expiry: this.trialExpiry,
      }));
    } catch (error) {
      console.error('[SubscriptionManager] Error saving trial state:', error);
    }
  }

  // ─── Getters ───
  getTier() {
    return this.currentTier;
  }

  isStandard() {
    return this.currentTier === TIERS.STANDARD || this.currentTier === TIERS.ADVANCED;
  }

  isAdvanced() {
    return this.currentTier === TIERS.ADVANCED;
  }

  isFree() {
    return this.currentTier === TIERS.FREE;
  }

  isTrial() {
    return this.trialActive;
  }

  getProducts() {
    return this.availableProducts;
  }

  getProductPrice(tier) {
    const productId = tier === TIERS.ADVANCED ? PRODUCT_IDS.ADVANCED : PRODUCT_IDS.STANDARD;
    const product = this.availableProducts.find(p => p.productId === productId);
    if (product?.localizedPrice) {
      return product.localizedPrice;
    }
    return tier === TIERS.ADVANCED ? '£7.99/mo' : '£2.99/mo';
  }

  getTierInfo() {
    return {
      tier: this.currentTier,
      isTrial: this.trialActive,
      trialDaysRemaining: this.getTrialDaysRemaining(),
      hasUsedTrial: this.hasUsedTrial(),
    };
  }

  // ─── Cleanup ───
  async destroy() {
    if (this.purchaseUpdateSubscription) {
      this.purchaseUpdateSubscription.remove();
    }
    if (this.purchaseErrorSubscription) {
      this.purchaseErrorSubscription.remove();
    }
    await endConnection();
  }
}
