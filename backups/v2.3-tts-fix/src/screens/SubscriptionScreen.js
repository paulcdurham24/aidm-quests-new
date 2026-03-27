import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { TIERS } from '../services/SubscriptionManager';

const TIER_DETAILS = {
  [TIERS.FREE]: {
    name: 'Free',
    voiceLabel: 'Device Voice',
    voiceDesc: 'Standard text-to-speech using your device\'s built-in voice engine.',
    color: '#888',
    icon: '🗣️',
    features: [
      'Full game access',
      'All quests & encounters',
      'Device TTS voice',
      'All sound effects',
    ],
  },
  [TIERS.STANDARD]: {
    name: 'Standard',
    voiceLabel: 'OpenAI Voice',
    voiceDesc: 'Premium AI-generated voice with dramatic pacing and expressive narration.',
    color: '#4ecca3',
    icon: '🎭',
    features: [
      'Everything in Free',
      'OpenAI "Fable" DM voice',
      'Dramatic pacing & emphasis',
      'Cinematic narration',
    ],
  },
  [TIERS.ADVANCED]: {
    name: 'Advanced',
    voiceLabel: 'ElevenLabs Voice',
    voiceDesc: 'Ultra-premium Ancient Sage voice — the ultimate Dungeon Master experience.',
    color: '#e94560',
    icon: '🐉',
    features: [
      'Everything in Standard',
      'ElevenLabs "Ancient Sage" voice',
      'Most immersive DM experience',
      'Exclusive male DM character',
    ],
  },
};

export default function SubscriptionScreen({ subscriptionManager, onClose, onTierChanged }) {
  const [tierInfo, setTierInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingTier, setLoadingTier] = useState(null);

  useEffect(() => {
    if (subscriptionManager) {
      setTierInfo(subscriptionManager.getTierInfo());
    }
  }, [subscriptionManager]);

  const handleStartTrial = async () => {
    setLoading(true);
    try {
      const success = await subscriptionManager.startTrial();
      if (success) {
        setTierInfo(subscriptionManager.getTierInfo());
        if (onTierChanged) onTierChanged(subscriptionManager.getTier());
        Alert.alert('Trial Started!', 'Enjoy 3 days of Standard features for free! Your DM voice has been upgraded.');
      } else {
        Alert.alert('Trial Already Used', 'You have already used your free trial. Subscribe to continue with premium features.');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not start trial. Please try again.');
    }
    setLoading(false);
  };

  const handlePurchase = async (tier) => {
    setLoadingTier(tier);
    try {
      await subscriptionManager.purchaseSubscription(tier);
      // Purchase result comes through listener — wait a moment then refresh
      setTimeout(() => {
        setTierInfo(subscriptionManager.getTierInfo());
        if (onTierChanged) onTierChanged(subscriptionManager.getTier());
        setLoadingTier(null);
      }, 2000);
    } catch (error) {
      Alert.alert('Purchase Failed', error.message || 'Could not complete purchase. Please try again.');
      setLoadingTier(null);
    }
  };

  if (!tierInfo) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4ecca3" />
      </View>
    );
  }

  const currentTier = tierInfo.tier;
  const currentDetails = TIER_DETAILS[currentTier];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>DM Voice Settings</Text>
        <View style={styles.currentPlanBadge}>
          <Text style={[styles.currentPlanText, { color: currentDetails.color }]}>
            {currentDetails.icon} {currentDetails.name}
            {tierInfo.isTrial ? ` (Trial: ${tierInfo.trialDaysRemaining}d left)` : ''}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {/* Tier Cards */}
        {Object.entries(TIER_DETAILS).map(([tier, details]) => {
          const isCurrentTier = currentTier === tier;
          const isUpgrade = Object.keys(TIERS).indexOf(tier.toUpperCase()) >
                           Object.keys(TIERS).indexOf(currentTier.toUpperCase());
          const isDowngrade = Object.keys(TIERS).indexOf(tier.toUpperCase()) <
                             Object.keys(TIERS).indexOf(currentTier.toUpperCase());
          const price = subscriptionManager.getProductPrice(tier);

          return (
            <View
              key={tier}
              style={[
                styles.tierCard,
                isCurrentTier && styles.tierCardActive,
                { borderColor: details.color },
              ]}
            >
              {/* Tier Header */}
              <View style={styles.tierHeader}>
                <Text style={styles.tierIcon}>{details.icon}</Text>
                <View style={styles.tierHeaderText}>
                  <Text style={[styles.tierName, { color: details.color }]}>
                    {details.name}
                  </Text>
                  <Text style={styles.tierVoiceLabel}>{details.voiceLabel}</Text>
                </View>
                {isCurrentTier && (
                  <View style={[styles.activeBadge, { backgroundColor: details.color }]}>
                    <Text style={styles.activeBadgeText}>ACTIVE</Text>
                  </View>
                )}
              </View>

              {/* Voice Description */}
              <Text style={styles.tierDesc}>{details.voiceDesc}</Text>

              {/* Features */}
              <View style={styles.featuresList}>
                {details.features.map((feature, i) => (
                  <Text key={i} style={styles.featureItem}>✓ {feature}</Text>
                ))}
              </View>

              {/* Action Button */}
              {tier === TIERS.FREE && !isCurrentTier && (
                <Text style={styles.downgradeNote}>Cancel subscription to return to Free tier</Text>
              )}

              {tier === TIERS.FREE && !tierInfo.hasUsedTrial && currentTier === TIERS.FREE && (
                <TouchableOpacity
                  style={[styles.trialButton, loading && styles.buttonDisabled]}
                  onPress={handleStartTrial}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.trialButtonText}>🎁 Start 3-Day Free Trial (Standard)</Text>
                  )}
                </TouchableOpacity>
              )}

              {tier !== TIERS.FREE && isUpgrade && (
                <TouchableOpacity
                  style={[styles.upgradeButton, { backgroundColor: details.color }, loadingTier === tier && styles.buttonDisabled]}
                  onPress={() => handlePurchase(tier)}
                  disabled={loadingTier === tier}
                >
                  {loadingTier === tier ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.upgradeButtonText}>
                      Upgrade to {details.name} — {price}
                    </Text>
                  )}
                </TouchableOpacity>
              )}

              {tier !== TIERS.FREE && isCurrentTier && !tierInfo.isTrial && (
                <Text style={styles.activeNote}>Manage subscription in Google Play</Text>
              )}
            </View>
          );
        })}

        {/* Info Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Subscriptions are managed through Google Play. You can cancel anytime from your Google Play subscriptions settings.
          </Text>
          <Text style={styles.footerText}>
            Subscriptions auto-renew monthly unless cancelled at least 24 hours before the end of the current period.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#16213e',
    borderBottomWidth: 3,
    borderBottomColor: '#e94560',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  closeText: {
    color: '#f1f1f1',
    fontSize: 22,
    fontWeight: 'bold',
  },
  title: {
    color: '#f1f1f1',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  currentPlanBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: '#4466aa',
    backgroundColor: '#0f3460',
  },
  currentPlanText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 16,
    paddingBottom: 40,
  },
  // ─── Tier Card ───
  tierCard: {
    borderWidth: 3,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#0f3460',
  },
  tierCardActive: {
    backgroundColor: '#162d50',
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tierIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  tierHeaderText: {
    flex: 1,
  },
  tierName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  tierVoiceLabel: {
    color: '#aaa',
    fontSize: 13,
  },
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activeBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  tierDesc: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  featuresList: {
    marginBottom: 12,
  },
  featureItem: {
    color: '#4ecca3',
    fontSize: 13,
    marginBottom: 3,
  },
  // ─── Buttons ───
  trialButton: {
    backgroundColor: '#4ecca3',
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#7effc8',
  },
  trialButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  upgradeButton: {
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  activeNote: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  downgradeNote: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // ─── Footer ───
  footer: {
    marginTop: 10,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  footerText: {
    color: '#666',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 6,
    textAlign: 'center',
  },
});
