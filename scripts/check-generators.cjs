/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness installs the TypeScript require hook for pure-function regression tests. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, filename);
const { generatorStyles } = require('../lib/generator.ts');
const { generateAsciiArt, asciiStyleLabels } = require('../lib/ascii-font.ts');
const { parseFormattingLine, serializeMinecraftText } = require('../lib/minecraft-formatting.ts');

for (const id of ['boldScript', 'boldFraktur', 'sans', 'sansBold', 'sansItalic', 'sansBoldItalic']) {
  const style = generatorStyles.find((style) => style.id === id);
  assert.equal(style.transform('é'), style.transform('e\u0301'), `${id}: canonical accent equivalence`);
  assert.ok(style.transform('e\u0301').endsWith('\u0301'), `${id}: retains accent`);
  for (const emoji of ['1️⃣', '👨‍👩‍👧‍👦', '🇨🇳', '👍🏽']) assert.equal(style.transform(emoji), emoji, `${id}: ${emoji}`);
}
for (const style of Object.keys(asciiStyleLabels)) {
  const fourLines = generateAsciiArt('A\nB\nC\nD', style);
  assert.equal(fourLines.split('\n\n').length, 4, `${style}: preserves fourth line`);
  assert.notEqual(generateAsciiArt('A'.repeat(24) + 'B', style), generateAsciiArt('A'.repeat(24), style));
  for (const alignment of ['left', 'center', 'right']) {
    const output = generateAsciiArt('F\nWW', style, alignment);
    const rows = output.split('\n\n')[0].split('\n');
    const reference = generateAsciiArt('F', style).split('\n');
    const offsets = rows.map((row, i) => row.indexOf(reference[i].trimEnd())).filter((offset) => offset >= 0);
    assert.equal(new Set(offsets).size, 1, `${style}/${alignment}: moves whole glyph together`);
  }
}
const code = serializeMinecraftText('Hi &aGreen&r Red\nNext', '#ff5555', { bold: true, italic: true });
const lines = code.split('\n').map((line) => parseFormattingLine(line, '#ffffff'));
assert.equal(lines[0].map((run) => run.text).join(''), 'Hi Green Red');
assert.deepEqual(lines[0].map((run) => run.color), ['#ff5555', '#55ff55', '#ff5555']);
assert.ok(lines.flat().every((run) => run.bold && run.italic));
assert.equal(lines[1][0].color, '#ff5555');
assert.equal(serializeMinecraftText('', '#ff5555'), '');
console.log('Generator regressions passed: Unicode clusters, ASCII preservation/alignment, Minecraft code round-trip.');

const { resolveGeneratorText, readSavedGeneratorText } = require('../lib/generator-text-draft.ts');
const emptyEdit = { text: '', revision: 2 };
assert.equal(resolveGeneratorText(emptyEdit, 0, 'Free Font Generator'), '', 'Current input can be cleared for editing');
assert.equal(resolveGeneratorText(emptyEdit, 2, 'Small Text Generator'), 'Small Text Generator', 'New tool restores its own name');
assert.equal(resolveGeneratorText(emptyEdit, 2, 'Free Font Generator'), 'Free Font Generator', 'Returning home restores homepage name');
assert.equal(readSavedGeneratorText(''), null, 'Legacy saved empty drafts are ignored');
assert.equal(readSavedGeneratorText(' \n'), null, 'Whitespace is not restored as a draft');
assert.equal(resolveGeneratorText({ text: readSavedGeneratorText(''), revision: 0 }, 0, 'Free Font Generator'), 'Free Font Generator', 'Refresh restores default after clearing');
assert.equal(resolveGeneratorText({ text: 'Alice\nBob', revision: 3 }, 3, 'Small Text Generator'), 'Alice\nBob', 'Real drafts survive navigation');
console.log('Empty draft regressions passed: clear, navigation, refresh, legacy storage and real draft retention.');

const { strikeText, generateZalgo, formatDiscordMessage, ZALGO_INPUT_LIMIT } = require('../lib/text-effects.ts');
const { generatorRegistry, validateGeneratorRegistry } = require('../lib/generator-registry.ts');
assert.deepEqual(validateGeneratorRegistry(), []);
for (const slug of ['bold-text-generator', 'discord-font-generator', 'strikethrough-text-generator', 'zalgo-text-generator']) {
  assert.equal(generatorRegistry.filter((entry) => entry.slug === slug).length, 1, `${slug}: registered once`);
}
for (const mark of ['\u0334', '\u0335', '\u0336']) {
  assert.equal(strikeText('A1!\n é', mark), `A${mark}1${mark}!${mark}\n é${mark}`);
  assert.equal(strikeText(strikeText('A1!', mark), mark), strikeText('A1!', mark), 'Repeated strike does not accumulate the same mark');
  for (const emoji of ['👨‍👩‍👧‍👦', '🇨🇳', '👍🏽', '1️⃣']) assert.equal(strikeText(emoji, mark), emoji);
}
const zalgoOptions = { intensity: 3, above: true, middle: true, below: true, seed: 42 };
assert.equal(generateZalgo('', zalgoOptions), '');
assert.equal(generateZalgo('Café\nHello', { ...zalgoOptions, intensity: 0 }), 'Café\nHello');
assert.equal(generateZalgo('Café', { ...zalgoOptions, above: false, middle: false, below: false }), 'Café');
assert.equal(generateZalgo('👨‍👩‍👧‍👦 🇨🇳 👍🏽 1️⃣ 中文 हिन्दी\n', zalgoOptions), '👨‍👩‍👧‍👦 🇨🇳 👍🏽 1️⃣ 中文 हिन्दी\n');
assert.equal(generateZalgo('a\u0300\u0301\u0302\u0303', zalgoOptions), 'a\u0300\u0301\u0302\u0303', 'Dense pasted clusters stay intact');
assert.ok(generateZalgo('e\u0301', zalgoOptions).startsWith('e\u0301'), 'Original accent retained');
assert.equal(generateZalgo('Hello', zalgoOptions), generateZalgo('Hello', zalgoOptions), 'Stable preview');
assert.notEqual(generateZalgo('Hello', zalgoOptions), generateZalgo('Hello', { ...zalgoOptions, seed: 43 }), 'Randomize changes marks');
assert.match(generateZalgo('A', { ...zalgoOptions, middle: false, below: false }), /^A[\u0300-\u030c\u0311]{3}$/);
assert.match(generateZalgo('A', { ...zalgoOptions, above: false, below: false }), /^A[\u0334-\u0338]{2}$/);
assert.match(generateZalgo('A', { ...zalgoOptions, above: false, middle: false }), /^A[\u0316-\u0330]{3}$/);
assert.equal(generateZalgo('A'.repeat(ZALGO_INPUT_LIMIT), { ...zalgoOptions, intensity: 100 }).length, ZALGO_INPUT_LIMIT * 23, 'Bounded output expansion');
assert.equal(generateZalgo('A'.repeat(ZALGO_INPUT_LIMIT + 1), zalgoOptions), '', 'Oversized input not silently truncated');
assert.equal(formatDiscordMessage('Hello', 'bold'), '**Hello**');
assert.equal(formatDiscordMessage('Hello', 'underlineBold'), '__**Hello**__');
assert.equal(formatDiscordMessage(' a \n\n b\r\n', 'strike'), ' ~~a~~ \n\n ~~b~~\r\n');
assert.equal(formatDiscordMessage('a*b_~`|\\', 'bold'), '**a\\*b\\_\\~\\`\\|\\\\**');
assert.equal(formatDiscordMessage('', 'bold'), '');
assert.equal(formatDiscordMessage(' \n', 'italic'), ' \n');
console.log('Priority text regressions passed: registry, strike coverage, bounded Zalgo, grapheme preservation, Discord Markdown escaping.');

const { underlineText, vaporwaveText } = require('../lib/text-effects.ts');
const { styleSocialText, xPostLength, framePetName } = require('../lib/social-text.ts');
const { validateVisualGeneratorConfigs, getVisualGeneratorConfig } = require('../lib/visual-generator.ts');
const { stylePages, fandomPages } = require('../lib/data.ts');
const { validateContentUpdateCoverage } = require('../lib/content-updates.ts');
assert.deepEqual(validateVisualGeneratorConfigs(), []);
for (const double of [false, true]) {
  const mark = double ? '\u0333' : '\u0332';
  assert.equal(underlineText('A1!\n é', double), `A${mark}1${mark}!${mark}\n é${mark}`);
  assert.equal(underlineText(underlineText('A', double), double), `A${mark}`);
  for (const emoji of ['👨‍👩‍👧‍👦', '🇨🇳', '👍🏽', '1️⃣']) assert.equal(underlineText(emoji, double), emoji);
}
assert.equal(vaporwaveText('Ab 19!?\nNext'), 'Ａｂ　１９！？\nＮｅｘｔ');
assert.equal(vaporwaveText('é\n👨‍👩‍👧‍👦 1️⃣ 中文'), 'ｅ\u0301\n👨‍👩‍👧‍👦　1️⃣　中文');
assert.equal(vaporwaveText('Été abc', true), 'Ｅ\u0301ＴＥ\u0301　ＡＢＣ');
assert.equal(vaporwaveText('ab cd\nef', false, true), 'ａ ｂ　ｃ ｄ\nｅ ｆ');
assert.equal(vaporwaveText(''), '');
const transform = (id, text) => generatorStyles.find((style) => style.id === id).transform(text);
assert.equal(transform('smallCapsInitials', 'Alice NASA Émile 123'), 'Aʟɪᴄᴇ NASA Éᴍɪʟᴇ 123');
assert.equal(transform('doubleStruck', 'CHNPQRZ 0123456789'), 'ℂℍℕℙℚℝℤ 𝟘𝟙𝟚𝟛𝟜𝟝𝟞𝟟𝟠𝟡');
const socialInput = '👨‍👩‍👧‍👦 Hi @artist https://example.com/a?q=1 #Design $USD';
assert.equal(styleSocialText(socialInput, (text) => transform('bold', text)), '👨‍👩‍👧‍👦 𝐇𝐢 @artist https://example.com/a?q=1 #Design $USD');
assert.equal(xPostLength('𝐀'), 2);
assert.equal(xPostLength('👨‍👩‍👧‍👦'), 2);
assert.equal(xPostLength('https://example.com/very/long/path'), 23);
assert.equal(xPostLength('a'.repeat(280)), 280);
assert.equal(xPostLength(transform('bold', 'a'.repeat(141))), 282);
assert.equal(framePetName(''), '');
assert.equal(framePetName(' \n', 'hearts'), '');
assert.equal(framePetName('Luna\n\nSunny', 'hearts'), '♡ Luna ♡\n\n♡ Sunny ♡');
assert.equal(framePetName('Luna', 'none'), 'Luna');
const allPages = [...stylePages, ...fandomPages];
const { guidePages } = require('../lib/data.ts');
const knownSlugs = new Set([...allPages, ...guidePages].map((page) => page.slug));
for (const page of allPages) for (const related of page.relatedSlugs) assert.ok(knownSlugs.has(related), `${page.slug} links to missing ${related}`);
for (const slug of ['underline-text-generator', 'small-caps-generator', 'double-struck-font-generator', 'vaporwave-font-generator', 'twitter-font-generator', 'twitch-font-generator', 'roblox-font-generator', 'adopt-me-font-generator', 'handwriting-font-generator']) {
  assert.equal(generatorRegistry.filter((entry) => entry.slug === slug).length, 1, `${slug}: registered once`);
}
validateContentUpdateCoverage([
  '/', '/about', '/contact', '/privacy', '/terms', '/styles', '/visual-art', '/fandom', '/guides',
  ...allPages.map((page) => `/${page.slug}`), ...guidePages.map((page) => `/guides/${page.slug}`),
]);
assert.equal(getVisualGeneratorConfig('handwriting-font-generator').presets.length, 3);
assert.deepEqual(generatorRegistry.find((entry) => entry.slug === 'handwriting-font-generator').intent.expectedOutputs, ['text', 'png', 'svg']);
console.log('Expansion regressions passed: underline, fullwidth punctuation/spacing, small caps, double-struck exceptions/digits, protected social entities, weighted X lengths, pet frames, links and sitemap dates.');

const { hiddenNavigationSlugs, isVisibleInGeneratorNavigation, focusedTextSlugs } = require('../lib/generator-navigation.ts');
assert.equal(hiddenNavigationSlugs.length, 23);
assert.equal(new Set(hiddenNavigationSlugs).size, 23);
for (const slug of hiddenNavigationSlugs) {
  assert.ok(knownSlugs.has(slug), `Hidden navigation entry is still a real page: ${slug}`);
  assert.equal(isVisibleInGeneratorNavigation(`/${slug}`), false);
}
for (const page of allPages.filter((page) => !hiddenNavigationSlugs.includes(page.slug))) assert.equal(isVisibleInGeneratorNavigation(`/${page.slug}`), true, `${page.slug} retains its navigation entry`);
for (const slug of ['small-text-generator', 'cursive-font-generator', 'impact-font-generator']) assert.equal(focusedTextSlugs.has(slug), false, `${slug} retains its existing workspace`);
console.log('Navigation regressions passed: 13 previous and 10 October additions hidden, all older entries preserved, old workspace opt-in unchanged.');

// Baseline captured before the October expansion. Changes to older transforms,
// preset lists, defaults, output declarations or homepage priorities must be deliberate.
const { createHash } = require('node:crypto');
const baseline = require('../tests/generators/fixtures/pre-october-baseline.json');
const { getGeneratorPageConfig } = require('../lib/generator.ts');
const digest = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
assert.deepEqual(generatorStyles.map((style) => style.id), Object.keys(baseline.styles), 'No new global styles or changed homepage style order');
for (const style of generatorStyles) assert.equal(digest(baseline.inputs.map(style.transform)), baseline.styles[style.id], `${style.id}: existing conversion results`);
for (const [slug, expected] of Object.entries(baseline.pages)) {
  const page = allPages.find((entry) => entry.slug === slug);
  assert.ok(page, `${slug}: existing page preserved`);
  assert.equal(digest({ config: getGeneratorPageConfig(slug, page.title, page.defaultStyleIds), visual: getVisualGeneratorConfig(slug), registry: generatorRegistry.find((entry) => entry.slug === slug) }), expected, `${slug}: existing config, presets and registry`);
}
const { octoberTextResults, frameLines } = require('../lib/october-text.ts');
const { convertWingdings, wingdingsEntries } = require('../lib/wingdings.ts');
const { octoberSlugs, octoberArtSlugs, octoberTextSlugs, octoberArtwork } = require('../lib/october-catalog.ts');
const { isFontStyleGenerator } = require('../lib/generator-registry.ts');
for (const slug of octoberSlugs) {
  const entry = generatorRegistry.find((item) => item.slug === slug);
  assert.ok(entry);
  assert.equal(entry.homepage.enabled, false, `${slug}: no homepage feature/list changes`);
  assert.equal(isFontStyleGenerator(entry), octoberTextSlugs.includes(slug), `${slug}: correct directory`);
  assert.equal(isVisibleInGeneratorNavigation(`/${slug}`), false);
}
assert.equal(wingdingsEntries.length, 62);
assert.equal(new Set(wingdingsEntries.map((entry) => entry.symbol)).size, 62, 'Unambiguous reverse mapping');
const alphabet = wingdingsEntries.map((entry) => entry.key).join('');
assert.equal(convertWingdings(convertWingdings(alphabet, 'encode'), 'decode'), alphabet);
assert.equal(convertWingdings('Hello 123!', 'encode', true), convertWingdings('HELLO 123!', 'encode'));
assert.equal(convertWingdings('✌️', 'decode'), 'A', 'Accept presentation selectors on known symbols');
for (const direction of ['encode', 'decode']) assert.equal(convertWingdings('中文 한글 العربية 👨‍👩‍👧‍👦 👍🏽 1️⃣\n!', direction), '中文 한글 العربية 👨‍👩‍👧‍👦 👍🏽 1️⃣\n!');
assert.equal(frameLines('A\n\nB', 'hearts'), '♡ A ♡\n\n♡ B ♡');
assert.equal(frameLines(' \n', 'bows'), '');
for (const slug of [...octoberTextSlugs.filter((slug) => slug !== 'wingdings-font-generator'), 'halloween-font-generator']) {
  for (const result of octoberTextResults('', slug, 'hearts')) assert.equal(result.text, '', `${slug}: empty output`);
  for (const result of octoberTextResults('中文 한글 العربية 👨‍👩‍👧‍👦 👍🏽 1️⃣\n', slug)) assert.equal(result.text.includes('中文 한글 العربية 👨‍👩‍👧‍👦 👍🏽 1️⃣'), true, `${slug}: grapheme preservation`);
}
const bio = 'Hi 사랑해 @artist https://example.com #Kpop';
for (const result of octoberTextResults(bio, 'k-pop-font-generator')) assert.ok(result.text.includes('사랑해 @artist https://example.com #Kpop'), 'K-pop preserves Hangul/social entities');
assert.equal(octoberTextResults('DD', 'emoji-font-generator').find((item) => item.id === 'emojiMix').text, '🄳🄳', 'No accidental regional-indicator pairing');
const fonts = JSON.parse(fs.readFileSync('public/fonts/artwork/sources.json', 'utf8'));
for (const slug of octoberArtSlugs) for (const font of octoberArtwork[slug].fonts) {
  assert.ok(fonts.some((entry) => entry.id === font.id && ['OFL-1.1', 'Apache-2.0'].includes(entry.license)), `${font.id}: recorded source/license`);
  const folder = `public/fonts/artwork/${font.id}`;
  const css = fs.readFileSync(`${folder}/400.css`, 'utf8');
  assert.ok(css.includes(`font-family: 'Artwork ${font.family}'`), 'Isolated family name');
  assert.ok(fs.readFileSync(`${folder}/LICENSE.txt`, 'utf8').length > 500);
  for (const [, filename] of css.matchAll(/url\(\.\/files\/([^)]*)\)/g)) assert.ok(fs.statSync(`${folder}/files/${filename}`).size > 0, `${font.id}: bundled file ${filename}`);
}
console.log('October regressions passed: all 59 old transforms and 65 page definitions unchanged; 10 new routes, directory assignments, fonts, text clusters, Wingdings round-trip and empty states.');

const { halloweenFonts, halloweenPresets } = require('../lib/halloween-catalog.ts');
const { halloweenTextResults } = require('../lib/halloween-text.ts');
assert.equal(new Set(halloweenPresets.map((preset) => preset.id)).size, 24);
assert.equal(new Set(halloweenPresets.map((preset) => preset.font.id)).size, 12);
for (const font of halloweenFonts) {
  assert.ok(fonts.some((entry) => entry.id === font.id && entry.license === 'OFL-1.1'));
  const folder = `public/fonts/artwork/${font.id}`;
  const css = fs.readFileSync(`${folder}/400.css`, 'utf8');
  assert.ok(css.includes(`font-family: 'Artwork ${font.family}'`));
  assert.ok(fs.readFileSync(`${folder}/LICENSE.txt`, 'utf8').length > 500);
  for (const [, filename] of css.matchAll(/url\(\.\/files\/([^)]*)\)/g)) assert.ok(fs.statSync(`${folder}/files/${filename}`).size > 0);
}
const halloweenResults = halloweenTextResults('Boo\n\n中文 한글 العربية 👨‍👩‍👧‍👦 👍🏽 1️⃣');
assert.equal(new Set(halloweenResults.map((result) => result.id)).size, 24);
assert.equal(new Set(halloweenResults.map((result) => result.text)).size, 24);
for (const result of halloweenResults) {
  assert.ok(result.text.includes('\n\n'));
  assert.ok(result.text.includes('中文 한글 العربية 👨‍👩‍👧‍👦 👍🏽 1️⃣'));
  if (result.category === 'Glitch') assert.match(result.text, /[\u0300-\u036f]/u);
}
assert.deepEqual(halloweenTextResults('Boo'), halloweenTextResults('Boo'), 'Stable Halloween glitch outputs');
assert.equal(halloweenTextResults('Original spelling').at(-1).text, 'Original spelling');
for (const result of halloweenTextResults(' \n')) assert.equal(result.text, '');
console.log('Halloween regressions passed: 24 distinct designs, 12 licensed fonts, 24 distinct text styles, Unicode preservation and deterministic glitch marks.');
