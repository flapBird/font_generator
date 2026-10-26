/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness installs the TypeScript require hook for pure-function regression tests. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
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
