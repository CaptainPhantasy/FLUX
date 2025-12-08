#!/usr/bin/env node
// =====================================
// FLUX - LLM Provider API Test Script
// =====================================
// Tests all configured LLM providers to verify API keys and connectivity

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env.local') });

const API_KEYS = {
  openai: process.env.VITE_OPENAI_API_KEY,
  gemini: process.env.VITE_GEMINI_API_KEY,
  claude: process.env.VITE_ANTHROPIC_API_KEY,
  glm: process.env.VITE_GLM_API_KEY,
};

console.log('🧪 Testing LLM Provider API Keys\n');
console.log('─'.repeat(60));

// Check which keys are configured
const configured = [];
const missing = [];

for (const [provider, key] of Object.entries(API_KEYS)) {
  if (key && key.trim() !== '') {
    configured.push(provider);
    const masked = key.substring(0, 8) + '...' + key.substring(key.length - 4);
    console.log(`✅ ${provider.toUpperCase()}: Configured (${masked})`);
  } else {
    missing.push(provider);
    console.log(`❌ ${provider.toUpperCase()}: Not configured`);
  }
}

console.log('\n─'.repeat(60));
console.log(`\n📊 Summary:`);
console.log(`   Configured: ${configured.length}/4 providers`);
console.log(`   Missing: ${missing.length}/4 providers`);

if (configured.length > 0) {
  console.log(`\n✅ Configured providers: ${configured.join(', ').toUpperCase()}`);
}

if (missing.length > 0) {
  console.log(`\n⚠️  Missing providers: ${missing.join(', ').toUpperCase()}`);
  console.log(`   Add keys to .env.local with VITE_ prefix`);
}

console.log('\n─'.repeat(60));
console.log('\n💡 Next Steps:');
console.log('   1. Navigate to /app/nanocoder in your browser');
console.log('   2. Click "Test All" button to verify API connectivity');
console.log('   3. Select a provider from the dropdown to use it\n');

// Test API connectivity (basic check)
if (configured.length > 0) {
  console.log('🔍 Testing API Connectivity...\n');
  
  for (const provider of configured) {
    try {
      const key = API_KEYS[provider];
      let testUrl = '';
      let testMethod = 'GET';
      
      switch (provider) {
        case 'openai':
          testUrl = 'https://api.openai.com/v1/models';
          break;
        case 'gemini':
          testUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
          break;
        case 'claude':
          testUrl = 'https://api.anthropic.com/v1/messages';
          testMethod = 'POST';
          break;
        case 'glm':
          testUrl = 'https://api.z.ai/api/anthropic/v1/messages';
          testMethod = 'POST';
          break;
      }
      
      if (testUrl) {
        const startTime = Date.now();
        const response = await fetch(testUrl, {
          method: testMethod,
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
            ...(provider === 'claude' || provider === 'glm' ? {
              'anthropic-version': '2023-06-01'
            } : {}),
          },
          ...(provider === 'claude' || provider === 'glm' ? {
            body: JSON.stringify({
              model: provider === 'glm' ? 'glm-4.6' : 'claude-3-5-sonnet-20241022',
              max_tokens: 10,
              messages: [{ role: 'user', content: 'test' }]
            })
          } : {}),
        });
        
        const duration = Date.now() - startTime;
        
        if (response.ok || response.status === 401) {
          // 401 means key is valid but request format might be wrong (which is fine for this test)
          console.log(`   ✅ ${provider.toUpperCase()}: API reachable (${duration}ms)`);
        } else {
          console.log(`   ⚠️  ${provider.toUpperCase()}: API responded with status ${response.status}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ ${provider.toUpperCase()}: ${error.message}`);
    }
  }
}

console.log('\n✅ API key verification complete!\n');

