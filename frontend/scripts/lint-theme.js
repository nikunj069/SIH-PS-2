import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.resolve(__dirname, '../src');

// These patterns represent legacy dark-mode or non-tokenized utility classes that are banned
const BANNED_PATTERNS = [
  /text-white/g,
  /text-cyan-([a-zA-Z0-9]+)/g,
  /text-slate-([1-5]00)/g,
  /text-gray-([1-5]00)/g,
  /bg-slate-([7-9]00)/g,
  /bg-gray-([7-9]00)/g,
  /bg-black/g,
  /bg-opacity-([0-9]+)/g,
  /opacity-[0-9]+/g, // might be too broad if we legitimately use opacity
  /font-mono/g,
  /uppercase/g,
  /tracking-[a-zA-Z0-9_-]+/g,
  /backdrop-blur(-[a-zA-Z0-9_-]+)?/g,
  /mix-blend-[a-zA-Z0-9_-]+/g,
  /drop-shadow(-[a-zA-Z0-9_-]+)?/g,
];

// Whitelist for font-mono (e.g. IMO numbers, logs)
// For this script, we'll just flag it and the dev can fix. But the spec says:
// "No raw colors in components... font-mono (except IMO/vessel IDs)"
// We can just flag `font-mono` and manually check. Wait, we should probably just fail if it's found unless ignored.
// Let's refine opacity: we only want to ban it on text or if it's `opacity-*`. We'll just check `text-opacity` and `bg-opacity`.

const EXACT_BANNED = [
  'text-white', 'font-mono', 'uppercase', 'bg-black'
];

let errors = 0;

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      checkFile(fullPath);
    }
  }
}

function checkFile(filePath) {
  // Allow exceptions in tokens.ts or specific files
  if (filePath.endsWith('tokens.ts')) return;

  const content = fs.readFileSync(filePath, 'utf-8');
  let fileHasError = false;

  for (const pattern of BANNED_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      // Ignore valid exceptions for font-mono if it has a comment like // eslint-disable-next-line theme
      // For simplicity, we just log all matches
      for (const match of matches) {
          // Special case: opacity on SVG might be fine, but we are aggressively banning
          console.error(`❌ Legacy theme violation in ${path.relative(SRC_DIR, filePath)}: found "${match}"`);
          fileHasError = true;
          errors++;
      }
    }
  }
}

console.log('Running theme linter...');
walk(SRC_DIR);

if (errors > 0) {
  console.error(`\nFound ${errors} theme violations. Please migrate these to semantic tokens.`);
  process.exit(1);
} else {
  console.log('✅ Theme linter passed. No legacy patterns found.');
  process.exit(0);
}
