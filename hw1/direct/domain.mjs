// Чистая логика трекера: без DOM, без побочных эффектов.

export const MIN_HOURS = 0.5;
export const MAX_HOURS = 24;
export const STEP = 0.5;

export function initialTasks() {
  return [
    { id: 1, title: 'Чтение', hours: 2, done: true },
    { id: 2, title: 'Практика', hours: 4, done: false },
    { id: 3, title: 'Повторение', hours: 2, done: false },
  ];
}

/** Разбор часов: допускает запятую. Пустое значение — не 0. Возвращает число или null. */
export function parseHours(raw) {
  const s = String(raw ?? '').trim();
  if (s === '' || !/^-?\d+([.,]\d+)?$/.test(s)) return null;
  return Number(s.replace(',', '.'));
}

/** Валидация формы. Возвращает { ok, errors: {title?, hours?}, value?: {title, hours} }. */
export function validateTask({ title, hours }) {
  const errors = {};
  const t = String(title ?? '').trim();
  if (t === '') errors.title = 'Введите название задачи.';

  const raw = String(hours ?? '').trim();
  const h = parseHours(raw);
  if (raw === '') {
    errors.hours = 'Укажите часы (от 0,5 до 24).';
  } else if (h === null) {
    errors.hours = 'Часы должны быть числом, например 1,5.';
  } else if (h < MIN_HOURS || h > MAX_HOURS) {
    errors.hours = 'Часы должны быть от 0,5 до 24.';
  } else if (!Number.isInteger(h / STEP)) {
    errors.hours = 'Шаг часов — 0,5 (например 1 или 1,5).';
  }

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, errors, value: { title: t, hours: h } };
}

export function nextId(tasks) {
  return tasks.reduce((m, t) => Math.max(m, t.id), 0) + 1;
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

/** Фильтр влияет только на видимый список. filter: 'all' | 'active' | 'done'. */
export function filterTasks(tasks, filter) {
  if (filter === 'active') return tasks.filter((t) => !t.done);
  if (filter === 'done') return tasks.filter((t) => t.done);
  return tasks;
}

/** Итоги всегда по всем задачам. */
export function summarize(tasks) {
  const totalHours = tasks.reduce((s, t) => s + t.hours, 0);
  const doneHours = tasks.reduce((s, t) => s + (t.done ? t.hours : 0), 0);
  const progress = totalHours > 0 ? Math.round((100 * doneHours) / totalHours) : 0;
  return { count: tasks.length, totalHours, doneHours, progress };
}
