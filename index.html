<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Трекер привычек</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <main class="shell">
      <section class="app-header">
        <div>
          <p class="eyebrow">Личный ритм</p>
          <h1>Трекер привычек</h1>
        </div>
        <div class="today-card" aria-label="Сегодняшняя дата">
          <span id="todayWeekday"></span>
          <strong id="todayDate"></strong>
        </div>
      </section>

      <section class="toolbar" aria-label="Действия">
        <button class="primary-button add-habit-button" id="openHabitDialog" type="button">
          + Добавить привычку
        </button>
      </section>

      <section class="workspace" aria-label="Рабочая область трекера привычек">
        <dialog class="modal" id="habitDialog">
          <form class="habit-form" id="habitForm" method="dialog">
            <div class="form-heading">
              <div>
                <h2>Новая привычка</h2>
                <p>Выберите срок и отмечайте выполнение каждый день.</p>
              </div>
              <button class="icon-button close-button" id="closeHabitDialog" type="button" title="Закрыть">
                <span aria-hidden="true">×</span>
              </button>
            </div>

            <label>
              Название
              <input
                id="habitName"
                name="habitName"
                type="text"
                maxlength="48"
                placeholder="Например: зарядка"
                autocomplete="off"
                required
              />
            </label>

            <label>
              Период
              <select id="habitPeriod" name="habitPeriod">
                <option value="7">Неделя</option>
                <option value="30" selected>Месяц</option>
                <option value="90">3 месяца</option>
                <option value="365">Год</option>
                <option value="custom">Заданный период</option>
              </select>
            </label>

            <div class="date-row">
              <label>
                Дата старта
                <input id="habitStart" name="habitStart" type="date" required />
              </label>

              <label>
                Дата окончания
                <input id="habitEnd" name="habitEnd" type="date" required />
              </label>
            </div>

            <label>
              Цвет
              <div class="color-row" role="radiogroup" aria-label="Цвет привычки">
                <input type="radio" id="colorSky" name="habitColor" value="#2f8ecf" />
                <label class="color-swatch sky" for="colorSky" title="Голубой"></label>

                <input type="radio" id="colorRed" name="habitColor" value="#d94a3f" />
                <label class="color-swatch red" for="colorRed" title="Красный"></label>

                <input type="radio" id="colorGreen" name="habitColor" value="#2e7d5b" checked />
                <label class="color-swatch green" for="colorGreen" title="Зелёный"></label>

                <input type="radio" id="colorBeige" name="habitColor" value="#b8874a" />
                <label class="color-swatch beige" for="colorBeige" title="Бежевый"></label>

                <input type="radio" id="colorIndigo" name="habitColor" value="#5b5fc7" />
                <label class="color-swatch indigo" for="colorIndigo" title="Индиго"></label>
              </div>
            </label>

            <p class="form-error" id="formError" role="alert"></p>

            <button class="primary-button" type="submit">Добавить привычку</button>
          </form>
        </dialog>

        <section class="habit-panel" aria-live="polite">
          <div class="panel-top">
            <div>
              <h2>Мои привычки</h2>
              <p id="summaryText"></p>
            </div>
            <div class="panel-actions">
              <button class="ghost-button" id="exportButton" type="button" title="Экспортировать шаблон">
                Экспорт
              </button>
              <button class="ghost-button" id="clearDoneButton" type="button" title="Удалить завершённые">
                Очистить завершённые
              </button>
            </div>
          </div>

          <div class="empty-state" id="emptyState">
            <div class="empty-mark">✓</div>
            <h3>Добавьте первую привычку</h3>
            <p>После добавления здесь появится шкала дней и отметки выполнения.</p>
          </div>

          <div class="habit-list" id="habitList"></div>
        </section>
      </section>
    </main>

    <dialog class="modal confirm-modal" id="deleteDialog">
      <form class="confirm-box" method="dialog">
        <h2>Удалить привычку?</h2>
        <p id="deleteDialogText"></p>
        <div class="modal-actions">
          <button class="ghost-button" id="cancelDeleteButton" type="button">Отмена</button>
          <button class="danger-button" id="confirmDeleteButton" type="button">Удалить</button>
        </div>
      </form>
    </dialog>

    <dialog class="modal export-modal" id="exportDialog">
      <form class="confirm-box" id="exportForm" method="dialog">
        <h2>Экспорт привычек</h2>
        <label>
          Заголовок
          <input id="exportTitle" type="text" value="План привычек" maxlength="80" />
        </label>
        <div class="modal-actions">
          <button class="ghost-button" id="cancelExportButton" type="button">Отмена</button>
          <button class="primary-button" type="submit">Открыть шаблон</button>
        </div>
      </form>
    </dialog>

    <template id="habitTemplate">
      <article class="habit-card">
        <div class="habit-accent"></div>
        <div class="habit-main">
          <div class="habit-info">
            <div>
              <h3 class="habit-title"></h3>
              <div class="habit-period-control">
                <button class="habit-meta" type="button"></button>
                <form class="period-popover">
                  <label>
                    Период
                    <select class="period-edit-select">
                      <option value="7">Неделя</option>
                      <option value="30">Месяц</option>
                      <option value="90">3 месяца</option>
                      <option value="365">Год</option>
                      <option value="custom">Заданный период</option>
                    </select>
                  </label>
                  <label>
                    Дата старта
                    <input class="period-edit-start" type="date" required />
                  </label>
                  <label>
                    Дата окончания
                    <input class="period-edit-end" type="date" required />
                  </label>
                  <p class="period-edit-error" role="alert"></p>
                  <div class="period-actions">
                    <button class="ghost-button period-cancel" type="button">Отмена</button>
                    <button class="primary-button period-save" type="submit">Сохранить</button>
                  </div>
                </form>
              </div>
            </div>
            <button class="drag-handle" type="button" title="Перетащить привычку" aria-label="Перетащить привычку">
              <span aria-hidden="true"></span>
            </button>
            <button class="delete-button" type="button" title="Удалить привычку" aria-label="Удалить привычку">
              <span aria-hidden="true">×</span>
            </button>
          </div>

          <div class="progress-row">
            <div class="progress-track">
              <div class="progress-fill"></div>
            </div>
            <span class="progress-label"></span>
          </div>

          <p class="status-summary"></p>
          <div class="days-grid" role="list"></div>
        </div>
      </article>
    </template>

    <script src="habitLogic.js"></script>
    <script src="app.js"></script>
  </body>
</html>
