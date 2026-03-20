// List available free voices from ElevenLabs
const apiKey = '3ec6ef19dbb5e0f46b51d725fce6768dd96381bdbaf0b9f57a1f72860408e869';

async function listVoices() {
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': apiKey
      }
    });

    const data = await response.json();
    
    console.log('🎙️ Available Voices:\n');
    
    data.voices.forEach(voice => {
      const category = voice.category || 'unknown';
      const isLibrary = category === 'professional' || category === 'premade';
      const status = isLibrary ? '❌ Paid only' : '✅ FREE';
      
      console.log(`${status} - ${voice.name}`);
      console.log(`   ID: ${voice.voice_id}`);
      console.log(`   Category: ${category}`);
      if (voice.description) {
        console.log(`   ${voice.description.substring(0, 100)}...`);
      }
      console.log();
    });

    console.log('\n💡 Use any voice with ✅ FREE in your game!');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

listVoices();
