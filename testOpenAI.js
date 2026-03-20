// Quick OpenAI API Test Script
// Run with: node testOpenAI.js
// No dependencies needed - uses built-in fetch

const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY_HERE';

async function testOpenAI() {
  console.log('🧪 Testing OpenAI API...\n');

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { 
            role: 'system', 
            content: 'You are a helpful assistant.' 
          },
          { 
            role: 'user', 
            content: 'Say "API is working!" in a fantasy style.' 
          }
        ],
        max_tokens: 50,
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(JSON.stringify(data));
    }

    console.log('✅ SUCCESS! OpenAI API is working!\n');
    console.log('📝 Response from GPT-4:');
    console.log('---');
    console.log(data.choices[0].message.content);
    console.log('---\n');
    
    console.log('📊 API Details:');
    console.log(`   Model: ${data.model}`);
    console.log(`   Tokens used: ${data.usage.total_tokens}`);
    console.log(`   Finish reason: ${data.choices[0].finish_reason}\n`);
    
    console.log('🎮 Your game is ready to use AI narration!');

  } catch (error) {
    console.error('❌ ERROR: API test failed\n');
    
    try {
      const errorData = JSON.parse(error.message);
      console.error('Error:', errorData.error?.message || errorData);
      
      if (errorData.error?.type === 'invalid_request_error') {
        console.error('\n🔑 Your API key is invalid or expired.');
        console.error('   Get a new key at: https://platform.openai.com/api-keys');
      } else if (errorData.error?.code === 'insufficient_quota') {
        console.error('\n⚠️  Insufficient credits or quota exceeded.');
        console.error('   Check your account at: https://platform.openai.com/account/billing');
      }
    } catch {
      console.error('Error:', error.message);
      console.error('\n💡 Check:');
      console.error('   - Internet connection');
      console.error('   - API key validity');
      console.error('   - Account billing status');
    }
  }
}

testOpenAI();
