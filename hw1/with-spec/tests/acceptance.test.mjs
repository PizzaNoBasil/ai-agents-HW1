import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialTasks, parseHours, validateTask, computeSummary,
  filterTasks, addTask, removeTask, toggleTask, sanitizeTasks,
} from '../domain.mjs';

const byTitle = (tasks, title) => tasks.find((t) => t.title === title);

test('T1: исходный пример — 3 задачи, 8 ч, 2 ч, 25% по часам', () => {
  const tasks = createInitialTasks();
  assert.equal(tasks.length, 3);
  assert.deepEqual(computeSummary(tasks), { totalHours: 8, doneHours: 2, progress: 25 });
});

test('T2: «Практика» готова — 6 из 8 ч, 75%, данные изменились без мутации', () => {
  const before = createInitialTasks();
  const practice = byTitle(before, 'Практика');
  const after = toggleTask(before, practice.id);
  assert.equal(byTitle(after, 'Практика').done, true);
  assert.equal(practice.done, false, 'исходный массив не мутируется');
  assert.deepEqual(computeSummary(after), { totalHours: 8, doneHours: 6, progress: 75 });
});

test('переключение done обратно возвращает 25%', () => {
  const id = byTitle(createInitialTasks(), 'Практика').id;
  const back = toggleTask(toggleTask(createInitialTasks(), id), id);
  assert.equal(computeSummary(back).progress, 25);
});

test('T3: фильтр «активные» меняет список, но не итоги и прогресс', () => {
  const tasks = createInitialTasks();
  const active = filterTasks(tasks, 'active');
  assert.deepEqual(active.map((t) => t.title), ['Практика', 'Повторение']);
  assert.deepEqual(filterTasks(tasks, 'done').map((t) => t.title), ['Чтение']);
  assert.equal(filterTasks(tasks, 'all').length, 3);
  assert.equal(computeSummary(tasks).progress, 25);
  assert.equal(computeSummary(tasks).totalHours, 8);
  // Итоги по отфильтрованному списку отличались бы — они не должны быть базой.
  assert.notEqual(computeSummary(active).progress, 25);
});

test('округление: 2 из 6 ч — 33%', () => {
  const tasks = removeTask(createInitialTasks(), byTitle(createInitialTasks(), 'Повторение').id);
  assert.deepEqual(computeSummary(tasks), { totalHours: 6, doneHours: 2, progress: 33 });
});

test('T4: пустое название и пробелы не проходят, ошибка относится к названию', () => {
  for (const title of ['', '   ', '\t\n']) {
    const r = validateTask({ title, hours: '2' });
    assert.equal(r.ok, false);
    assert.ok(r.errors.title);
    assert.equal(r.errors.hours, undefined);
  }
});

test('T4: пустые, пробельные и отрицательные часы не проходят', () => {
  for (const hours of ['', '   ', '-1', '-0,5', '0', null, undefined]) {
    const r = validateTask({ title: 'Эссе', hours });
    assert.equal(r.ok, false, `hours=${JSON.stringify(hours)}`);
    assert.ok(r.errors.hours);
    assert.equal(r.errors.title, undefined);
  }
});

test('пустое значение часов не равно нулю', () => {
  assert.equal(parseHours('').ok, false);
  assert.equal(parseHours('0').ok, false);
  assert.notEqual(parseHours('').error, parseHours('0').error);
});

test('T4: границы 0,5–24 и шаг 0,5', () => {
  for (const ok of ['0.5', '0,5', '1', '1,5', '23.5', '24', ' 3 ']) {
    assert.equal(parseHours(ok).ok, true, ok);
  }
  for (const bad of ['0,4', '0.49', '24,5', '25', '1,3', '0,75', '2.25', 'abc', '1e1', '1,2,3', '--1']) {
    assert.equal(parseHours(bad).ok, false, bad);
  }
  assert.equal(parseHours('2,5').value, 2.5);
});

test('валидная форма: название обрезается, часы — число', () => {
  const r = validateTask({ title: '  Эссе  ', hours: '1,5' });
  assert.equal(r.ok, true);
  assert.deepEqual(r.value, { title: 'Эссе', hours: 1.5 });
});

test('обе ошибки возвращаются вместе', () => {
  const r = validateTask({ title: '', hours: '' });
  assert.ok(r.errors.title && r.errors.hours);
});

test('добавление: новая задача активна, id уникален, итоги пересчитаны', () => {
  const tasks = addTask(createInitialTasks(), { title: 'Эссе', hours: 3 });
  assert.equal(tasks.length, 4);
  assert.equal(new Set(tasks.map((t) => t.id)).size, 4);
  assert.equal(byTitle(tasks, 'Эссе').done, false);
  assert.deepEqual(computeSummary(tasks), { totalHours: 11, doneHours: 2, progress: 18 });
});

test('id не повторяется после удаления последней задачи', () => {
  let tasks = createInitialTasks();
  tasks = removeTask(tasks, 3);
  tasks = addTask(tasks, { title: 'Новая', hours: 1 });
  assert.equal(new Set(tasks.map((t) => t.id)).size, tasks.length);
});

test('T5: все задачи удалены — 0 ч, 0%, без NaN и Infinity', () => {
  let tasks = createInitialTasks();
  for (const t of createInitialTasks()) tasks = removeTask(tasks, t.id);
  assert.equal(tasks.length, 0);
  const s = computeSummary(tasks);
  assert.deepEqual(s, { totalHours: 0, doneHours: 0, progress: 0 });
  for (const v of Object.values(s)) assert.ok(Number.isFinite(v));
  assert.deepEqual(filterTasks(tasks, 'active'), []);
});

test('T5: после опустошения добавление работает', () => {
  const tasks = addTask([], { title: 'Одна', hours: 2 });
  assert.deepEqual(computeSummary(tasks), { totalHours: 2, doneHours: 0, progress: 0 });
});

test('sanitizeTasks отвергает повреждённые данные', () => {
  assert.deepEqual(sanitizeTasks(createInitialTasks()), createInitialTasks());
  assert.equal(sanitizeTasks(null), null);
  assert.equal(sanitizeTasks('x'), null);
  assert.equal(sanitizeTasks([{ id: 1, title: '', hours: 1, done: false }]), null);
  assert.equal(sanitizeTasks([{ id: 1, title: 'a', hours: 99, done: false }]), null);
  assert.equal(sanitizeTasks([{ id: 1, title: 'a', hours: 1, done: 'no' }]), null);
  assert.deepEqual(sanitizeTasks([]), []);
});
