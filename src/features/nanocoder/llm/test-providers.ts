// =====================================
// FLUX - LLM Provider Test Utility
// =====================================
// Test all configured LLM providers to verify functionality

import { getAvailableProviders, getLLMProvider } from './index';

/**
 * Test a single LLM provider with a simple test message
 */
async function testProvider(providerType: string): Promise<{
  success: boolean;
  provider: string;
  model: string;
  response?: string;
  error?: string;
  duration: number;
}> {
  const startTime = Date.now();
  
  try {
    const provider = getLLMProvider(providerType as any);
    
    if (!provider.isConfigured()) {
      return {
        success: false,
        provider: providerType,
        model: 'N/A',
        error: 'Provider not configured (missing API key)',
        duration: Date.now() - startTime,
      };
    }

    const model = provider.getModel();
    
    // Simple test message
    const testMessage = 'Say "Hello, I am working correctly" if you can read this.';
    
    const result = await provider.chat(testMessage, [], []);
    
    return {
      success: true,
      provider: providerType,
      model,
      response: result.response.substring(0, 100), // First 100 chars
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      provider: providerType,
      model: 'N/A',
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Test all available LLM providers
 */
export async function testAllProviders(): Promise<void> {
  console.log('🧪 Testing LLM Providers...\n');
  
  const providers = getAvailableProviders();
  const results = [];
  
  for (const { type, configured } of providers) {
    console.log(`Testing ${type}... ${configured ? '✅ Configured' : '❌ Not configured'}`);
    
    if (configured) {
      const result = await testProvider(type);
      results.push(result);
      
      if (result.success) {
        console.log(`  ✅ Success: ${result.model} responded in ${result.duration}ms`);
        console.log(`  Response: ${result.response}\n`);
      } else {
        console.log(`  ❌ Failed: ${result.error}\n`);
      }
    } else {
      results.push({
        success: false,
        provider: type,
        model: 'N/A',
        error: 'Not configured',
        duration: 0,
      });
      console.log(`  ⚠️  Skipped: No API key configured\n`);
    }
  }
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log('─'.repeat(50));
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const modelInfo = result.model !== 'N/A' ? ` (${result.model})` : '';
    console.log(`${status} ${result.provider}${modelInfo}: ${result.success ? `${result.duration}ms` : result.error}`);
  });
  
  console.log('─'.repeat(50));
  console.log(`Total: ${successful}/${total} providers working\n`);
  
  return results as any;
}

// Export for use in browser console or test scripts
if (typeof window !== 'undefined') {
  (window as any).testLLMProviders = testAllProviders;
}

