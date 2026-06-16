#!/usr/bin/env python3
"""
Fix double-encoded UTF-8 (mojibake) in JSX files.
The file was originally UTF-8 Vietnamese, but bytes were 
read as Latin-1 and re-encoded as UTF-8, causing each 
non-ASCII byte to become a 2-byte UTF-8 sequence.

Fix: decode as UTF-8, encode back as Latin-1 (to get original bytes), decode as UTF-8.
But since the file is mixed (some sections are correct UTF-8), 
we process it byte by byte.
"""

import sys
import os
import re

def fix_double_utf8(raw: bytes) -> bytes:
    """Fix double-encoded UTF-8 bytes."""
    result = bytearray()
    i = 0
    fixes = 0
    
    while i < len(raw):
        # Check for double-encoded pattern:
        # A 2-byte UTF-8 sequence (C2-DF range) decoding to a value >= 0x80
        # which itself is a byte in a valid UTF-8 Vietnamese sequence
        if i + 1 < len(raw):
            b1 = raw[i]
            b2 = raw[i + 1]
            
            # 2-byte UTF-8 lead byte
            if 0xC2 <= b1 <= 0xDF and 0x80 <= b2 <= 0xBF:
                orig_b1 = ((b1 & 0x1F) << 6) | (b2 & 0x3F)
                
                # If orig_b1 is a non-ASCII byte, it might be part of a double-encoded sequence
                if orig_b1 >= 0x80:
                    # Try to collect enough double-encoded bytes to form a valid UTF-8 char
                    
                    # For 2-byte UTF-8 original char (0xC2-0xDF lead):
                    if 0xC2 <= orig_b1 <= 0xDF and i + 3 < len(raw):
                        b3 = raw[i + 2]
                        b4 = raw[i + 3]
                        if 0xC2 <= b3 <= 0xDF and 0x80 <= b4 <= 0xBF:
                            orig_b2 = ((b3 & 0x1F) << 6) | (b4 & 0x3F)
                            if 0x80 <= orig_b2 <= 0xBF:
                                candidate = bytes([orig_b1, orig_b2])
                                try:
                                    ch = candidate.decode('utf-8')
                                    if ord(ch) > 0x7F:
                                        result.extend(candidate)
                                        i += 4
                                        fixes += 1
                                        continue
                                except Exception:
                                    pass
                    
                    # For 3-byte UTF-8 original char (0xE0-0xEF lead):
                    elif 0xE0 <= orig_b1 <= 0xEF and i + 5 < len(raw):
                        b3 = raw[i + 2]; b4 = raw[i + 3]
                        b5 = raw[i + 4]; b6 = raw[i + 5]
                        if (0xC2 <= b3 <= 0xDF and 0x80 <= b4 <= 0xBF and
                                0xC2 <= b5 <= 0xDF and 0x80 <= b6 <= 0xBF):
                            orig_b2 = ((b3 & 0x1F) << 6) | (b4 & 0x3F)
                            orig_b3 = ((b5 & 0x1F) << 6) | (b6 & 0x3F)
                            if 0x80 <= orig_b2 <= 0xBF and 0x80 <= orig_b3 <= 0xBF:
                                candidate = bytes([orig_b1, orig_b2, orig_b3])
                                try:
                                    ch = candidate.decode('utf-8')
                                    if ord(ch) > 0x7F:
                                        result.extend(candidate)
                                        i += 6
                                        fixes += 1
                                        continue
                                except Exception:
                                    pass
                    
                    # For 4-byte UTF-8 original char (0xF0-0xF7 lead):
                    elif 0xF0 <= orig_b1 <= 0xF7 and i + 7 < len(raw):
                        b3 = raw[i + 2]; b4 = raw[i + 3]
                        b5 = raw[i + 4]; b6 = raw[i + 5]
                        b7 = raw[i + 6]; b8 = raw[i + 7]
                        if (0xC2 <= b3 <= 0xDF and 0x80 <= b4 <= 0xBF and
                                0xC2 <= b5 <= 0xDF and 0x80 <= b6 <= 0xBF and
                                0xC2 <= b7 <= 0xDF and 0x80 <= b8 <= 0xBF):
                            orig_b2 = ((b3 & 0x1F) << 6) | (b4 & 0x3F)
                            orig_b3 = ((b5 & 0x1F) << 6) | (b6 & 0x3F)
                            orig_b4 = ((b7 & 0x1F) << 6) | (b8 & 0x3F)
                            if (0x80 <= orig_b2 <= 0xBF and 0x80 <= orig_b3 <= 0xBF 
                                    and 0x80 <= orig_b4 <= 0xBF):
                                candidate = bytes([orig_b1, orig_b2, orig_b3, orig_b4])
                                try:
                                    ch = candidate.decode('utf-8')
                                    if ord(ch) > 0x7F:
                                        result.extend(candidate)
                                        i += 8
                                        fixes += 1
                                        continue
                                except Exception:
                                    pass
        
        result.append(raw[i])
        i += 1
    
    print(f'  Fixed {fixes} mojibake sequences', file=sys.stderr)
    return bytes(result)


def process_file(filepath: str):
    print(f'Processing: {filepath}', file=sys.stderr)
    
    with open(filepath, 'rb') as f:
        raw = f.read()
    
    # Skip if already valid UTF-8
    try:
        text = raw.decode('utf-8')
        # Check if there are mojibake patterns
        if 'Ã' not in text and 'Â' not in text and 'á»' not in text and 'áº' not in text:
            print(f'  Already clean, skipping.', file=sys.stderr)
            return False
        print(f'  Detected mojibake, fixing...', file=sys.stderr)
    except UnicodeDecodeError:
        print(f'  Not valid UTF-8, trying to fix...', file=sys.stderr)
    
    fixed = fix_double_utf8(raw)
    
    # Verify the fix works
    try:
        fixed_text = fixed.decode('utf-8')
        # Write fixed file
        with open(filepath, 'wb') as f:
            f.write(fixed)
        print(f'  Success! Written {len(fixed)} bytes.', file=sys.stderr)
        return True
    except UnicodeDecodeError as e:
        print(f'  Fix failed: {e}', file=sys.stderr)
        return False


if __name__ == '__main__':
    targets = sys.argv[1:] if len(sys.argv) > 1 else []
    
    if not targets:
        # Default: fix all JSX/TSX files in src/
        import glob
        targets = glob.glob('src/**/*.jsx', recursive=True)
        targets += glob.glob('src/**/*.tsx', recursive=True)
        targets += glob.glob('src/**/*.ts', recursive=True)
        targets += glob.glob('src/**/*.js', recursive=True)
    
    fixed_count = 0
    for path in targets:
        if process_file(path):
            fixed_count += 1
    
    print(f'\nDone! Fixed {fixed_count}/{len(targets)} files.')
