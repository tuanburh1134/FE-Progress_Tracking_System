#!/usr/bin/env node
/**
 * Fix double-encoded UTF-8 (mojibake) in source files.
 * 
 * The problem: Vietnamese UTF-8 bytes were read as Latin-1 chars,
 * then re-encoded as UTF-8. This creates double-encoded sequences.
 * 
 * Fix: Read raw bytes, detect double-encoded sequences, and decode them back.
 */

const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

/**
 * Fix double-encoded UTF-8 bytes in a Buffer.
 * Each non-ASCII byte (>= 0x80) in the original file was encoded as a 2-byte UTF-8 sequence.
 * So byte 0xNN (>= 0x80) became the UTF-8 encoding of U+00NN.
 * 
 * Reverse: whenever we see a 2-byte UTF-8 sequence decoding to a byte >= 0x80,
 * collect enough such bytes to reconstruct the original UTF-8 character.
 */
function fixDoubleUtf8(raw) {
  const result = [];
  let i = 0;
  let fixes = 0;

  while (i < raw.length) {
    const b1 = raw[i];
    const b2 = i + 1 < raw.length ? raw[i + 1] : -1;

    // Check for 2-byte UTF-8 lead byte (C2-DF) followed by continuation (80-BF)
    if (b1 >= 0xC2 && b1 <= 0xDF && b2 >= 0x80 && b2 <= 0xBF) {
      const orig1 = ((b1 & 0x1F) << 6) | (b2 & 0x3F);

      // orig1 is a non-ASCII byte - could be part of double-encoded Vietnamese
      if (orig1 >= 0x80) {
        // Try to decode as many double-encoded bytes as needed for a valid UTF-8 char
        
        // 3-byte UTF-8 (U+0800 to U+FFFF) - Vietnamese chars are in this range (E1-EF lead)
        if (orig1 >= 0xE0 && orig1 <= 0xEF) {
          const b3 = i + 2 < raw.length ? raw[i + 2] : -1;
          const b4 = i + 3 < raw.length ? raw[i + 3] : -1;
          const b5 = i + 4 < raw.length ? raw[i + 4] : -1;
          const b6 = i + 5 < raw.length ? raw[i + 5] : -1;

          if (b3 >= 0xC2 && b3 <= 0xDF && b4 >= 0x80 && b4 <= 0xBF &&
              b5 >= 0xC2 && b5 <= 0xDF && b6 >= 0x80 && b6 <= 0xBF) {
            const orig2 = ((b3 & 0x1F) << 6) | (b4 & 0x3F);
            const orig3 = ((b5 & 0x1F) << 6) | (b6 & 0x3F);
            
            if (orig2 >= 0x80 && orig2 <= 0xBF && orig3 >= 0x80 && orig3 <= 0xBF) {
              // Validate as UTF-8 3-byte char
              const codepoint = ((orig1 & 0x0F) << 12) | ((orig2 & 0x3F) << 6) | (orig3 & 0x3F);
              if (codepoint >= 0x0800 && codepoint <= 0xFFFF) {
                result.push(orig1, orig2, orig3);
                i += 6;
                fixes++;
                continue;
              }
            }
          }
        }
        
        // 2-byte UTF-8 (U+0080 to U+07FF) - C2-DF lead
        else if (orig1 >= 0xC2 && orig1 <= 0xDF) {
          const b3 = i + 2 < raw.length ? raw[i + 2] : -1;
          const b4 = i + 3 < raw.length ? raw[i + 3] : -1;

          if (b3 >= 0xC2 && b3 <= 0xDF && b4 >= 0x80 && b4 <= 0xBF) {
            const orig2 = ((b3 & 0x1F) << 6) | (b4 & 0x3F);
            
            if (orig2 >= 0x80 && orig2 <= 0xBF) {
              const codepoint = ((orig1 & 0x1F) << 6) | (orig2 & 0x3F);
              if (codepoint >= 0x0080) {
                result.push(orig1, orig2);
                i += 4;
                fixes++;
                continue;
              }
            }
          }
        }
        
        // 4-byte UTF-8 (supplementary chars) - F0-F7 lead  
        else if (orig1 >= 0xF0 && orig1 <= 0xF7) {
          const b3 = i + 2 < raw.length ? raw[i + 2] : -1;
          const b4 = i + 3 < raw.length ? raw[i + 3] : -1;
          const b5 = i + 4 < raw.length ? raw[i + 4] : -1;
          const b6 = i + 5 < raw.length ? raw[i + 5] : -1;
          const b7 = i + 6 < raw.length ? raw[i + 6] : -1;
          const b8 = i + 7 < raw.length ? raw[i + 7] : -1;

          if (b3 >= 0xC2 && b3 <= 0xDF && b4 >= 0x80 && b4 <= 0xBF &&
              b5 >= 0xC2 && b5 <= 0xDF && b6 >= 0x80 && b6 <= 0xBF &&
              b7 >= 0xC2 && b7 <= 0xDF && b8 >= 0x80 && b8 <= 0xBF) {
            const orig2 = ((b3 & 0x1F) << 6) | (b4 & 0x3F);
            const orig3 = ((b5 & 0x1F) << 6) | (b6 & 0x3F);
            const orig4 = ((b7 & 0x1F) << 6) | (b8 & 0x3F);
            
            if (orig2 >= 0x80 && orig2 <= 0xBF && orig3 >= 0x80 && orig3 <= 0xBF && orig4 >= 0x80 && orig4 <= 0xBF) {
              result.push(orig1, orig2, orig3, orig4);
              i += 8;
              fixes++;
              continue;
            }
          }
        }
      }
    }

    result.push(raw[i]);
    i++;
  }

  console.error(`  Fixed ${fixes} mojibake sequences`);
  return Buffer.from(result);
}

function hasMojibake(text) {
  // Common mojibake patterns in Vietnamese double-encoded UTF-8
  return /[ÃÂ]/.test(text) && /[áºáº»á»]/.test(text);
}

function processFile(filePath) {
  const raw = fs.readFileSync(filePath);
  
  // Try reading as UTF-8 first
  let text;
  try {
    text = raw.toString('utf-8');
  } catch (e) {
    console.log(`  ${filePath}: Not valid UTF-8, skipping`);
    return false;
  }
  
  // Check for mojibake patterns
  if (!hasMojibake(text)) {
    return false;
  }
  
  console.log(`Processing: ${filePath}`);
  const fixed = fixDoubleUtf8(raw);
  
  // Verify the fix produces valid UTF-8
  try {
    const fixedText = fixed.toString('utf-8');
    fs.writeFileSync(filePath, fixed);
    console.log(`  Success! ${filePath}`);
    return true;
  } catch (e) {
    console.log(`  Fix failed for ${filePath}: ${e.message}`);
    return false;
  }
}

// Find all source files
const patterns = [
  'src/**/*.jsx',
  'src/**/*.tsx',
  'src/**/*.ts',
  'src/**/*.js',
  'src/**/*.css',
];

let allFiles = [];
for (const pattern of patterns) {
  try {
    const files = globSync(pattern, { cwd: process.cwd() });
    allFiles = allFiles.concat(files);
  } catch (e) {
    // glob might not be available, try fs
    console.error('glob not available:', e.message);
  }
}

if (allFiles.length === 0) {
  // Fallback: manual file list
  const { execSync } = require('child_process');
  const output = execSync('Get-ChildItem -Path src -Recurse -Include *.jsx,*.tsx,*.ts,*.js,*.css | Select-Object -ExpandProperty FullName', { shell: 'powershell' }).toString();
  allFiles = output.trim().split('\n').map(f => path.relative(process.cwd(), f.trim()));
}

console.log(`Found ${allFiles.length} files to check`);
let fixedCount = 0;

for (const file of allFiles) {
  if (processFile(file)) {
    fixedCount++;
  }
}

console.log(`\nDone! Fixed ${fixedCount}/${allFiles.length} files.`);
