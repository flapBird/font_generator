import { mkdir, copyFile, readdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
const source = resolve('node_modules/gpu-font');
const version = JSON.parse(await readFile(`${source}/package.json`, 'utf8')).version;
if (version !== '0.4.2') throw new Error('Review engine assets before changing the pinned version.');
const target = resolve(`public/font-identifier-engine/${version}`);
const files = ['LICENSE', 'models/encoder/encoder.json', 'models/encoder/google-fonts.json', ...(await readdir(`${source}/src`)).filter(name => name.endsWith('.mjs')).map(name => `src/${name}`)];
for (const file of files) { await mkdir(dirname(`${target}/${file}`), { recursive: true }); await copyFile(`${source}/${file}`, `${target}/${file}`); }
console.log(`Prepared local font matcher ${version}: Google Fonts only.`);
