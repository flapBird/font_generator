import assert from 'node:assert/strict';
import { test } from 'node:test';
import { toolDirectoryGroups } from '../../lib/tool-directory';
import { generatorRegistry } from '../../lib/generator-registry';
import { libraryPages } from '../../lib/text-library/catalog';

test('central directory covers every existing tool exactly once without changing registry order', () => {
  const entries = toolDirectoryGroups.flatMap((group) => group.entries);
  const paths = entries.map((entry) => entry.href);
  const expected = [...generatorRegistry.filter((tool) => tool.kind !== 'directory').map((tool) => tool.canonicalPath), ...libraryPages.map((page) => page.path)];
  assert.equal(new Set(paths).size, paths.length);
  assert.deepEqual(new Set(paths), new Set(expected));
  assert.ok(toolDirectoryGroups.find((group) => group.id === 'visual-art')!.entries.some((entry) => entry.href === '/signature-generator'));
  assert.ok(toolDirectoryGroups.find((group) => group.id === 'unicode-tools')!.entries.every((entry) => !entry.href.includes('small-text')));
});
