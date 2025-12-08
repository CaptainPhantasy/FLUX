#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '..', '.env.local');

const content = fs.readFileSync(envPath, 'utf-8');
const lines = content.split('\n');

console.log('\n📋 All API Keys in .env.local:\n');
console.log('─'.repeat(60));

lines.forEach((line, index) => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=');
    const keyName = key.trim();
    const valuePreview = value.trim().length > 40 
      ? value.trim().substring(0, 40) + '...' 
      : value.trim();
    
    if (keyName.includes('API') || keyName.includes('KEY')) {
      console.log(`${keyName.padEnd(35)} = ${valuePreview}`);
    }
  }
});

console.log('─'.repeat(60));
console.log('\n💡 Look for keys that might be:');
console.log('   - Gemini: GEMINI, GOOGLE, GCP');
console.log('   - Claude: ANTHROPIC, CLAUDE');
console.log('   - GLM: GLM, ZAI, Z_AI\n');
