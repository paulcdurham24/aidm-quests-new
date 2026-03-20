// Test OpenAI TTS API
// Run with: node testOpenAITTS.js

const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY_HERE';

async function testOpenAITTS() {
  console.log('🎙️ Testing OpenAI TTS API...\n');

  try {
    const testText = 'Welcome, brave adventurer, to the realm of AIDM Quests. I am your Dungeon Master, and your journey begins now.';
    
    console.log('📝 Generating speech with Onyx voice...');
    console.log(`   Text: "${testText}"\n`);

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: 'onyx',
        input: testText,
        speed: 1.0
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`TTS failed: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const audioSizeKB = (audioBuffer.byteLength / 1024).toFixed(2);

    console.log('✅ SUCCESS! OpenAI TTS is working!\n');
    console.log('📊 Audio Details:');
    console.log(`   Size: ${audioSizeKB} KB`);
    console.log(`   Voice: Onyx (Deep, authoritative)`);
    console.log(`   Model: tts-1`);
    console.log(`   Characters: ${testText.length}`);
    console.log();

    // Calculate cost
    const costPer1M = 15; // $15 per 1 million characters
    const cost = (testText.length / 1000000) * costPer1M;
    console.log('💰 Cost Analysis:');
    console.log(`   This narration: $${cost.toFixed(6)}`);
    console.log(`   30,000 char playthrough: $${((30000 / 1000000) * costPer1M).toFixed(2)}`);
    console.log(`   vs ElevenLabs: $6.00 per playthrough`);
    console.log(`   SAVINGS: 92%! 🎉\n`);

    console.log('🎮 Your Dungeon Master voice is ready!');
    console.log('   Onyx will narrate your adventure with authority.');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('\n💡 Check:');
    console.error('   - API key is valid');
    console.error('   - OpenAI account has credits');
    console.error('   - Internet connection');
  }
}

testOpenAITTS();
