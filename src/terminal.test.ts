import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCommand, completeCommand, navigateHistory } from './terminal.ts';
test('normalizes mixed-case commands and whitespace without losing the original echo', () => {
  assert.deepEqual(parseCommand('  ThEmE   ICE  '), {
    command: 'theme',
    args: 'ice',
    raw: 'ThEmE   ICE',
  });
});
test('prototype names and HTML input never resolve as commands; oversized input is bounded', () => {
  for (const input of [
    'constructor',
    '__proto__',
    '<img src=x onerror=alert(1)>',
  ])
    assert.equal(parseCommand(input).command, 'unknown');
  assert.equal(parseCommand('x'.repeat(1000)).raw.length, 500);
});
test('ambiguous or empty completion does not trap Tab; unique prefixes complete', () => {
  assert.equal(completeCommand(''), '');
  assert.equal(completeCommand('co'), 'contact');
  assert.equal(completeCommand('b'), 'b');
  assert.equal(completeCommand('nope'), 'nope');
});
test('history stops at either boundary and restores the unfinished draft', () => {
  assert.deepEqual(navigateHistory([], 0, 'up', 'draft'), {
    cursor: 0,
    value: 'draft',
  });
  assert.deepEqual(navigateHistory(['about', 'work'], 0, 'up', 'draft'), {
    cursor: 0,
    value: 'about',
  });
  assert.deepEqual(navigateHistory(['about', 'work'], 1, 'down', 'draft'), {
    cursor: 2,
    value: 'draft',
  });
  assert.deepEqual(navigateHistory(['about', 'work'], 2, 'down', 'draft'), {
    cursor: 2,
    value: 'draft',
  });
});
