import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../src/utils/password.js';

test('salted credentials verify the correct password and reject incorrect passwords', async () => {
  const first = await hashPassword('example password');
  const second = await hashPassword('example password');
  assert.notEqual(first.salt, second.salt);
  assert.notEqual(first.passwordHash, second.passwordHash);
  assert.equal(Object.hasOwn(first, 'password'), false);
  assert.equal(await verifyPassword('example password', first), true);
  assert.equal(await verifyPassword('incorrect', first), false);
});

test('legacy credentials remain usable for migration', async () => {
  const legacy = { username: 'test', password: 'legacy password' };
  assert.equal(await verifyPassword('legacy password', legacy), true);
  assert.equal(await verifyPassword('incorrect', legacy), false);
  const migrated = { ...legacy, ...await hashPassword(legacy.password) };
  delete migrated.password;
  assert.equal(await verifyPassword('legacy password', migrated), true);
  assert.equal(Object.hasOwn(migrated, 'password'), false);
});

test('malformed credentials fail verification', async () => {
  assert.equal(await verifyPassword('password', {}), false);
  assert.equal(await verifyPassword('password', { passwordHash: 'invalid', salt: 'bad' }), false);
});
