# Spec Delta

## Purpose

Мини-трекер учебных задач на неделю: пользователь ведёт список задач с часами, отмечает выполненные и видит итоги и прогресс по часам. Работает автономно в браузере без внешних зависимостей.

## ADDED Requirements

### Requirement: Initial task set
The system SHALL at startup present three tasks: «Чтение» — 2 ч, done; «Практика» — 4 ч, not done; «Повторение» — 2 ч, not done. Each task has id, title, hours and done.

#### Scenario: Initial example
- **WHEN** приложение открыто в первый раз
- **THEN** в списке 3 задачи, всего 8 ч, выполнено 2 ч, прогресс 25%
- **AND** «Чтение» отображается как готовая, остальные как активные

### Requirement: Add task
The system SHALL add a task with a valid title and hours to the data and to the visible list, as not done, with a unique id.

#### Scenario: Valid task added
- **WHEN** введено название «Эссе» и часы 3 и форма отправлена
- **THEN** задача появляется в списке, всего становится 11 ч, прогресс пересчитан
- **AND** поля формы очищены

### Requirement: Delete task
The system SHALL remove a task from the data and the list when the user deletes it, and recalculate totals and progress.

#### Scenario: Delete one task
- **WHEN** удалена задача «Повторение» (2 ч, активна) из исходного набора
- **THEN** в списке 2 задачи, всего 6 ч, выполнено 2 ч, прогресс 33%

### Requirement: Toggle done
The system SHALL toggle the done state of a task on user action, changing both the data and the interface.

#### Scenario: Mark Practice done
- **WHEN** «Практика» отмечена выполненной в исходном наборе
- **THEN** выполнено 6 из 8 ч, прогресс 75%
- **AND** строка «Практика» отображается как готовая

#### Scenario: Unmark task
- **WHEN** выполненная задача отмечена снова
- **THEN** она становится активной, итоги и прогресс пересчитаны

### Requirement: Title validation
The system SHALL reject a title that is empty or consists only of whitespace after trim, and SHALL store the trimmed title for valid input.

#### Scenario: Empty title
- **WHEN** название пустое и форма отправлена
- **THEN** задача не добавляется
- **AND** рядом с полем названия видна ошибка, введённые значения полей сохранены

#### Scenario: Whitespace-only title
- **WHEN** название состоит только из пробелов
- **THEN** задача не добавляется и рядом с полем названия видна ошибка

#### Scenario: Title with surrounding spaces
- **WHEN** название «  Эссе  » и часы 1
- **THEN** задача добавляется с названием «Эссе»

### Requirement: Hours validation
The system SHALL accept hours only as a number from 0.5 to 24 inclusive in steps of 0.5. An empty value SHALL NOT be treated as zero. Both a dot and a comma SHALL be accepted as the decimal separator.

#### Scenario: Empty hours
- **WHEN** поле часов пустое
- **THEN** задача не добавляется, рядом с полем часов видна ошибка, значения сохранены

#### Scenario: Zero and negative hours
- **WHEN** введено 0 или -1
- **THEN** задача не добавляется и рядом с полем часов видна ошибка

#### Scenario: Valid boundaries
- **WHEN** введено 0,5 или 24
- **THEN** задача добавляется

#### Scenario: Out of range
- **WHEN** введено 0,4 или 24,5
- **THEN** задача не добавляется и видна ошибка

#### Scenario: Step not multiple of 0.5
- **WHEN** введено 1,3
- **THEN** задача не добавляется и видна ошибка

#### Scenario: Non-numeric hours
- **WHEN** введено «abc»
- **THEN** задача не добавляется и видна ошибка

### Requirement: Error display and form retention
The system SHALL show each validation error adjacent to the offending field, in text that explains how to fix it, and SHALL keep the entered values in the form until the task is added successfully. An error SHALL disappear after a valid submission.

#### Scenario: Both fields invalid
- **WHEN** название пустое и часы пустые
- **THEN** ошибки видны рядом с обоими полями

#### Scenario: Correction after error
- **WHEN** после ошибки пользователь исправляет значения и отправляет форму
- **THEN** задача добавляется, ошибки скрыты

### Requirement: Progress calculation
The system SHALL compute progress as round(100 × sum of hours of done tasks / sum of hours of all tasks), by hours and not by task count. If there are no tasks, progress SHALL be 0% and no NaN or Infinity SHALL be shown.

#### Scenario: Hours, not count
- **WHEN** открыт исходный набор
- **THEN** прогресс 25%, а не 33% (1/3 по числу задач)

#### Scenario: Rounding
- **WHEN** всего 6 ч, выполнено 2 ч
- **THEN** прогресс 33%

### Requirement: Summary totals
The system SHALL display total hours, completed hours and progress for all tasks.

#### Scenario: Totals after toggle
- **WHEN** «Практика» отмечена выполненной
- **THEN** сводка показывает «6 из 8 ч» и 75%

### Requirement: Filter
The system SHALL offer filters «все», «активные», «выполненные» which restrict only the visible list. Totals and progress SHALL always be computed over all tasks.

#### Scenario: Active filter
- **WHEN** в исходном наборе выбран фильтр «активные»
- **THEN** в списке только «Практика» и «Повторение»
- **AND** итог 8 ч и прогресс 25% не меняются

#### Scenario: Done filter
- **WHEN** выбран фильтр «выполненные»
- **THEN** в списке только «Чтение», прогресс остаётся 25%

#### Scenario: Filter with changes
- **WHEN** фильтр «активные» включён и «Практика» отмечена выполненной
- **THEN** «Практика» пропадает из списка, прогресс 75%

#### Scenario: Empty filtered list
- **WHEN** выбранный фильтр не даёт ни одной задачи
- **THEN** показывается понятное сообщение о пустом списке, итоги не меняются

### Requirement: Empty state
The system SHALL keep working when all tasks are deleted: total 0 ч, completed 0 ч, progress 0%, a friendly empty-list message, and the add form still functional.

#### Scenario: Delete all
- **WHEN** удалены все задачи
- **THEN** итог 0 ч, прогресс 0%, нет NaN и Infinity

#### Scenario: Add after empty
- **WHEN** после удаления всех задач добавлена задача 2 ч
- **THEN** всего 2 ч, прогресс 0%

### Requirement: Accessibility and narrow screen
The system SHALL be readable at a viewport width of 390 px without horizontal scrolling, and every input and button SHALL have a visible or accessible text label.

#### Scenario: 390 px
- **WHEN** страница открыта при ширине 390 px
- **THEN** горизонтального скролла нет, форма, список и сводка читаемы

#### Scenario: Labels
- **WHEN** пользователь просматривает поля и кнопки
- **THEN** у полей названия и часов есть подписи, у кнопок удаления и переключения — понятные имена с названием задачи

### Requirement: Optional persistence
The system MAY persist tasks in localStorage. If persistence is implemented and the storage is unavailable or fails, the system SHALL show an understandable message and continue working in memory.

#### Scenario: Reload with storage
- **WHEN** хранилище доступно, задача добавлена и страница перезагружена
- **THEN** задачи восстановлены

#### Scenario: Storage unavailable
- **WHEN** localStorage недоступен или выбрасывает ошибку
- **THEN** показано сообщение, что данные не сохранятся между перезапусками
- **AND** все остальные функции работают в памяти
