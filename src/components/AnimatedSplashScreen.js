import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  Animated,
  Image,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const AnimatedSplashScreen = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;
  const textSlideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Start animations sequence - exactly 7 seconds total
    const animationSequence = Animated.sequence([
      // Logo fade in and scale up (1.2 seconds)
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 30,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      // Logo rotation (1.5 seconds)
      Animated.timing(logoRotateAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      // Text slide up (800ms)
      Animated.timing(textSlideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      // Hold for display (2.7 seconds)
      Animated.delay(2700),
      // Fade out (800ms)
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]);

    animationSequence.start(() => {
      onFinish();
    });

    // Auto-finish after exactly 7 seconds as fallback
    const fallbackTimer = setTimeout(() => {
      onFinish();
    }, 7000);

    return () => {
      clearTimeout(fallbackTimer);
      animationSequence.stop();
    };
  }, [fadeAnim, scaleAnim, logoRotateAnim, textSlideAnim, onFinish]);

  const logoRotation = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* Animated Background Gradient Effect */}
      <View style={styles.backgroundGradient} />
      
      <Animated.View 
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo with rotation animation */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ rotate: logoRotation }],
            },
          ]}
        >
          <Image 
            source={require('../assets/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Animated text */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              transform: [{ translateY: textSlideAnim }],
            },
          ]}
        >
          <Text style={styles.titleText}>AIDM QUESTS</Text>
          <Text style={styles.subtitleText}>AI Dungeon Master</Text>
          <View style={styles.loadingDots}>
            <Text style={styles.dotsText}>●●●</Text>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1a1a2e',
    opacity: 0.9,
  },
  contentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: width * 0.8,
  },
  logoContainer: {
    marginBottom: 40,
    shadowColor: '#4a9eff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 20,
  },
  logo: {
    width: 120,
    height: 120,
    tintColor: '#4a9eff',
  },
  textContainer: {
    alignItems: 'center',
  },
  titleText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 3,
    textShadowColor: '#4a9eff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitleText: {
    fontSize: 18,
    color: '#cccccc',
    textAlign: 'center',
    marginTop: 10,
    letterSpacing: 1,
  },
  loadingDots: {
    marginTop: 30,
  },
  dotsText: {
    fontSize: 24,
    color: '#4a9eff',
    letterSpacing: 5,
  },
});

export default AnimatedSplashScreen;
