export function readStored(key, fallback, validate = () => true) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const value = JSON.parse(raw);
    return validate(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

export function writeStored(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export const isStudyData = value => isRecord(value) && Object.values(value).every(entry =>
  isRecord(entry) && ['starred', 'mastered'].every(field =>
    Array.isArray(entry[field]) && entry[field].every(id => typeof id === 'string')));

export const isSets = value => Array.isArray(value) && value.every(set =>
  isRecord(set) && typeof set.id === 'string' && typeof set.title === 'string' &&
  Array.isArray(set.cards) && set.cards.length >= 2 &&
  new Set(set.cards.map(card => card?.id)).size === set.cards.length &&
  set.cards.every(card => isRecord(card) && typeof card.id === 'string' &&
    typeof card.term === 'string' && typeof card.definition === 'string'));
