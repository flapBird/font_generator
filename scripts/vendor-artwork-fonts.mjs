// Explicitly run to refresh the locally hosted, route-scoped artwork fonts.
// Downloads published data only; no npm lifecycle scripts are executed.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile, copyFile, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fontIds = ['creepster', 'nosifer', 'eater', 'jua', 'gaegu', 'nanum-pen-script', 'black-han-sans', 'noto-sans-sc', 'noto-serif-tc', 'ma-shan-zheng', 'zhi-mang-xing', 'amiri', 'cairo', 'lateef', 'reem-kufi', 'rubik-spray-paint', 'permanent-marker', 'rubik-bubbles', 'sedgwick-ave-display'];
const destination = path.join(root, 'public/fonts/artwork');
await mkdir(destination, { recursive: true });
const previous = await readFile(path.join(destination, 'sources.json'), 'utf8').then(JSON.parse).catch(() => []);
const sources = [];
async function download(url) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
      if (!response.ok) throw new Error(`${url}: ${response.status}`);
      return Buffer.from(await response.arrayBuffer());
    } catch (error) { lastError = error; }
  }
  throw lastError;
}
for (const id of fontIds) {
  const pinned = previous.find((entry) => entry.id === id);
  if (pinned && !process.argv.includes('--refresh')) {
    const css = await readFile(path.join(destination, id, '400.css'), 'utf8');
    await access(path.join(destination, id, 'LICENSE.txt'));
    for (const match of css.matchAll(/url\(\.\/files\/([^)]*\.woff2)\)/g)) await access(path.join(destination, id, 'files', match[1]));
    sources.push(pinned);
    console.log(`${id}@${pinned.version}: already vendored`);
    continue;
  }
  const metadata = JSON.parse((await download(`https://registry.npmjs.org/@fontsource/${id}/${pinned?.version ?? 'latest'}`)).toString());
  if (!['OFL-1.1', 'Apache-2.0'].includes(metadata.license)) throw new Error(`${id}: review license ${metadata.license}`);
  const bytes = await download(metadata.dist.tarball);
  const integrity = `sha512-${createHash('sha512').update(bytes).digest('base64')}`;
  if (integrity !== metadata.dist.integrity) throw new Error(`${id}: integrity mismatch`);
  const temp = await mkdtemp(path.join(tmpdir(), 'artwork-font-'));
  try {
    await writeFile(path.join(temp, 'font.tgz'), bytes);
    execFileSync('tar', ['-xzf', path.join(temp, 'font.tgz'), '-C', temp], { stdio: 'pipe' });
    const source = path.join(temp, 'package');
    const target = path.join(destination, id);
    await mkdir(path.join(target, 'files'), { recursive: true });
    const info = JSON.parse(await readFile(path.join(source, 'metadata.json'), 'utf8'));
    let css = await readFile(path.join(source, '400.css'), 'utf8');
    css = css.replace(/, url\([^)]*\.woff\) format\('woff'\)/g, '').replaceAll(`font-family: '${info.family}'`, `font-family: 'Artwork ${info.family}'`);
    for (const match of css.matchAll(/url\(\.\/files\/([^)]*\.woff2)\)/g)) {
      await copyFile(path.join(source, 'files', match[1]), path.join(target, 'files', match[1]));
    }
    await writeFile(path.join(target, '400.css'), css);
    await copyFile(path.join(source, 'LICENSE'), path.join(target, 'LICENSE.txt'));
    await rm(path.join(target, 'OFL.txt'), { force: true });
    sources.push({ id, family: info.family, version: metadata.version, license: metadata.license, upstream: info.source, archive: metadata.dist.tarball, integrity });
    await writeFile(path.join(destination, 'sources.json'), JSON.stringify(sources, null, 2) + '\n');
    console.log(`${id}@${metadata.version}: regular WOFF2 subsets + ${metadata.license}`);
  } finally { await rm(temp, { recursive: true, force: true }); }
}
await writeFile(path.join(destination, 'sources.json'), JSON.stringify(sources, null, 2) + '\n');
