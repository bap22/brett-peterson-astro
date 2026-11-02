#!/usr/bin/env node
// Restore full post bodies from a WordPress export.
// 1. In WordPress: Tools → Export → Posts → Download Export File
// 2. node scripts/import-wordpress.mjs path/to/export.xml
// Existing posts with a matching slug get their body replaced (frontmatter kept, `condensed` set to false).
// Posts that don't exist yet are created. Raw HTML bodies are kept as-is (Markdown allows inline HTML).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const file = process.argv[2];
if (!file) { console.error('Usage: node scripts/import-wordpress.mjs export.xml'); process.exit(1); }
const xml = readFileSync(file, 'utf8');
const cdata = (s = '') => s.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '');
const tag = (block, name) => cdata((block.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`)) || [])[1]?.trim());

let n = 0;
for (const [, item] of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
  if (tag(item, 'wp:post_type') !== 'post' || tag(item, 'wp:status') !== 'publish') continue;
  const slug = tag(item, 'wp:post_name');
  const title = tag(item, 'title');
  const date = tag(item, 'wp:post_date').slice(0, 10);
  const body = tag(item, 'content:encoded')
    .replace(/\[\/?et_pb[^\]]*\]/g, '') // strip Divi shortcodes
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n');
  const path = `src/content/posts/${slug}.md`;
  if (existsSync(path)) {
    const current = readFileSync(path, 'utf8');
    const fm = current.match(/^---\n[\s\S]*?\n---\n/)[0].replace('condensed: true', 'condensed: false');
    writeFileSync(path, `${fm}\n${body}\n`);
  } else {
    const [y, m, d] = date.split('-');
    writeFileSync(path, `---\ntitle: ${JSON.stringify(title)}\ndate: ${date}\nsummary: ""\ntags: []\nlegacyPath: /${y}/${m}/${d}/${slug}/\ncondensed: false\n---\n\n${body}\n`);
  }
  n++;
}
console.log(`Imported ${n} posts. Add any new legacyPath values to vercel.json redirects.`);
