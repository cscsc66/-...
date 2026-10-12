import { afterEach, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { readStored, writeStored, isSets, isStudyData } from '../src/utils/storage.js';

beforeEach(() => {
  const data = new Map();
  globalThis.localStorage = {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: key => data.delete(key),
  };
});
afterEach(() => { delete globalThis.localStorage; });

test('invalid JSON and invalid saved structures fall back without breaking startup', () => {
  const fallback = [];
  for (const raw of ['{broken', 'null', '{}', '[{"id":"invalid"}]']) {
    localStorage.setItem('sets', raw);
    assert.equal(readStored('sets', fallback, isSets), fallback);
  }
  localStorage.setItem('study', '{"set":{"starred":[],"mastered":null}}');
  assert.deepEqual(readStored('study', {}, isStudyData), {});
});

test('valid sets survive saving and reloading', () => {
  const sets = [{ id: 'set', title: 'Words', cards: [
    { id: 'a', term: 'Apple', definition: 'Яблуко' },
    { id: 'b', term: 'Cat', definition: 'Кіт' },
  ] }];
  assert.equal(writeStored('sets', sets), true);
  assert.deepEqual(readStored('sets', [], isSets), sets);
  assert.equal(isSets([{ ...sets[0], cards: [sets[0].cards[0], sets[0].cards[0]] }]), false);
});

test('blocked browser storage does not throw during reads or writes', () => {
  globalThis.localStorage = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); },
    removeItem() { throw new Error('blocked'); },
  };
  assert.equal(readStored('user', null), null);
  assert.equal(writeStored('user', { username: 'test' }), false);
  assert.equal(writeStored('user', null), false);
});
