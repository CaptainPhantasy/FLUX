#!/usr/bin/env node
// =====================================
// FLUX - Map Existing Keys to VITE_ Versions
// =====================================
// This script helps map existing API keys to VITE_ prefixed versions
// It handles various naming patterns and automatically creates the mappings

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envLocalPath = path.join(__dirname, '..', '.env.local');

// Patterns to match for each provider
const keyPatterns = {
  gemini: [
    /^GEMINI/i,
    /^GOOGLE.*API.*KEY/i,
    /GOOGLE.*GEMINI/i,
  ],
  anthropic: [
    /^ANTHROPIC/i,
    /^CLAUDE/i,
  ],
  glm: [
    /^GLM/i,
    /^ZAI/i,
    /^Z_AI/i,
    /Z\.AI/i,
  ],
};

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
      const value = valueParts.join('=');
      env[key.trim()] = value.trim();
    }
  }
  
  return env;
}

function findMatchingKeys(env, patterns) {
  const matches = [];
  for (const [key, value] of Object.entries(env)) {
    for (const pattern of patterns) {
      if (pattern.test(key) && !key.startsWith('VITE_')) {
        matches.push({ key, value });
        break;
      }
    }
  }
  return matches;
}

function main() {
  console.log('🔍 Scanning .env.local for API keys...\n');
  
  const content = readEnvFile();
  const env = parseEnvFile(content);
  
  const mappings = {
    gemini: findMatchingKeys(env, keyPatterns.gemini),
    anthropic: findMatchingKeys(env, keyPatterns.anthropic),
    glm: findMatchingKeys(env, keyPatterns.glm),
  };
  
  console.log('📋 Found potential API keys:\n');
  
  let foundAny = false;
  const viteKeysToAdd = [];
  
  // Check Gemini
  if (mappings.gemini.length > 0) {
    foundAny = true;
    console.log('🔵 Google Gemini:');
    mappings.gemini.forEach(({ key, value }) => {
      const displayValue = value.length > 30 ? value.substring(0, 30) + '...' : value;
      console.log(`   Found: ${key} = ${displayValue}`);
      if (!env['VITE_GEMINI_API_KEY']) {
        viteKeysToAdd.push({ key: 'VITE_GEMINI_API_KEY', value });
      }
    });
    console.log('');
  }
  
  // Check Anthropic
  if (mappings.anthropic.length > 0) {
    foundAny = true;
    console.log('🟣 Anthropic Claude:');
    mappings.anthropic.forEach(({ key, value }) => {
      const displayValue = value.length > 30 ? value.substring(0, 30) + '...' : value;
      console.log(`   Found: ${key} = ${displayValue}`);
      if (!env['VITE_ANTHROPIC_API_KEY']) {
        viteKeysToAdd.push({ key: 'VITE_ANTHROPIC_API_KEY', value });
      }
    });
    console.log('');
  }
  
  // Check GLM
  if (mappings.glm.length > 0) {
    foundAny = true;
    console.log('⚡ Z.AI GLM:');
    mappings.glm.forEach(({ key, value }) => {
      const displayValue = value.length > 30 ? value.substring(0, 30) + '...' : value;
      console.log(`   Found: ${key} = ${displayValue}`);
      if (!env['VITE_GLM_API_KEY']) {
        viteKeysToAdd.push({ key: 'VITE_GLM_API_KEY', value });
      }
    });
    console.log('');
  }
  
  if (!foundAny) {
    console.log('⚠️  No matching API keys found.');
    console.log('   Please ensure your keys are named with patterns like:');
    console.log('   - GEMINI_API_KEY, GOOGLE_API_KEY (for Gemini)');
    console.log('   - ANTHROPIC_API_KEY, CLAUDE_API_KEY (for Claude)');
    console.log('   - GLM_API_KEY, ZAI_API_KEY (for GLM)\n');
    return;
  }
  
  if (viteKeysToAdd.length === 0) {
    console.log('✅ All VITE_ versions already exist!\n');
    return;
  }
  
  console.log('🔧 Adding VITE_ prefixed versions...\n');
  
  // Find the VITE section or add at the end
  let updatedContent = content;
  const viteSectionMarker = '# VITE_ Prefixed API Keys (Client-side accessible)';
  
  if (content.includes(viteSectionMarker)) {
    // Update existing VITE section
    const lines = content.split('\n');
    const viteSectionStart = lines.findIndex(line => line.includes(viteSectionMarker));
    
    if (viteSectionStart !== -1) {
      // Find where to insert (after commented VITE_GEMINI_API_KEY, etc.)
      let insertIndex = viteSectionStart;
      for (let i = viteSectionStart; i < lines.length; i++) {
        if (lines[i].includes('VITE_GEMINI_API_KEY') || 
            lines[i].includes('VITE_ANTHROPIC_API_KEY') ||
            lines[i].includes('VITE_GLM_API_KEY')) {
          insertIndex = i + 1;
          break;
        }
      }
      
      // Insert new keys
      const newLines = [];
      viteKeysToAdd.forEach(({ key, value }) => {
        newLines.push(`${key}=${value}`);
      });
      
      lines.splice(insertIndex, 0, ...newLines);
      updatedContent = lines.join('\n');
    }
  } else {
    // Append new VITE section
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
    
    const newSection = `

# ==========================================
# VITE_ Prefixed API Keys (Client-side accessible)
# Added: ${timestamp}
# ==========================================
# These are client-side accessible versions of server-side keys above
${viteKeysToAdd.map(({ key }) => `${key}=${viteKeysToAdd.find(k => k.key === key)?.value || ''}`).join('\n')}
`;
    updatedContent = content + newSection;
  }
  
  fs.writeFileSync(envLocalPath, updatedContent, 'utf-8');
  
  console.log('✅ Successfully added:');
  viteKeysToAdd.forEach(({ key }) => {
    console.log(`   - ${key}`);
  });
  console.log('\n⚠️  Please restart your development server for changes to take effect\n');
}

main();

