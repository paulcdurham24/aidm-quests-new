import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  StatusBar,
  Text,
  TouchableOpacity,
} from 'react-native';
import Video from 'react-native-video';

const { width, height } = Dimensions.get('window');

const VideoSplashScreen = ({ onFinish }) => {
  const [videoEnded, setVideoEnded] = useState(false);
  const [showSkip, setShowSkip] = useState(false);

  useEffect(() => {
    // Show skip button after 2 seconds
    const skipTimer = setTimeout(() => {
      setShowSkip(true);
    }, 2000);

    return () => clearTimeout(skipTimer);
  }, []);

  const handleVideoEnd = () => {
    setVideoEnded(true);
    setTimeout(() => {
      onFinish();
    }, 500);
  };

  const handleSkip = () => {
    onFinish();
  };

  const handleVideoError = (error) => {
    console.log('Video error:', error);
    // Show fallback for 2 seconds then finish
    setTimeout(() => {
      onFinish();
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* Video Player */}
      <Video
        source={require('../assets/videos/splash_video.mp4')} // We'll add this video file
        style={styles.video}
        resizeMode="cover"
        repeat={false}
        onEnd={handleVideoEnd}
        onError={handleVideoError}
        muted={false}
        volume={0.8}
        playInBackground={false}
        playWhenInactive={false}
      />

      {/* Skip Button */}
      {showSkip && !videoEnded && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Fallback Loading Text */}
      <View style={styles.fallbackContainer}>
        <Text style={styles.loadingText}>AIDM QUESTS</Text>
        <Text style={styles.subText}>Loading...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: width,
    height: height,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 10,
  },
  skipText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fallbackContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subText: {
    color: '#cccccc',
    fontSize: 18,
    marginTop: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default VideoSplashScreen;
