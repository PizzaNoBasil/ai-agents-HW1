import {
  initialTasks, validateTask, addTask, removeTask, toggleTask, filterTasks, summarize,
} from './domain.mjs';

const KEY = 'mini-tracker-tasks';
const $ = (id) => document.getElementById(id);
const fmt = (n) => String(n).replace('.', ',');

let storageOk = true;
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data;
    }
  } catch { storageOk = false; }
  return initialTasks();
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state.tasks)); }
  catch { storageOk = false; }
  const note = $('storage-note');
  note.hidden = storageOk;
  if (!storageOk) note.textContent = 'Хранилище браузера недоступно: задачи работают только в памяти и пропадут после перезагрузки.';
}

const state = { tasks: load(), filter: 'all' };

function render() {
  const s = summarize(state.tasks);
  $('count').textContent = s.count;
  $('total').textContent = fmt(s.totalHours);
  $('done-hours').textContent = fmt(s.doneHours);
  $('progress').textContent = s.progress + '%';
  $('bar').value = s.progress;

  const visible = filterTasks(state.tasks, state.filter);
  const list = $('list');
  list.replaceChildren();
  for (const t of visible) {
    const li = document.createElement('li');
    li.className = t.done ? 'done' : '';
    li.dataset.id = t.id;

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = t.done;
    cb.id = 'cb-' + t.id;
    cb.setAttribute('aria-label', 'Выполнено: ' + t.title);
    cb.addEventListener('change', () => { state.tasks = toggleTask(state.tasks, t.id); save(); render(); });

    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = `${t.title} — ${fmt(t.hours)} ч`;

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'del';
    del.textContent = 'Удалить';
    del.setAttribute('aria-label', 'Удалить задачу ' + t.title);
    del.addEventListener('click', () => { state.tasks = removeTask(state.tasks, t.id); save(); render(); });

    li.append(cb, name, del);
    list.append(li);
  }
  $('empty').hidden = visible.length > 0;

  document.querySelectorAll('[data-filter]').forEach((b) =>
    b.setAttribute('aria-pressed', String(b.dataset.filter === state.filter)));
}

function showErrors(errors) {
  for (const f of ['title', 'hours']) {
    $(f + '-error').textContent = errors[f] || '';
    $(f).setAttribute('aria-invalid', errors[f] ? 'true' : 'false');
  }
}

$('add-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const r = validateTask({ title: $('title').value, hours: $('hours').value });
  showErrors(r.errors);
  if (!r.ok) return; // значения в полях остаются для исправления
  state.tasks = addTask(state.tasks, r.value);
  $('title').value = '';
  $('hours').value = '';
  save();
  render();
});

document.querySelectorAll('[data-filter]').forEach((b) =>
  b.addEventListener('click', () => { state.filter = b.dataset.filter; render(); }));

save();
render();
