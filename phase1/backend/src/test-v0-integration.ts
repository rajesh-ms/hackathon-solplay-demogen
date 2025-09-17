import { createAIProvider } from './ai-provider.js';

async function testV0Integration() {
  console.log('Testing v0.dev SDK Integration...\n');
  
  // Test with mock provider (safe for testing)
  process.env.AI_PROVIDER = 'mock';
  const mockProvider = createAIProvider();
  
  console.log('1. Testing Mock Provider...');
  const mockDemo = await mockProvider.generateDemo(
    'RFP Response Automation for Financial Services',
    { sampleData: 'test' }
  );
  
  console.log('Mock Demo Generated:');
  console.log('- Provider:', mockDemo.metadata.provider);
  console.log('- Components:', mockDemo.components.length);
  console.log('- HTML Length:', mockDemo.html.length, 'characters');
  console.log('- Status:', mockDemo.components[0].status);
  
  // Test with v0 provider (will use mock mode without API key)
  console.log('\n2. Testing V0 Provider (mock mode)...');
  process.env.AI_PROVIDER = 'v0';
  const v0Provider = createAIProvider();
  
  const v0Demo = await v0Provider.generateDemo(
    'RFP Response Automation for Financial Services',
    { useCase: 'demo', type: 'rfp' }
  );
  
  console.log('V0 Demo Generated:');
  console.log('- Provider:', v0Demo.metadata.provider);
  console.log('- Components:', v0Demo.components.length);
  console.log('- HTML Length:', v0Demo.html.length, 'characters');
  console.log('- Framework:', v0Demo.components[0].framework);
  
  console.log('\n✅ v0.dev SDK Integration Test Complete!');
  console.log('\nTo use v0.dev in production:');
  console.log('1. Set V0_API_KEY in your .env file');
  console.log('2. Set AI_PROVIDER=v0 in your .env file');
  console.log('3. The system will automatically use v0.dev for demo generation');
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testV0Integration().catch(console.error);
}

export { testV0Integration };