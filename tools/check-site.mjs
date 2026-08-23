import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const required = [
  'index.html',
  'styles.css',
  'script.js',
  '.nojekyll',
  'assets/favicon.svg',
  'assets/abstract-orbit.png'
];

const failures = [];
for (const relativePath of required) {
  if (!existsSync(resolve(root, relativePath))) {
    failures.push('Missing required file: ' + relativePath);
  }
}

const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const css = readFileSync(resolve(root, 'styles.css'), 'utf8');
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicates.length) {
  failures.push('Duplicate HTML IDs: ' + [...new Set(duplicates)].join(', '));
}

const localReferences = [...html.matchAll(/(?:href|src)="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((reference) => !/^(?:https?:|mailto:|tel:|#)/.test(reference));

for (const reference of localReferences) {
  const pathOnly = reference.split('#')[0].split('?')[0];
  if (pathOnly && !existsSync(resolve(root, pathOnly))) {
    failures.push('Broken local reference: ' + reference);
  }
}

const anchors = [...html.matchAll(/href="#([^"]+)"/g)].map((match) => match[1]);
for (const anchor of anchors) {
  if (!ids.includes(anchor)) failures.push('Missing anchor target: #' + anchor);
}

if (!html.includes('<main id="main-content">')) failures.push('Missing labelled main landmark.');
if (!html.includes('name="description"')) failures.push('Missing meta description.');
if (html.includes('ascend26-poster-draft')) failures.push('Draft poster must not be linked from the public site.');
const fieldLists = [...html.matchAll(/<ol class="field-list">([\s\S]*?)<\/ol>/g)];
const fieldCounts = fieldLists.map((match) => (match[1].match(/<li>/g) || []).length);
if (fieldCounts.length !== 2 || fieldCounts[0] !== 18 || fieldCounts[1] !== 12) {
  failures.push('Expected complete research field lists containing 18 and 12 areas.');
}
if ((html.match(/class="timeline-item/g) || []).length !== 6) failures.push('Expected six timeline entries.');
const updatedEventContent = [
  '26 August 2026',
  '28 September 2026',
  '11 September 2026',
  '5 October 2026',
  '12&ndash;13 October 2026',
  'ppsperlis@uitm.edu.my',
  'Ts. Dr. Sabiroh Md Sabri (012-2992725)'
];
for (const content of updatedEventContent) {
  if (!html.includes(content)) failures.push('Missing updated event content: ' + content);
}
if ((css.match(/{/g) || []).length !== (css.match(/}/g) || []).length) failures.push('CSS braces are unbalanced.');
if (!html.includes('prefers-reduced-motion')) {
  if (!css.includes('prefers-reduced-motion')) failures.push('Missing reduced-motion treatment.');
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Validated ' + required.length + ' required files, local links, anchors, IDs and accessibility markers.');
