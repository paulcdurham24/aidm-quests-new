import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  AccessibilityInfo,
  Platform,
  Image,
  Animated,
  Modal,
} from 'react-native';
import { GameEngine } from './src/engine/GameEngine';
import { AIService } from './src/services/AIService';
import { SpeechService } from './src/services/SpeechService';
import { OpenAITTSService } from './src/services/OpenAITTSService';
import { VoiceListener } from './src/services/VoiceListener';
import { AudioService } from './src/services/AudioService';
import { ElevenLabsService } from './src/services/ElevenLabsService';
import { SubscriptionManager, TIERS } from './src/services/SubscriptionManager';
import SubscriptionScreen from './src/screens/SubscriptionScreen';
import BannerAdComponent from './src/components/BannerAd';
import VideoSplashScreen from './src/components/VideoSplashScreen';
import { OPENAI_API_KEY, ELEVENLABS_API_KEY } from '@env';

// Pixel art assets
const LOGO = require('./src/assets/logo.png');
const DM_AVATAR_FREE = require('./src/assets/dm_avatar.png');
const DM_AVATAR_PREMIUM = require('./src/assets/dm_avatar_male.png');
const PLAYER_AVATAR = require('./src/assets/player_avatar.png');

// Enemy pixel art
const ENEMY_IMAGES = {
  goblin: require('./src/assets/goblin.png'),
  wolf: require('./src/assets/evil_wolf.png'),
  skeleton: require('./src/assets/skeleton.png'),
  troll: require('./src/assets/troll.png'),
  wraith: require('./src/assets/wraith.png'),
  dragon: require('./src/assets/dragon.png'),
  zombie: require('./src/assets/zombie.png')
};

// Typewriter text component for DM messages - syncs with TTS audio duration
const TypewriterText = ({ text, style, onComplete, audioDuration }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const startedRef = useRef(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!text) return;
    // Reset when text changes
    startedRef.current = false;
    setDisplayedText('');
    setIsComplete(false);
    if (intervalRef.current) clearInterval(intervalRef.current);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text]);

  useEffect(() => {
    // Only start once per text, and only when we have a valid duration
    if (!text || startedRef.current) return;
    if (!audioDuration || audioDuration <= 0) return;

    startedRef.current = true;
    const totalChars = text.length;
    // Spread text across 95% of audio duration
    const msPerChar = Math.max(10, Math.floor((audioDuration * 950) / totalChars));

    let index = 0;
    intervalRef.current = setInterval(() => {
      index++;
      setDisplayedText(text.slice(0, index));
      if (index >= totalChars) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setIsComplete(true);
        if (onComplete) onComplete();
      }
    }, msPerChar);
  }, [text, audioDuration]);

  // Fallback: if no duration arrives after 3s, start with default speed
  useEffect(() => {
    if (!text) return;
    const fallbackTimer = setTimeout(() => {
      if (!startedRef.current && text) {
        startedRef.current = true;
        const totalChars = text.length;
        const msPerChar = 30; // default fallback
        let index = 0;
        intervalRef.current = setInterval(() => {
          index++;
          setDisplayedText(text.slice(0, index));
          if (index >= totalChars) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            setIsComplete(true);
            if (onComplete) onComplete();
          }
        }, msPerChar);
      }
    }, 3000);
    return () => clearTimeout(fallbackTimer);
  }, [text]);

  return (
    <Text style={style} accessible={true}>
      {displayedText}
      {!isComplete && <Text style={{ color: '#4ecca3' }}>|</Text>}
    </Text>
  );
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [gameEngine, setGameEngine] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [gameLog, setGameLog] = useState([]);
  const [playerStats, setPlayerStats] = useState(null);
  const [currentLocation, setCurrentLocation] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [speechDuration, setSpeechDuration] = useState(0);
  const [currentEnemy, setCurrentEnemy] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [currentTier, setCurrentTier] = useState(TIERS.FREE);
  const speechDurationRef = useRef(0);

  const aiServiceRef = useRef(null);
  const speechServiceRef = useRef(null);
  const voiceListenerRef = useRef(null);
  const audioServiceRef = useRef(null);
  const gameEngineRef = useRef(null);
  const scrollViewRef = useRef(null);
  const subscriptionManagerRef = useRef(null);

  useEffect(() => {
    initializeGame();
    
    AccessibilityInfo.announceForAccessibility(
      'Welcome to AIDM Quests. A voice-controlled fantasy adventure.'
    );

    return () => {
      if (voiceListenerRef.current) {
        voiceListenerRef.current.destroyListening();
      }
      if (audioServiceRef.current) {
        audioServiceRef.current.unloadAll();
      }
      if (subscriptionManagerRef.current) {
        subscriptionManagerRef.current.destroy();
      }
    };
  }, []);

  // Create the right TTS service based on subscription tier
  const createSpeechService = (tier) => {
    const openAiKey = OPENAI_API_KEY;

    let service;
    if (tier === TIERS.ADVANCED && ELEVENLABS_API_KEY) {
      // ElevenLabs "Ancient Sage Dragon Wizard" voice
      service = new ElevenLabsService(ELEVENLABS_API_KEY, 'HAvvFKatz0uu0Fv55Riy');
      console.log('[App] TTS: ElevenLabs Ancient Sage (Advanced tier)');
    } else if (tier === TIERS.STANDARD || tier === TIERS.ADVANCED) {
      // OpenAI TTS with "Fable" voice — dramatic British DM
      service = new OpenAITTSService(openAiKey, 'fable');
      console.log('[App] TTS: OpenAI Fable (Standard tier)');
    } else {
      // Free tier — device built-in TTS
      service = new SpeechService();
      console.log('[App] TTS: Device TTS (Free tier)');
    }

    // Hook up speech events for typewriter sync (if the service supports them)
    if (service.on) {
      service.on('speechStart', ({ duration }) => {
        console.log(`[App] Speech started, duration: ${duration}s`);
        speechDurationRef.current = duration;
        setSpeechDuration(duration);
      });
      service.on('speechEnd', () => {
        speechDurationRef.current = 0;
      });
    }

    return service;
  };

  // Switch TTS provider live when user changes tier
  const handleTierChanged = (newTier) => {
    console.log('[App] Tier changed to:', newTier);
    setCurrentTier(newTier);

    // Stop any current speech
    if (speechServiceRef.current && speechServiceRef.current.stop) {
      speechServiceRef.current.stop();
    }

    // Create new speech service for new tier
    const newSpeechService = createSpeechService(newTier);
    speechServiceRef.current = newSpeechService;

    // Update the engine's reference to the speech service
    if (gameEngineRef.current) {
      gameEngineRef.current.speechService = newSpeechService;
    }
  };

  const initializeGame = async () => {
    try {
      const openAiKey = OPENAI_API_KEY;

      // Initialize subscription manager first to determine tier
      const subManager = new SubscriptionManager();
      subscriptionManagerRef.current = subManager;
      await subManager.initialize();
      const tier = subManager.getTier();
      setCurrentTier(tier);
      console.log('[App] Subscription tier:', tier);

      // Listen for tier changes (e.g. from purchase listener)
      subManager.on('tierChanged', ({ tier: newTier }) => {
        handleTierChanged(newTier);
      });
      
      aiServiceRef.current = new AIService(openAiKey);
      
      // Create TTS service based on subscription tier
      speechServiceRef.current = createSpeechService(tier);
      
      voiceListenerRef.current = new VoiceListener();
      audioServiceRef.current = new AudioService();

      await audioServiceRef.current.initialize();
      audioServiceRef.current.setElevenLabsKey(ELEVENLABS_API_KEY);

      const engine = new GameEngine(
        aiServiceRef.current,
        speechServiceRef.current,
        audioServiceRef.current
      );

      setupVoiceListeners();
      setupGameListeners(engine);

      gameEngineRef.current = engine;
      setGameEngine(engine);
      
      // Enable auto-save every 5 minutes
      engine.memoryEngine.startAutoSave(engine, 5);
      console.log('[App] Auto-save enabled (every 5 minutes)');
      
      setIsInitialized(true);

      // Auto-start DM welcome - no button press needed
      await engine.startNewGame();
      updateGameState(engine);
      
      AccessibilityInfo.announceForAccessibility(
        'Dungeon Master is speaking. Listen for instructions.'
      );
    } catch (error) {
      console.error('Error initializing game:', error);
      Alert.alert('Initialization Error', 'Failed to initialize game. Please restart.');
    }
  };

  const setupVoiceListeners = () => {
    const voiceListener = voiceListenerRef.current;

    voiceListener.on('listeningStarted', () => {
      setIsListening(true);
      AccessibilityInfo.announceForAccessibility('Listening');
    });

    voiceListener.on('listeningStopped', () => {
      setIsListening(false);
    });

    voiceListener.on('results', async ({ text }) => {
      console.log('[App] Voice results received:', text);
      setIsListening(false);
      addToLog('You', text);
      console.log('[App] Calling processVoiceCommand with:', text);
      await processVoiceCommand(text);
    });

    voiceListener.on('error', ({ error }) => {
      setIsListening(false);
      console.error('Voice error:', error);
      AccessibilityInfo.announceForAccessibility('Voice recognition error. Please try again.');
    });
  };

  const setupGameListeners = (engine) => {
    // Narration event fires just BEFORE TTS starts — this is the sync point
    // so the typewriter animation runs in parallel with audio playback
    engine.on('narration', ({ message }) => {
      // Reset duration so TypewriterText waits for fresh timing from speechStart
      setSpeechDuration(0);
      speechDurationRef.current = 0;
      addToLog('Dungeon Master', message);
    });

    engine.on('gameStarted', () => {
      // Text already added via narration events from speak() calls
      // Just update state
      updateGameState(engine);
    });

    engine.on('gameLoaded', () => {
      // Text already added via speak() -> narration events
      updateGameState(engine);
    });

    engine.on('combatStarted', ({ enemy }) => {
      console.log('[App] Combat started with:', enemy.name);
      setCurrentEnemy(enemy);
      addToLog('Enemy', null, enemy);
    });

    engine.on('enemyUpdate', ({ enemy, message }) => {
      console.log('[App] Enemy update:', enemy.name, 'hp:', enemy.health);
      setCurrentEnemy({ ...enemy });
      if (message) {
        addToLog('Enemy', message, enemy);
      }
    });

    engine.on('combatEnded', ({ victory }) => {
      console.log('[App] Combat ended, victory:', victory);
      setCurrentEnemy(null);
    });

    engine.on('awaitingVoiceInput', async () => {
      // Guard: wait until TTS is confirmed done before enabling mic
      // This prevents the mic from capturing the DM's own voice
      if (speechServiceRef.current && speechServiceRef.current.getIsSpeaking()) {
        console.log('[App] TTS still speaking, waiting...');
        // Poll until speech ends
        while (speechServiceRef.current.getIsSpeaking()) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      // Extra buffer to avoid capturing echo/reverb from speaker
      await new Promise(resolve => setTimeout(resolve, 1000));
      await handleMicrophonePress();
    });
  };

  const processVoiceCommand = async (text) => {
    console.log('[App] processVoiceCommand called, engine:', !!gameEngineRef.current, 'isProcessing:', isProcessing);
    
    // Restore ambient volume after voice input
    if (audioServiceRef.current) {
      await audioServiceRef.current.setAmbientVolume(0.025); // Back to normal quiet level
    }
    
    if (!gameEngineRef.current || isProcessing) {
      return;
    }

    setIsProcessing(true);

    try {
      console.log('[App] Processing command:', text);
      const result = await gameEngineRef.current.processCommand(text);
      
      // DM text is already added to log via 'narration' events from speak()
      // Just update game state here
      if (result.success) {
        updateGameState(gameEngineRef.current);
      }
    } catch (error) {
      console.error('Error processing command:', error);
      addToLog('System', 'An error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const updateGameState = (engine) => {
    const state = engine.getState();
    setPlayerStats(state.gameState.player);
    setCurrentLocation(state.gameState.world.currentLocation);
    
    // Update enemy health during combat if still in combat
    if (state.inCombat && state.currentEnemy) {
      setCurrentEnemy(state.currentEnemy);
    }
  };

  const addToLog = (speaker, message, enemyData = null) => {
    setGameLog(prev => [...prev, { speaker, message, timestamp: Date.now(), enemyData: enemyData ? { ...enemyData } : null }]);
    // Auto-scroll to bottom after new message
    setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  };

  const handleMicrophonePress = async () => {
    if (!voiceListenerRef.current) return;

    if (isListening) {
      await voiceListenerRef.current.stopListening();
    } else {
      const available = await voiceListenerRef.current.isAvailable();
      
      if (!available) {
        Alert.alert(
          'Voice Recognition Unavailable',
          'Voice recognition is not available on this device.'
        );
        return;
      }

      // Lower ambient volume when listening to prevent interference
      if (audioServiceRef.current) {
        await audioServiceRef.current.setAmbientVolume(0.05);
      }

      await voiceListenerRef.current.startListening();
    }
  };

  const handleStartGame = async () => {
    if (!gameEngine) return;

    await gameEngine.startNewGame();
    updateGameState(gameEngine);
  };

  const handleContinueGame = async () => {
    if (!gameEngine) return;

    await gameEngine.continueGame();
    updateGameState(gameEngine);
  };

  const handleQuickCommand = async (command) => {
    if (!gameEngineRef.current || isProcessing) return;

    addToLog('You', command);
    await processVoiceCommand(command);
  };

  const isDM = (speaker) => speaker === 'Dungeon Master';
  const isPlayer = (speaker) => speaker === 'You';
  const isEnemy = (speaker) => speaker === 'Enemy';
  const isLastEntry = (index) => index === gameLog.length - 1;

  // DM avatar changes based on subscription tier
  const dmAvatar = (currentTier === TIERS.ADVANCED) ? DM_AVATAR_PREMIUM : DM_AVATAR_FREE;

  // Show splash screen first
  if (showSplash) {
    return (
      <VideoSplashScreen 
        onFinish={() => setShowSplash(false)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with pixel logo */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setShowSettings(true)}
          accessible={true}
          accessibilityLabel="Settings"
          accessibilityRole="button"
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
        <Image source={LOGO} style={styles.logoImage} resizeMode="contain" />
        {playerStats && (
          <View style={styles.statsBar} accessible={true} accessibilityLabel={`Health ${playerStats.health} out of ${playerStats.maxHealth}, Level ${playerStats.level}`}>
            <Text style={styles.statText}>❤️ {playerStats.health}/{playerStats.maxHealth}</Text>
            <Text style={styles.statText}>⚔️ Lvl {playerStats.level}</Text>
            <Text style={styles.statText}>📍 {currentLocation}</Text>
          </View>
        )}
      </View>

      {/* Chat log with pixel-style bubbles */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.logContainer}
        contentContainerStyle={styles.logContent}
        accessible={true}
        accessibilityLabel="Game log"
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {gameLog.map((entry, index) => (
          <View
            key={index}
            style={[
              styles.chatRow,
              isPlayer(entry.speaker) && styles.chatRowPlayer,
              isEnemy(entry.speaker) && styles.chatRowEnemy
            ]}
          >
            {/* DM Avatar - left side */}
            {isDM(entry.speaker) && (
              <Image source={dmAvatar} style={styles.avatarDM} />
            )}

            {/* Enemy bubble */}
            {isEnemy(entry.speaker) && entry.enemyData ? (
              <View style={styles.bubbleOuterEnemy}>
                <View style={styles.bubbleInnerEnemy}>
                  <View style={styles.enemyBubbleHeader}>
                    <Text style={styles.enemySpeakerName}>{entry.enemyData.name}:</Text>
                    <View style={styles.enemyBubbleStats}>
                      <Text style={styles.enemyBubbleHp}>❤️ {entry.enemyData.health}</Text>
                      <Text style={styles.enemyBubbleSwords}>⚔️</Text>
                    </View>
                  </View>
                  <Text style={styles.logMessage}>
                    {entry.message || entry.enemyData.sounds?.appear || 'Growls....'}
                  </Text>
                </View>
              </View>
            ) : !isEnemy(entry.speaker) ? (
              /* DM / Player bubble */
              <View
                style={[
                  styles.bubbleOuter,
                  isDM(entry.speaker) && styles.bubbleOuterDM,
                  isPlayer(entry.speaker) && styles.bubbleOuterPlayer
                ]}
              >
                <View
                  style={[
                    styles.bubbleInner,
                    isDM(entry.speaker) && styles.bubbleInnerDM,
                    isPlayer(entry.speaker) && styles.bubbleInnerPlayer
                  ]}
                >
                  <Text
                    style={[
                      styles.logSpeaker,
                      isPlayer(entry.speaker) && styles.logPlayerSpeaker
                    ]}
                  >
                    {entry.speaker}:
                  </Text>
                  {isDM(entry.speaker) && isLastEntry(index) ? (
                    <TypewriterText
                      text={entry.message}
                      style={styles.logMessage}
                      audioDuration={speechDuration}
                      onComplete={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                    />
                  ) : (
                    <Text
                      style={styles.logMessage}
                      accessible={true}
                      accessibilityLabel={`${entry.speaker} says: ${entry.message}`}
                    >
                      {entry.message}
                    </Text>
                  )}
                </View>
              </View>
            ) : null}

            {/* Enemy Avatar - right side */}
            {isEnemy(entry.speaker) && entry.enemyData && ENEMY_IMAGES[entry.enemyData.id] && (
              <Image source={ENEMY_IMAGES[entry.enemyData.id]} style={styles.avatarEnemy} />
            )}

            {/* Player Avatar - right side */}
            {isPlayer(entry.speaker) && (
              <Image source={PLAYER_AVATAR} style={styles.avatarPlayer} />
            )}
          </View>
        ))}
      </ScrollView>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        {!isInitialized ? (
          <Text style={styles.loadingText}>Initializing game...</Text>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.micButton, isListening && styles.micButtonActive]}
              onPress={handleMicrophonePress}
              accessible={true}
              accessibilityLabel={isListening ? 'Stop listening' : 'Start voice command'}
              accessibilityRole="button"
              accessibilityHint="Tap to speak your command"
            >
              <Text style={styles.micEmoji}>
                {isListening ? '🎙️' : '🎤'}
              </Text>
              <Text style={styles.micButtonText}>
                {isListening ? 'LISTENING...' : 'SPEAK'}
              </Text>
            </TouchableOpacity>

            <View style={styles.quickCommandsContainer}>
              <TouchableOpacity
                style={styles.quickCommandButton}
                onPress={() => handleQuickCommand('explore')}
                accessible={true}
                accessibilityLabel="Explore"
                accessibilityRole="button"
              >
                <Text style={styles.quickCommandText}>Explore</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickCommandButton}
                onPress={() => handleQuickCommand('inventory')}
                accessible={true}
                accessibilityLabel="Check inventory"
                accessibilityRole="button"
              >
                <Text style={styles.quickCommandText}>Inventory</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickCommandButton}
                onPress={() => handleQuickCommand('status')}
                accessible={true}
                accessibilityLabel="Check status"
                accessibilityRole="button"
              >
                <Text style={styles.quickCommandText}>Status</Text>
              </TouchableOpacity>
            </View>

            {gameEngine && !gameEngine.gameState?.gameStarted && (
              <View style={styles.startButtonsContainer}>
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={handleStartGame}
                  accessible={true}
                  accessibilityLabel="Start new game"
                  accessibilityRole="button"
                >
                  <Text style={styles.startButtonText}>New Game</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.startButton}
                  onPress={handleContinueGame}
                  accessible={true}
                  accessibilityLabel="Continue saved game"
                  accessibilityRole="button"
                >
                  <Text style={styles.startButtonText}>Continue</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
      {/* Subscription Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        onRequestClose={() => setShowSettings(false)}
      >
        <SubscriptionScreen
          subscriptionManager={subscriptionManagerRef.current}
          onClose={() => setShowSettings(false)}
          onTierChanged={handleTierChanged}
        />
      </Modal>
      
      {/* Banner Ad - only shows for Free tier */}
      <BannerAdComponent 
        subscriptionTier={currentTier.toLowerCase()} 
        visible={!showSettings}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  // ─── Enemy Chat Bubble ───
  chatRowEnemy: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingLeft: 0,
    paddingRight: 10,
  },
  bubbleOuterEnemy: {
    flex: 1,
    borderWidth: 3,
    borderColor: '#4ecca3',
    padding: 3,
  },
  bubbleInnerEnemy: {
    backgroundColor: '#0f3460',
    padding: 10,
  },
  enemyBubbleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  enemySpeakerName: {
    color: '#4ecca3',
    fontSize: 13,
    fontWeight: 'bold',
  },
  enemyBubbleStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  enemyBubbleHp: {
    color: '#e94560',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 6,
  },
  enemyBubbleSwords: {
    fontSize: 16,
  },
  avatarEnemy: {
    width: 52,
    height: 52,
    marginLeft: 6,
    marginTop: 2,
  },
  // ─── Header ───
  header: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 16,
    backgroundColor: '#16213e',
    borderBottomWidth: 3,
    borderBottomColor: '#e94560',
    alignItems: 'center',
  },
  settingsButton: {
    position: 'absolute',
    top: 8,
    right: 12,
    zIndex: 10,
    padding: 6,
  },
  settingsIcon: {
    fontSize: 22,
  },
  logoImage: {
    width: 180,
    height: 60,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 4,
  },
  statText: {
    color: '#f1f1f1',
    fontSize: 13,
    fontWeight: '600',
  },
  // ─── Chat Log ───
  logContainer: {
    flex: 1,
  },
  logContent: {
    padding: 10,
    paddingBottom: 20,
  },
  // ─── Chat Row ───
  chatRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    paddingRight: 50, // space so DM bubbles don't stretch full width
  },
  chatRowPlayer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingRight: 0,
    paddingLeft: 50, // space so player bubbles don't stretch full width
  },
  // ─── Avatars ───
  avatarDM: {
    width: 44,
    height: 44,
    marginRight: 6,
    marginTop: 2,
  },
  avatarPlayer: {
    width: 52,
    height: 52,
    marginLeft: 6,
    marginTop: 2,
  },
  // ─── Pixel-style Bubble (outer border) ───
  bubbleOuter: {
    flex: 1,
    borderWidth: 3,
    borderColor: '#ffffff',
    padding: 3,
  },
  bubbleOuterDM: {
    borderColor: '#4466aa',
  },
  bubbleOuterPlayer: {
    borderColor: '#e94560',
  },
  // ─── Bubble inner ───
  bubbleInner: {
    backgroundColor: '#0f3460',
    padding: 10,
  },
  bubbleInnerDM: {
    backgroundColor: '#0f3460',
  },
  bubbleInnerPlayer: {
    backgroundColor: '#1a2744',
  },
  // ─── Text ───
  logSpeaker: {
    color: '#e94560',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  logPlayerSpeaker: {
    color: '#4ecca3',
  },
  logMessage: {
    color: '#f1f1f1',
    fontSize: 15,
    lineHeight: 22,
  },
  // ─── Controls ───
  controlsContainer: {
    padding: 12,
    paddingBottom: 16,
    backgroundColor: '#16213e',
    borderTopWidth: 3,
    borderTopColor: '#e94560',
  },
  micButton: {
    backgroundColor: '#e94560',
    padding: 18,
    borderRadius: 0, // pixel-style square edges
    borderWidth: 3,
    borderColor: '#ff6b81',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 10,
  },
  micButtonActive: {
    backgroundColor: '#4ecca3',
    borderColor: '#7effc8',
  },
  micEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  micButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  quickCommandsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  quickCommandButton: {
    flex: 1,
    backgroundColor: '#0f3460',
    padding: 11,
    borderRadius: 0, // pixel-style
    borderWidth: 2,
    borderColor: '#4466aa',
    marginHorizontal: 3,
    alignItems: 'center',
  },
  quickCommandText: {
    color: '#f1f1f1',
    fontSize: 13,
    fontWeight: '600',
  },
  startButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  startButton: {
    flex: 1,
    backgroundColor: '#e94560',
    padding: 14,
    borderRadius: 0, // pixel-style
    borderWidth: 3,
    borderColor: '#ff6b81',
    marginHorizontal: 3,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  loadingText: {
    color: '#f1f1f1',
    fontSize: 16,
    textAlign: 'center',
  },
});
