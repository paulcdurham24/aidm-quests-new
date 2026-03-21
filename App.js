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
  Animated
} from 'react-native';
import { GameEngine } from './src/engine/GameEngine';
import { AIService } from './src/services/AIService';
import { SpeechService } from './src/services/SpeechService';
import { OpenAITTSService } from './src/services/OpenAITTSService';
import { VoiceListener } from './src/services/VoiceListener';
import { AudioService } from './src/services/AudioService';
import { OPENAI_API_KEY, ELEVENLABS_API_KEY } from '@env';

// Pixel art assets
const LOGO = require('./src/assets/logo.png');
const DM_AVATAR = require('./src/assets/dm_avatar.png');
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
  const [gameEngine, setGameEngine] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [gameLog, setGameLog] = useState([]);
  const [playerStats, setPlayerStats] = useState(null);
  const [currentLocation, setCurrentLocation] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [speechDuration, setSpeechDuration] = useState(0);
  const [currentEnemy, setCurrentEnemy] = useState(null);
  const speechDurationRef = useRef(0);

  const aiServiceRef = useRef(null);
  const speechServiceRef = useRef(null);
  const voiceListenerRef = useRef(null);
  const audioServiceRef = useRef(null);
  const gameEngineRef = useRef(null);
  const scrollViewRef = useRef(null);

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
    };
  }, []);

  const initializeGame = async () => {
    try {
      const openAiKey = OPENAI_API_KEY;
      
      aiServiceRef.current = new AIService(openAiKey);
      
      // Using OpenAI TTS with "Fable" voice - British accent, expressive storyteller
      // Cost: $0.45 per playthrough vs $6.00 with ElevenLabs (92% savings!)
      speechServiceRef.current = new OpenAITTSService(openAiKey, 'fable');

      // Listen for speech start to sync typewriter with audio
      speechServiceRef.current.on('speechStart', ({ duration }) => {
        console.log(`[App] Speech started, duration: ${duration}s`);
        speechDurationRef.current = duration;
        setSpeechDuration(duration);
      });

      // Reset duration when speech ends so next message gets fresh timing
      speechServiceRef.current.on('speechEnd', () => {
        speechDurationRef.current = 0;
      });
      
      // Fallback to device TTS if needed:
      // speechServiceRef.current = new SpeechService();
      
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
      await audioServiceRef.current.setAmbientVolume(0.2); // Back to normal quiet level
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

  const addToLog = (speaker, message) => {
    setGameLog(prev => [...prev, { speaker, message, timestamp: Date.now() }]);
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
  const isLastEntry = (index) => index === gameLog.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      {/* Enemy portrait overlay during combat */}
      {currentEnemy && (
        <View style={styles.enemyOverlay}>
          <View style={styles.enemyPortraitContainer}>
            <Image 
              source={ENEMY_IMAGES[currentEnemy.id]} 
              style={styles.enemyPortrait} 
              resizeMode="contain"
            />
            <Text style={styles.enemyName}>{currentEnemy.name}</Text>
            <View style={styles.enemyHealthBar}>
              <Text style={styles.enemyHealthText}>❤️ {currentEnemy.health}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Header with pixel logo */}
      <View style={styles.header}>
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
              isPlayer(entry.speaker) && styles.chatRowPlayer
            ]}
          >
            {/* DM Avatar - left side */}
            {isDM(entry.speaker) && (
              <Image source={DM_AVATAR} style={styles.avatarDM} />
            )}

            {/* Message bubble */}
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
              <Text style={styles.micButtonText}>
                {isListening ? '🎙️ LISTENING...' : '🎤 SPEAK'}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  // ─── Enemy Portrait Overlay ───
  enemyOverlay: {
    position: 'absolute',
    top: 90,
    right: 10,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderWidth: 3,
    borderColor: '#e94560',
    padding: 8,
  },
  enemyPortraitContainer: {
    alignItems: 'center',
  },
  enemyPortrait: {
    width: 120,
    height: 120,
  },
  enemyName: {
    color: '#e94560',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 6,
    textAlign: 'center',
  },
  enemyHealthBar: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#0f3460',
    borderWidth: 2,
    borderColor: '#4466aa',
  },
  enemyHealthText: {
    color: '#f1f1f1',
    fontSize: 13,
    fontWeight: '600',
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
    marginBottom: 10,
  },
  micButtonActive: {
    backgroundColor: '#4ecca3',
    borderColor: '#7effc8',
  },
  micButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
