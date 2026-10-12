const ITERATIONS = 210000;
const hex = bytes => Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');

async function derive(password, salt, iterations) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, key, 256);
  return hex(new Uint8Array(bits));
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { salt: hex(salt), passwordHash: await derive(password, salt, ITERATIONS), iterations: ITERATIONS };
}

export async function verifyPassword(password, user) {
  if (typeof user.passwordHash !== 'string') return typeof user.password === 'string' && user.password === password;
  if (!/^[a-f0-9]{32}$/.test(user.salt) || user.iterations !== ITERATIONS) return false;
  const salt = Uint8Array.from(user.salt.match(/../g), byte => parseInt(byte, 16));
  return await derive(password, salt, user.iterations) === user.passwordHash;
}
