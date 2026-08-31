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
  'assets/abstract-orbit.png',
  'assets/speakers/ahmad-nizan-mat-noor.png',
  'assets/speakers/mohd-nazip-suratman.jpeg',
  'assets/speakers/seca-gandaseca.jpeg',
  'assets/speakers/zulkiflee-abd-latif.jpeg',
  'assets/templates/ascend-2026-extended-abstract-template.docx'
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
  '12 October 2026',
  '12<sup>th</sup>',
  'Prof. Madya Dr Ahmad Nizan Bin Mat Noor',
  'Prof. Dr. Mohd Nazip Suratman',
  'Are Your Research Questions, Objectives, Hypotheses, and Statistical Analysis Aligned?',
  'Assoc. Prof. Dr Seca Gandaseca',
  'Postgraduate Research as a Catalyst for Sustainable Development and SDG Achievement',
  'Prof. Dr. Zulkiflee Abd Latif',
  'The Successful Postgraduate: Research Smarter, Progress Faster, Graduate on Time',
  'Participant Registration and Virtual Session Admission',
  'Closing Ceremony and Announcement of Winners',
  'Programme Ends',
  'Participant',
  'RM 100',
  'Listener',
  'RM 10',
  'Payment instructions will be announced later.',
  'https://ascend.vlarbs.space/',
  'Extended abstract template',
  'assets/templates/ascend-2026-extended-abstract-template.docx',
  'Download DOCX',
  'Abstract template',
  'File coming soon',
  'ppsperlis@uitm.edu.my',
  'Ts. Dr. Sabiroh Md Sabri (012-2992725)'
];
for (const content of updatedEventContent) {
  if (!html.includes(content)) failures.push('Missing updated event content: ' + content);
}
const programmeBody = html.match(/<tbody>([\s\S]*?)<\/tbody>/);
if (!programmeBody || (programmeBody[1].match(/<tr(?:\s|>)/g) || []).length !== 11) {
  failures.push('Expected eleven tentative programme entries.');
}
if ((html.match(/class="speaker-card reveal"/g) || []).length !== 4) failures.push('Expected four keynote speaker cards.');
if ((html.match(/href="assets\/templates\/ascend-2026-extended-abstract-template\.docx"/g) || []).length !== 1) {
  failures.push('Expected one active extended abstract template download link.');
}
if ((html.match(/href="https:\/\/ascend\.vlarbs\.space\/"/g) || []).length < 3) {
  failures.push('Expected registration portal links in the navigation, hero, and registration section.');
}
for (const removedContent of [
  '12&ndash;13 October 2026',
  'Week 3 of lectures',
  'Participant · Local',
  'Participant · International',
  'Listener · Local',
  'Listener · International',
  'USD 30',
  'USD 3',
  'MYR 60',
  'USD 15'
]) {
  if (html.includes(removedContent)) failures.push('Removed event content is still present: ' + removedContent);
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
