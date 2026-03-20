import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  AccessibilityInfo,
  Platform
} from 'react-native';
import { GameEngine } from './src/engine/GameEngine';
import { AIService } from './src/services/AIService';
import { SpeechService } from './src/services/SpeechService';
import { OpenAITTSService } from './src/services/OpenAITTSService';
import { VoiceListener } from './src/services/VoiceListener';
import { AudioService } from './src/services/AudioService';
import { OPENAI_API_KEY, ELEVENLABS_API_KEY } from '@env';

export default function App() {
  const [gameEngine, setGameEngine] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [gameLog, setGameLog] = useState([]);
  const [playerStats, setPlayerStats] = useState(null);
  const [currentLocation, setCurrentLocation] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const aiServiceRef = useRef(null);
  const speechServiceRef = useRef(null);
  const voiceListenerRef = useRef(null);
  const audioServiceRef = useRef(null);
  const gameEngineRef = useRef(null);

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
    engine.on('gameStarted', ({ message }) => {
      addToLog('Dungeon Master', message);
    });

    engine.on('gameLoaded', ({ message }) => {
      addToLog('Dungeon Master', message);
      updateGameState(engine);
    });

    engine.on('awaitingVoiceInput', async () => {
      // Auto-enable microphone after DM finishes speaking
      await new Promise(resolve => setTimeout(resolve, 500));
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
      
      if (result.success) {
        addToLog('Dungeon Master', result.message);
        updateGameState(gameEngineRef.current);
      } else {
        addToLog('Dungeon Master', result.message || 'I did not understand that command.');
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
  };

  const addToLog = (speaker, message) => {
    setGameLog(prev => [...prev, { speaker, message, timestamp: Date.now() }]);
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} accessible={true} accessibilityRole="header">
          AIDM QUESTS
        </Text>
        {playerStats && (
          <View style={styles.statsBar} accessible={true} accessibilityLabel={`Health ${playerStats.health} out of ${playerStats.maxHealth}, Level ${playerStats.level}`}>
            <Text style={styles.statText}>❤️ {playerStats.health}/{playerStats.maxHealth}</Text>
            <Text style={styles.statText}>⚔️ Lvl {playerStats.level}</Text>
            <Text style={styles.statText}>📍 {currentLocation}</Text>
          </View>
        )}
      </View>

      <ScrollView 
        style={styles.logContainer}
        accessible={true}
        accessibilityLabel="Game log"
      >
        {gameLog.map((entry, index) => (
          <View key={index} style={styles.logEntry}>
            <Text 
              style={[
                styles.logSpeaker,
                entry.speaker === 'You' && styles.logPlayerSpeaker
              ]}
              accessible={true}
            >
              {entry.speaker}:
            </Text>
            <Text 
              style={styles.logMessage}
              accessible={true}
              accessibilityLabel={`${entry.speaker} says: ${entry.message}`}
            >
              {entry.message}
            </Text>
          </View>
        ))}
      </ScrollView>

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
  header: {
    padding: 16,
    backgroundColor: '#16213e',
    borderBottomWidth: 2,
    borderBottomColor: '#e94560',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e94560',
    textAlign: 'center',
    marginBottom: 8,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  statText: {
    color: '#f1f1f1',
    fontSize: 14,
    fontWeight: '600',
  },
  logContainer: {
    flex: 1,
    padding: 16,
  },
  logEntry: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#0f3460',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#e94560',
  },
  logSpeaker: {
    color: '#e94560',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  logPlayerSpeaker: {
    color: '#4ecca3',
  },
  logMessage: {
    color: '#f1f1f1',
    fontSize: 16,
    lineHeight: 24,
  },
  controlsContainer: {
    padding: 16,
    backgroundColor: '#16213e',
    borderTopWidth: 2,
    borderTopColor: '#e94560',
  },
  micButton: {
    backgroundColor: '#e94560',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  micButtonActive: {
    backgroundColor: '#4ecca3',
  },
  micButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quickCommandsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quickCommandButton: {
    flex: 1,
    backgroundColor: '#0f3460',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  quickCommandText: {
    color: '#f1f1f1',
    fontSize: 14,
    fontWeight: '600',
  },
  startButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  startButton: {
    flex: 1,
    backgroundColor: '#e94560',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    color: '#f1f1f1',
    fontSize: 16,
    textAlign: 'center',
  },
});
