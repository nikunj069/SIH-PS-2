import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FORBIDDEN_CLIENT_JARGON = [
  'digital twin',
  'heterogeneous',
  'telemetry',
  'pareto',
  'surrogate',
  'exponent',
  'qubo',
  'metaheuristic'
];

const copyFilePath = path.join(__dirname, 'en.ts');
const content = fs.readFileSync(copyFilePath, 'utf-8');

// Parse out lines, checking non-analyst lines
const lines = content.split('\n');
const violations = [];
let insideAnalystBlock = false;

lines.forEach((line, index) => {
  const trimmed = line.trim();
  if (trimmed.includes('analyst: {') || trimmed.includes('analystNotice:') || trimmed.includes('analystTooltip:')) {
    insideAnalystBlock = true;
  }
  if (insideAnalystBlock && trimmed.includes('}')) {
    insideAnalystBlock = false;
  }

  if (!insideAnalystBlock && !trimmed.toLowerCase().includes('analyst')) {
    const lower = trimmed.toLowerCase();
    for (const term of FORBIDDEN_CLIENT_JARGON) {
      if (lower.includes(term)) {
        violations.push({
          line: index + 1,
          term,
          content: trimmed
        });
      }
    }
  }
});

if (violations.length > 0) {
  console.error(`\x1b[31m[JARGON CHECK FAILED] Found ${violations.length} forbidden jargon instances in Client copy:\x1b[0m`);
  violations.forEach(v => {
    console.error(`  Line ${v.line}: Term "${v.term}" in: ${v.content}`);
  });
  process.exit(1);
} else {
  console.log(`\x1b[32m[JARGON CHECK PASSED] Zero forbidden jargon terms detected in Client Mode copy.\x1b[0m`);
  process.exit(0);
}
