import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

const { width: screenWidth } = Dimensions.get('window');

// Ad unit ID for production
const BANNER_AD_UNIT_ID = 'ca-app-pub-8059609430105005/6857620870';

// Use test ads in development
const AD_UNIT_ID = __DEV__ ? TestIds.BANNER : BANNER_AD_UNIT_ID;

export const BannerAdComponent = ({ subscriptionTier, visible = true }) => {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(null);

  // Only show ads for Free tier
  const shouldShowAd = subscriptionTier === 'free' && visible;

  useEffect(() => {
    if (shouldShowAd) {
      console.log('[BannerAd] Showing ad for Free tier');
    } else {
      console.log('[BannerAd] Hiding ad for tier:', subscriptionTier);
    }
  }, [subscriptionTier, shouldShowAd]);

  if (!shouldShowAd) {
    return null;
  }

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={AD_UNIT_ID}
        size={BannerAdSize.BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
        onAdLoaded={() => {
          console.log('[BannerAd] Ad loaded successfully');
          setAdLoaded(true);
          setAdError(null);
        }}
        onAdFailedToLoad={(error) => {
          console.error('[BannerAd] Failed to load ad:', error);
          setAdError(error);
          setAdLoaded(false);
        }}
        onAdOpened={() => {
          console.log('[BannerAd] Ad opened');
        }}
        onAdClosed={() => {
          console.log('[BannerAd] Ad closed');
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
});

export default BannerAdComponent;
