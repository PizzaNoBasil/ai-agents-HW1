import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  initialTasks, summarize, toggleTask, filterTasks, validateTask, addTask, removeTask,
} from '../domain.mjs';

const byTitle = (tasks, title) => tasks.find((t) => t.title === title);

test('T1: исходный пример — 3 задачи, 8 ч, 2 ч выполнено, 25% (не 1/3)', () => {
  const tasks = initialTasks();
  const s = summarize(tasks);
  assert.equal(s.count, 3);
  assert.equal(s.totalHours, 8);
  assert.equal(s.doneHours, 2);
  assert.equal(s.progress, 25);
  assert.notEqual(s.progress, Math.round(100 / 3));
});

test('T2: «Практика» готова — 6 из 8 ч, 75%; данные изменились', () => {
  const before = initialTasks();
  const after = toggleTask(before, byTitle(before, 'Практика').id);
  const s = summarize(after);
  assert.equal(s.doneHours, 6);
  assert.equal(s.totalHours, 8);
  assert.equal(s.progress, 75);
  assert.equal(byTitle(after, 'Практика').done, true);
  assert.equal(byTitle(before, 'Практика').done, false); // исходный массив не мутирован
});

test('T3: фильтр «активные» — только Практика и Повторение, прогресс остаётся 25%', () => {
  const tasks = initialTasks();
  const visible = filterTasks(tasks, 'active');
  assert.deepEqual(visible.map((t) => t.title), ['Практика', 'Повторение']);
  assert.equal(summarize(tasks).progress, 25);
  assert.equal(summarize(tasks).totalHours, 8);
  assert.equal(filterTasks(tasks, 'all').length, 3);
  assert.deepEqual(filterTasks(tasks, 'done').map((t) => t.title), ['Чтение']);
});

test('T4: ошибки ввода', () => {
  const bad = [
    { title: '', hours: '2' },
    { title: '   ', hours: '2' },
    { title: 'Х', hours: '' },
    { title: 'Х', hours: '   ' },
    { title: 'Х', hours: '-1' },
    { title: 'Х', hours: '0' },
    { title: 'Х', hours: '0,4' },
    { title: 'Х', hours: '24,5' },
    { title: 'Х', hours: '1,3' },
    { title: 'Х', hours: 'abc' },
  ];
  for (const input of bad) {
    const r = validateTask(input);
    assert.equal(r.ok, false, JSON.stringify(input));
    assert.ok(Object.keys(r.errors).length > 0);
  }
  assert.ok(validateTask({ title: '', hours: '2' }).errors.title);
  assert.ok(validateTask({ title: 'Х', hours: '' }).errors.hours);

  // Некорректная задача не добавляется (UI не вызывает addTask при ok=false).
  const tasks = initialTasks();
  assert.equal(validateTask({ title: '', hours: '' }).value, undefined);
  assert.equal(tasks.length, 3);

  // Границы и шаг
  for (const h of ['0.5', '0,5', '1', '1,5', '24']) {
    assert.equal(validateTask({ title: 'Х', hours: h }).ok, true, h);
  }
  const ok = validateTask({ title: '  Новая  ', hours: '1,5' });
  assert.deepEqual(ok.value, { title: 'Новая', hours: 1.5 });
  const added = addTask(tasks, ok.value);
  assert.equal(added.length, 4);
  assert.equal(added[3].done, false);
});

test('T5: пустое состояние — 0 ч, 0%, без NaN/Infinity', () => {
  let tasks = initialTasks();
  for (const t of initialTasks()) tasks = removeTask(tasks, t.id);
  const s = summarize(tasks);
  assert.deepEqual(s, { count: 0, totalHours: 0, doneHours: 0, progress: 0 });
  for (const v of Object.values(s)) assert.ok(Number.isFinite(v));
  assert.equal(filterTasks(tasks, 'active').length, 0);
  // после пустого состояния добавление продолжает работать
  const again = addTask(tasks, { title: 'Новая', hours: 2 });
  assert.equal(summarize(again).totalHours, 2);
});
