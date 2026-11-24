import {
  createInitialTasks, validateTask, computeSummary, filterTasks,
  addTask, removeTask, toggleTask, formatHours, sanitizeTasks,
} from './domain.mjs';

const STORAGE_KEY = 'mini-tracker.tasks.v1';
const FILTER_LABELS = { all: 'все', active: 'активные', done: 'выполненные' };

const $ = (id) => document.getElementById(id);
const els = {
  form: $('task-form'),
  title: $('title-input'),
  hours: $('hours-input'),
  titleError: $('title-error'),
  hoursError: $('hours-error'),
  summaryText: $('summary-text'),
  progressValue: $('progress-value'),
  progressBar: $('progress-bar'),
  progressFill: $('progress-fill'),
  list: $('task-list'),
  empty: $('empty-message'),
  storage: $('storage-status'),
  filters: document.querySelectorAll('[data-filter]'),
};

// ---- Хранилище (необязательное): любые сбои не ломают работу в памяти ----

function showStorageNotice(text) {
  els.storage.textContent = text;
  els.storage.hidden = false;
}

function loadTasks() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return createInitialTasks();
    const tasks = sanitizeTasks(JSON.parse(raw));
    if (tasks === null) {
      showStorageNotice('Сохранённые данные повреждены, показан стартовый набор задач.');
      return createInitialTasks();
    }
    return tasks;
  } catch {
    showStorageNotice('Хранилище браузера недоступно: данные не сохранятся между запусками, но приложение работает.');
    return createInitialTasks();
  }
}

function saveTasks(tasks) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    showStorageNotice('Не удалось сохранить данные: они останутся только до закрытия страницы.');
  }
}

// ---- Состояние ----

const state = {
  tasks: loadTasks(),
  filter: 'all',
};

function commit(tasks) {
  state.tasks = tasks;
  saveTasks(tasks);
  render();
}

// ---- Рендер ----

function setFieldError(input, errorEl, message) {
  if (message) {
    errorEl.textContent = message;
    errorEl.hidden = false;
    input.setAttribute('aria-invalid', 'true');
  } else {
    errorEl.textContent = '';
    errorEl.hidden = true;
    input.removeAttribute('aria-invalid');
  }
}

function renderSummary() {
  // Итоги — всегда по всем задачам, независимо от фильтра.
  const { totalHours, doneHours, progress } = computeSummary(state.tasks);
  els.summaryText.textContent =
    `Выполнено ${formatHours(doneHours)} из ${formatHours(totalHours)} ч · задач: ${state.tasks.length}`;
  els.progressValue.textContent = `${progress}%`;
  els.progressFill.style.width = `${progress}%`;
  els.progressBar.setAttribute('aria-valuenow', String(progress));
  els.progressBar.setAttribute('aria-valuetext', `${progress}%`);
}

function renderFilters() {
  for (const btn of els.filters) {
    btn.setAttribute('aria-pressed', String(btn.dataset.filter === state.filter));
  }
}

function button(text, label, onClick, extraClass) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = text;
  b.setAttribute('aria-label', label);
  if (extraClass) b.className = extraClass;
  b.addEventListener('click', onClick);
  return b;
}

function renderList() {
  const visible = filterTasks(state.tasks, state.filter);
  els.list.replaceChildren();

  for (const task of visible) {
    const li = document.createElement('li');
    li.className = 'task' + (task.done ? ' is-done' : '');

    const main = document.createElement('div');
    main.className = 'task-main';
    const title = document.createElement('div');
    title.className = 'task-title';
    title.textContent = task.title;
    const meta = document.createElement('div');
    meta.className = 'task-meta';
    meta.textContent = `${formatHours(task.hours)} ч · ${task.done ? 'Готово' : 'Активно'}`;
    main.append(title, meta);

    const actions = document.createElement('div');
    actions.className = 'task-actions';
    actions.append(
      button(
        task.done ? 'Вернуть в активные' : 'Отметить готовой',
        `${task.done ? 'Вернуть в активные' : 'Отметить готовой'}: ${task.title}`,
        () => commit(toggleTask(state.tasks, task.id)),
      ),
      button('Удалить', `Удалить задачу: ${task.title}`,
        () => commit(removeTask(state.tasks, task.id)), 'danger'),
    );

    li.append(main, actions);
    els.list.append(li);
  }

  if (state.tasks.length === 0) {
    els.empty.textContent = 'Задач нет. Добавьте первую в форме выше.';
    els.empty.hidden = false;
  } else if (visible.length === 0) {
    els.empty.textContent = `В фильтре «${FILTER_LABELS[state.filter]}» задач нет.`;
    els.empty.hidden = false;
  } else {
    els.empty.hidden = true;
  }
}

function render() {
  renderSummary();
  renderFilters();
  renderList();
}

// ---- События ----

els.form.addEventListener('submit', (event) => {
  event.preventDefault();
  const result = validateTask({ title: els.title.value, hours: els.hours.value });
  setFieldError(els.title, els.titleError, result.errors.title);
  setFieldError(els.hours, els.hoursError, result.errors.hours);

  if (!result.ok) {
    // Значения полей остаются для исправления; фокус — на первое неверное поле.
    (result.errors.title ? els.title : els.hours).focus();
    return;
  }

  commit(addTask(state.tasks, result.value));
  els.form.reset();
  els.title.focus();
});

for (const btn of els.filters) {
  btn.addEventListener('click', () => {
    state.filter = btn.dataset.filter;
    render();
  });
}

render();
