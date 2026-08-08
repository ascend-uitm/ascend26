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
  'assets/ascend26-poster-draft.png'
];

const failures = [];
for (const relativePath of required) {
  if (!existsSync(resolve(root, relativePath))) {
    failures.push('Missing required file: ' + relativePath);
  }
}

const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicates.length) {
  failures.push('Duplicate HTML IDs: ' + [...new Set(duplicates)].join(', '));
}

const localReferences = [...html.matchAll(/(?:href|src)="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((reference) => !/^(?:https?:|mailto:|#)/.test(reference));

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
if (!html.includes('prefers-reduced-motion')) {
  const css = readFileSync(resolve(root, 'styles.css'), 'utf8');
  if (!css.includes('prefers-reduced-motion')) failures.push('Missing reduced-motion treatment.');
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Validated ' + required.length + ' required files, local links, anchors, IDs and accessibility markers.');
