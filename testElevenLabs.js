// Test ElevenLabs API
// Run with: node testElevenLabs.js

const apiKey = '3ec6ef19dbb5e0f46b51d725fce6768dd96381bdbaf0b9f57a1f72860408e869';
const voiceId = 'HAvvFKatz0uu0Fv55Riy';

async function testElevenLabs() {
  console.log('🎙️ Testing ElevenLabs API...\n');

  try {
    // Test 1: Get voice info
    console.log('📋 Fetching voice information...');
    const voiceResponse = await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
      headers: {
        'xi-api-key': apiKey
      }
    });

    if (!voiceResponse.ok) {
      throw new Error(`Voice info failed: ${voiceResponse.status}`);
    }

    const voiceData = await voiceResponse.json();
    console.log('✅ Voice found:', voiceData.name);
    console.log('   Category:', voiceData.category);
    console.log('   Description:', voiceData.description || 'N/A');
    console.log();

    // Test 2: Generate speech
    console.log('🎤 Generating test narration...');
    const testText = 'Welcome, brave adventurer, to the realm of AIDM Quests. Your journey begins now.';
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text: testText,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`TTS failed: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const audioSizeKB = (audioBuffer.byteLength / 1024).toFixed(2);

    console.log('✅ Audio generated successfully!');
    console.log(`   Size: ${audioSizeKB} KB`);
    console.log(`   Text: "${testText}"`);
    console.log();

    // Test 3: Check quota
    console.log('📊 Checking account status...');
    const userResponse = await fetch('https://api.elevenlabs.io/v1/user', {
      headers: {
        'xi-api-key': apiKey
      }
    });

    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log('✅ Account active');
      console.log(`   Character count: ${userData.subscription.character_count}/${userData.subscription.character_limit}`);
      console.log(`   Characters remaining: ${userData.subscription.character_limit - userData.subscription.character_count}`);
    }

    console.log();
    console.log('🎮 ElevenLabs is ready for AIDM Quests!');
    console.log('   Your Dungeon Master will have a professional voice.');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('\n💡 Check:');
    console.error('   - API key is correct');
    console.error('   - Voice ID is valid');
    console.error('   - Account has credits');
    console.error('   - Internet connection');
  }
}

testElevenLabs();
