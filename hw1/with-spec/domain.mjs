// Чистая бизнес-логика мини-трекера. Без DOM и побочных эффектов.

export const MIN_HOURS = 0.5;
export const MAX_HOURS = 24;
export const STEP_HOURS = 0.5;

export const FILTERS = ['all', 'active', 'done'];

export function createInitialTasks() {
  return [
    { id: 1, title: 'Чтение', hours: 2, done: true },
    { id: 2, title: 'Практика', hours: 4, done: false },
    { id: 3, title: 'Повторение', hours: 2, done: false },
  ];
}

export const TITLE_ERROR = 'Введите название задачи.';
export const HOURS_EMPTY_ERROR = 'Введите часы, например 1 или 2,5.';
export const HOURS_FORMAT_ERROR = 'Часы должны быть числом, например 1 или 2,5.';
export const HOURS_RANGE_ERROR = 'Часы должны быть от 0,5 до 24.';
export const HOURS_STEP_ERROR = 'Часы указываются с шагом 0,5.';

// Возвращает { ok: true, value } или { ok: false, error }.
// Пустое значение не превращается в 0.
export function parseHours(raw) {
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw)) return { ok: false, error: HOURS_FORMAT_ERROR };
    return checkRange(raw);
  }
  const text = String(raw ?? '').trim().replace(',', '.');
  if (text === '') return { ok: false, error: HOURS_EMPTY_ERROR };
  // Отрицательные значения и нечисловой ввод не проходят формат.
  if (!/^\d+(\.\d+)?$/.test(text)) {
    return { ok: false, error: /^-\d+(\.\d+)?$/.test(text) ? HOURS_RANGE_ERROR : HOURS_FORMAT_ERROR };
  }
  return checkRange(Number(text));
}

function checkRange(n) {
  if (n < MIN_HOURS || n > MAX_HOURS) return { ok: false, error: HOURS_RANGE_ERROR };
  if (!Number.isInteger(n / STEP_HOURS)) return { ok: false, error: HOURS_STEP_ERROR };
  return { ok: true, value: n };
}

// Проверяет ввод формы. При успехе возвращает value с обрезанным названием.
export function validateTask({ title, hours }) {
  const errors = {};
  const trimmed = String(title ?? '').trim();
  if (trimmed === '') errors.title = TITLE_ERROR;
  const parsed = parseHours(hours);
  if (!parsed.ok) errors.hours = parsed.error;
  if (errors.title || errors.hours) return { ok: false, errors };
  return { ok: true, errors: {}, value: { title: trimmed, hours: parsed.value } };
}

// Итоги всегда считаются по всем задачам.
export function computeSummary(tasks) {
  let totalHours = 0;
  let doneHours = 0;
  for (const t of tasks) {
    totalHours += t.hours;
    if (t.done) doneHours += t.hours;
  }
  const progress = totalHours > 0 ? Math.round((100 * doneHours) / totalHours) : 0;
  return { totalHours, doneHours, progress };
}

// Влияет только на видимый список.
export function filterTasks(tasks, filter) {
  if (filter === 'active') return tasks.filter((t) => !t.done);
  if (filter === 'done') return tasks.filter((t) => t.done);
  return tasks.slice();
}

export function nextId(tasks) {
  return tasks.reduce((max, t) => Math.max(max, t.id), 0) + 1;
}

export function addTask(tasks, { title, hours }) {
  return [...tasks, { id: nextId(tasks), title, hours, done: false }];
}

export function removeTask(tasks, id) {
  return tasks.filter((t) => t.id !== id);
}

export function toggleTask(tasks, id) {
  return tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
}

// Для сообщений интерфейса: 2 -> «2», 2.5 -> «2,5».
export function formatHours(n) {
  return String(n).replace('.', ',');
}

// Проверка данных, прочитанных из хранилища.
export function sanitizeTasks(data) {
  if (!Array.isArray(data)) return null;
  const out = [];
  const seen = new Set();
  for (const t of data) {
    if (
      !t || typeof t !== 'object' ||
      !Number.isInteger(t.id) || seen.has(t.id) ||
      typeof t.title !== 'string' || t.title.trim() === '' ||
      typeof t.hours !== 'number' || !checkRange(t.hours).ok ||
      typeof t.done !== 'boolean'
    ) return null;
    seen.add(t.id);
    out.push({ id: t.id, title: t.title, hours: t.hours, done: t.done });
  }
  return out;
}
