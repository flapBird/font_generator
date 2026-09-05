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
