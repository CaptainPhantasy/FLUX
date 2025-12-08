#!/usr/bin/env node
// =====================================
// FLUX - Add VITE_ Prefixed Environment Variables
// =====================================
// This script reads existing API keys and adds VITE_ prefixed versions
// without removing the originals

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envLocalPath = path.join(__dirname, '..', '.env.local');
const timestamp = new Date().toLocaleString('en-US', {
  timeZone: 'America/Indiana/Indianapolis',
  hour12: false,
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
}).replace(',', '');

// Key mappings: [existing_key_name, vite_key_name]
const keyMappings = [
  ['GEMINI_API_KEY', 'VITE_GEMINI_API_KEY'],
  ['GOOGLE_API_KEY', 'VITE_GEMINI_API_KEY'], // Alternative name
  ['ANTHROPIC_API_KEY', 'VITE_ANTHROPIC_API_KEY'],
  ['CLAUDE_API_KEY', 'VITE_ANTHROPIC_API_KEY'], // Alternative name
  ['GLM_API_KEY', 'VITE_GLM_API_KEY'],
  ['ZAI_API_KEY', 'VITE_GLM_API_KEY'], // Alternative name
  ['Z_AI_API_KEY', 'VITE_GLM_API_KEY'], // Alternative name
];

function readEnvFile() {
  if (!fs.existsSync(envLocalPath)) {
    console.error('❌ .env.local file not found');
    process.exit(1);
  }
  return fs.readFileSync(envLocalPath, 'utf-8');
}

function parseEnvFile(content) {
  const env = {};
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('='); // Handle values with = in them
      env[key.trim()] = value.trim();
    }
  }
  
  return env;
}

function addViteKeys(env, content) {
  const newKeys = [];
  const addedKeys = new Set();
  
  // Check each mapping
  for (const [existingKey, viteKey] of keyMappings) {
    // Skip if VITE_ version already exists
    if (env[viteKey]) {
      console.log(`✓ ${viteKey} already exists, skipping`);
      continue;
    }
    
    // Try to find the existing key (check all variations)
    let foundValue = null;
    let foundKey = null;
    
    for (const [key, value] of Object.entries(env)) {
      if (key === existingKey || 
          key.toUpperCase() === existingKey.toUpperCase() ||
          key.replace(/_/g, '').toUpperCase() === existingKey.replace(/_/g, '').toUpperCase()) {
        foundValue = value;
        foundKey = key;
        break;
      }
    }
    
    if (foundValue && !addedKeys.has(viteKey)) {
      newKeys.push(`${viteKey}=${foundValue}`);
      addedKeys.add(viteKey);
      console.log(`✓ Added ${viteKey} from ${foundKey}`);
    }
  }
  
  if (newKeys.length === 0) {
    console.log('ℹ No new VITE_ keys to add (all already exist or source keys not found)');
    return content;
  }
  
  // Append new keys to the file
  const separator = '\n\n# ==========================================\n';
  const section = `# VITE_ Prefixed API Keys (Client-side accessible)\n# Added: ${timestamp}\n# ==========================================\n# These are client-side accessible versions of server-side keys\n${newKeys.join('\n')}\n`;
  
  // Check if VITE section already exists
  if (content.includes('# VITE_ Prefixed API Keys')) {
    // Append to existing section
    const viteSectionIndex = content.indexOf('# VITE_ Prefixed API Keys');
    const beforeVite = content.substring(0, viteSectionIndex);
    const afterVite = content.substring(viteSectionIndex);
    const newKeysOnly = newKeys.join('\n');
    
    // Insert new keys before the closing of the VITE section
    if (afterVite.includes('\n\n# ')) {
      const nextSectionIndex = afterVite.indexOf('\n\n# ', 1);
      const viteSection = afterVite.substring(0, nextSectionIndex);
      const rest = afterVite.substring(nextSectionIndex);
      return beforeVite + viteSection + '\n' + newKeysOnly + rest;
    } else {
      return content + '\n' + newKeysOnly;
    }
  } else {
    return content + separator + section;
  }
}

function main() {
  console.log('🔍 Reading .env.local...\n');
  
  const content = readEnvFile();
  const env = parseEnvFile(content);
  
  console.log('📋 Found environment variables:');
  Object.keys(env).forEach(key => {
    if (key.includes('API_KEY') || key.includes('KEY')) {
      const value = env[key];
      const displayValue = value.length > 20 ? value.substring(0, 20) + '...' : value;
      console.log(`  - ${key} = ${displayValue}`);
    }
  });
  
  console.log('\n🔧 Adding VITE_ prefixed versions...\n');
  
  const updatedContent = addViteKeys(env, content);
  
  if (updatedContent !== content) {
    fs.writeFileSync(envLocalPath, updatedContent, 'utf-8');
    console.log('\n✅ Successfully updated .env.local');
    console.log('⚠️  Please restart your development server for changes to take effect');
  } else {
    console.log('\n✅ No changes needed');
  }
}

main();

