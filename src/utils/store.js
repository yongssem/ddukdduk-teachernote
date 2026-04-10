const STORAGE_KEY = 'ddukddak-gyodam-v1';

const TAG_PRESETS = {
  '우수': { color: '#A8E6CF', emoji: '⭐' },
  '참여': { color: '#B5DEFF', emoji: '🙋' },
  '성장': { color: '#FFE5A8', emoji: '🌱' },
  '소란': { color: '#FFB5A8', emoji: '⚠️' },
  '특이': { color: '#D4B5FF', emoji: '💡' },
};

const DEFAULT_DATA = {
  teacher: { subject: '', school: '' },
  tagSettings: {
    presets: { '우수': true, '참여': true, '성장': true, '소란': true, '특이': true },
    custom: [],
  },
  classes: [],
  lastBackupDate: null,
  firstRunDone: false,
};

export { TAG_PRESETS, DEFAULT_DATA };

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_DATA };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_DATA, ...parsed };
  } catch {
    return { ...DEFAULT_DATA };
  }
}

export function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearData() {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportBackupJSON(data) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const today = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `뚝딱교담수첩_백업_${today}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function getTagColor(tagName, tagSettings) {
  if (!tagName) return '#D1D5DB';
  if (TAG_PRESETS[tagName]) return TAG_PRESETS[tagName].color;
  const custom = tagSettings?.custom?.find(t => t.name === tagName);
  return custom?.color || '#E5E5E5';
}

export function getTagEmoji(tagName) {
  if (!tagName) return '';
  if (TAG_PRESETS[tagName]) return TAG_PRESETS[tagName].emoji;
  return '';
}

export function getAllActiveTags(tagSettings) {
  const tags = [];
  if (tagSettings?.presets) {
    for (const [name, enabled] of Object.entries(tagSettings.presets)) {
      if (enabled) tags.push({ name, color: TAG_PRESETS[name]?.color || '#E5E5E5', emoji: TAG_PRESETS[name]?.emoji || '' });
    }
  }
  if (tagSettings?.custom) {
    for (const t of tagSettings.custom) {
      tags.push({ name: t.name, color: t.color || '#E5E5E5', emoji: '' });
    }
  }
  return tags;
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const [, m, d] = dateStr.split('-');
  return `${parseInt(m)}/${parseInt(d)}`;
}

export function isIncognito() {
  return new Promise(resolve => {
    try {
      const test = 'ddukddak-test';
      localStorage.setItem(test, '1');
      localStorage.removeItem(test);
      resolve(false);
    } catch {
      resolve(true);
    }
  });
}

export function daysSinceLastBackup(data) {
  if (!data.lastBackupDate) return Infinity;
  const last = new Date(data.lastBackupDate);
  const now = new Date();
  return Math.floor((now - last) / (1000 * 60 * 60 * 24));
}
