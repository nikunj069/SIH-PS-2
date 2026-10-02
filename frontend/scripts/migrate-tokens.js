import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';

const pattern = process.argv[2] || 'src/**/*.{ts,tsx}';
const files = globSync(pattern);

const replacements = [
  // text-slate
  [/text-slate-900/g, 'text-text'],
  [/text-slate-[3-8]00/g, 'text-text-muted'],
  [/text-slate-200/g, 'text-text-muted'],
  [/text-slate-100/g, 'text-text-muted'],
  // bg-slate
  [/bg-slate-[5]0/g, 'bg-surface-alt'],
  [/bg-slate-100/g, 'bg-surface-alt'],
  [/bg-slate-[7-9]00/g, 'bg-surface-alt'],
  // text-cyan
  [/text-cyan-[1-4]00/g, 'text-primary'],
  // text-white (where it meant light mode text or keep it if in blue button? actually, standard text)
  [/text-white/g, 'text-text'],
  // border-slate
  [/border-slate-[78]00/g, 'border-border'],
  // misc typography
  [/font-mono/g, 'tabular-nums'],
  [/uppercase/g, ''],
  [/tracking-tight/g, ''],
  [/tracking-wider/g, ''],
  [/tracking-widest/g, ''],
  // effects
  [/opacity-70/g, ''],
  [/opacity-60/g, ''],
  [/opacity-30/g, ''],
  [/bg-black/g, ''],
  [/backdrop-blur-sm/g, ''],
  [/backdrop-blur-md/g, ''],
  [/drop-shadow/g, ''],
];

for (const file of files) {
  const fullPath = path.resolve(file);
  let content = fs.readFileSync(fullPath, 'utf-8');
  let originalContent = content;

  for (const [regex, replacement] of replacements) {
    content = content.replace(regex, replacement);
  }

  // Clean up double spaces
  content = content.replace(/ +/g, ' ').replace(/ "\)/g, '")').replace(/ \}/g, '}');

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log(`Migrated ${fullPath}`);
  }
}
