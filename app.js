const STORAGE_KEY = "habit-tracker-items";
const {
  DONE,
  MISSED,
  addDays,
  buildDays,
  cycleStatusValue,
  getInclusiveDays,
  getDominantStatus,
  getExportRows,
  getOrderedVisibleStatusStats,
  getStatusCounts,
  getStatusLabel,
  isDateInsideHabit: logicIsDateInsideHabit,
  isHabitFinished: logicIsHabitFinished,
  moveHabit,
  normalizeHabits: normalizeHabitItems,
  parseDateKey,
  pluralize,
  setStatusForHabit,
  startOfDay,
  toDateKey,
  updateHabitPeriod,
} = window.HabitLogic;

const today = new Date();
const todayKey = toDateKey(today);

const openHabitDialogButton = document.querySelector("#openHabitDialog");
const habitDialog = document.querySelector("#habitDialog");
const closeHabitDialogButton = document.querySelector("#closeHabitDialog");
const habitForm = document.querySelector("#habitForm");
const habitName = document.querySelector("#habitName");
const habitPeriod = document.querySelector("#habitPeriod");
const habitStart = document.querySelector("#habitStart");
const habitEnd = document.querySelector("#habitEnd");
const formError = document.querySelector("#formError");
const habitList = document.querySelector("#habitList");
const emptyState = document.querySelector("#emptyState");
const summaryText = document.querySelector("#summaryText");
const clearDoneButton = document.querySelector("#clearDoneButton");
const exportButton = document.querySelector("#exportButton");
const exportDialog = document.querySelector("#exportDialog");
const exportForm = document.querySelector("#exportForm");
const exportTitle = document.querySelector("#exportTitle");
const cancelExportButton = document.querySelector("#cancelExportButton");
const deleteDialog = document.querySelector("#deleteDialog");
const deleteDialogText = document.querySelector("#deleteDialogText");
const cancelDeleteButton = document.querySelector("#cancelDeleteButton");
const confirmDeleteButton = document.querySelector("#confirmDeleteButton");
const template = document.querySelector("#habitTemplate");
const desktopFormQuery = window.matchMedia("(min-width: 980px)");

let habits = normalizeHabitItems(loadHabits(), todayKey);
let habitPendingDelete = null;
let dragState = null;

habitStart.value = todayKey;
syncEndDateFromPeriod();
document.querySelector("#todayWeekday").textContent = new Intl.DateTimeFormat("ru-RU", {
  weekday: "long",
}).format(today);
document.querySelector("#todayDate").textContent = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
}).format(today);

syncHabitFormMode();

openHabitDialogButton.addEventListener("click", () => {
  resetHabitForm();
  if (isDesktopFormMode()) {
    habitName.focus();
  } else {
    openDialog(habitDialog);
    habitName.focus();
  }
});

closeHabitDialogButton.addEventListener("click", () => habitDialog.close());
desktopFormQuery.addEventListener("change", syncHabitFormMode);
document.addEventListener("keydown", handleDragKeydown);
habitPeriod.addEventListener("change", syncEndDateFromPeriod);
habitStart.addEventListener("change", syncEndDateFromPeriod);

habitEnd.addEventListener("change", () => {
  if (habitPeriod.value !== "custom") {
    habitPeriod.value = "custom";
  }
});

habitForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(habitForm);
  const name = formData.get("habitName").trim();
  const startDate = formData.get("habitStart");
  const endDate = formData.get("habitEnd");
  const period = getInclusiveDays(startDate, endDate);

  formError.textContent = "";

  if (!name) {
    habitName.focus();
    return;
  }

  if (period < 1) {
    formError.textContent = "Дата окончания должна быть не раньше даты старта.";
    habitEnd.focus();
    return;
  }

  habits.unshift({
    id: crypto.randomUUID(),
    name,
    period,
    startDate,
    endDate,
    color: formData.get("habitColor"),
    statuses: {},
    createdAt: new Date().toISOString(),
  });

  saveHabits();
  renderHabits();
  resetHabitForm();

  if (!isDesktopFormMode()) {
    habitDialog.close();
  }
});

clearDoneButton.addEventListener("click", () => {
  habits = habits.filter((habit) => !isHabitFinished(habit));
  saveHabits();
  renderHabits();
});

exportButton.addEventListener("click", () => {
  exportTitle.value = "План привычек";
  openDialog(exportDialog);
  exportTitle.focus();
});

cancelExportButton.addEventListener("click", () => exportDialog.close());

exportForm.addEventListener("submit", (event) => {
  event.preventDefault();
  openExportWindow(exportTitle.value.trim() || "План привычек");
  exportDialog.close();
});

cancelDeleteButton.addEventListener("click", () => {
  habitPendingDelete = null;
  deleteDialog.close();
});

confirmDeleteButton.addEventListener("click", () => {
  if (habitPendingDelete) {
    deleteHabit(habitPendingDelete);
  }

  habitPendingDelete = null;
  deleteDialog.close();
});

function renderHabits() {
  habitList.innerHTML = "";
  emptyState.hidden = habits.length > 0;
  clearDoneButton.disabled = !habits.some(isHabitFinished);

  summaryText.textContent =
    habits.length === 0
      ? "Список пока пуст."
      : `${habits.length} ${pluralize(habits.length, ["привычка", "привычки", "привычек"])} в работе`;

  habits.forEach((habit) => {
    const card = template.content.firstElementChild.cloneNode(true);
    const days = buildDays(habit);
    const counts = getStatusCounts(habit);
    const doneCount = counts.done;
    const progress = Math.round((doneCount / habit.period) * 100);
    const dominantStatus = getDominantStatus(counts);

    card.dataset.habitId = habit.id;
    card.style.setProperty("--habit-color", habit.color);
    card.style.setProperty("--habit-bg", hexToRgba(habit.color, 0.12));
    card.classList.toggle("status-done", dominantStatus === DONE);
    card.classList.toggle("status-missed", dominantStatus === MISSED);
    card.querySelector(".habit-title").textContent = habit.name;
    card.querySelector(".habit-meta").textContent =
      `${formatDate(habit.startDate)} - ${formatDate(habit.endDate)} · ${habit.period} ${pluralize(habit.period, ["день", "дня", "дней"])}`;
    card.querySelector(".progress-fill").style.width = `${progress}%`;
    card.querySelector(".progress-label").textContent = `${doneCount}/${habit.period}`;
    renderStatusSummary(card.querySelector(".status-summary"), counts);

    setupPeriodEditor(card, habit);
    card.querySelector(".drag-handle").addEventListener("pointerdown", (event) => startHabitDrag(event, habit.id));
    card.querySelector(".delete-button").addEventListener("click", () => askDeleteHabit(habit));

    const daysGrid = card.querySelector(".days-grid");
    days.forEach((day, index) => {
      const status = habit.statuses[day.key];
      const cell = document.createElement("button");
      cell.className = "day-cell";
      cell.type = "button";
      cell.textContent = index + 1;
      cell.classList.toggle("done", status === DONE);
      cell.classList.toggle("missed", status === MISSED);
      cell.classList.toggle("today", day.key === todayKey);
      cell.classList.toggle("future", day.date > startOfDay(today));
      cell.setAttribute("role", "listitem");
      cell.setAttribute("title", `${formatDate(day.key)} · нажмите, чтобы изменить`);
      cell.setAttribute("aria-label", `${formatDate(day.key)}: ${getStatusLabel(status)}. Нажмите, чтобы изменить.`);
      cell.addEventListener("click", () => cycleDayStatus(habit.id, day.key));
      daysGrid.append(cell);
    });

    habitList.append(card);
  });
}

function setupPeriodEditor(card, habit) {
  const control = card.querySelector(".habit-period-control");
  const trigger = card.querySelector(".habit-meta");
  const form = card.querySelector(".period-popover");
  const periodSelect = card.querySelector(".period-edit-select");
  const startInput = card.querySelector(".period-edit-start");
  const endInput = card.querySelector(".period-edit-end");
  const errorText = card.querySelector(".period-edit-error");
  const cancelButton = card.querySelector(".period-cancel");

  startInput.value = habit.startDate;
  endInput.value = habit.endDate;
  periodSelect.value = getPeriodSelectValue(habit.period);

  trigger.addEventListener("click", () => {
    control.classList.add("editing");
    periodSelect.focus();
  });

  control.addEventListener("mouseleave", () => {
    if (!control.contains(document.activeElement)) {
      closePeriodEditor(control, habit);
    }
  });

  control.addEventListener("focusout", () => {
    setTimeout(() => {
      if (!control.contains(document.activeElement)) {
        closePeriodEditor(control, habit);
      }
    }, 0);
  });

  periodSelect.addEventListener("change", () => syncPeriodEditorEndDate(periodSelect, startInput, endInput));
  startInput.addEventListener("change", () => syncPeriodEditorEndDate(periodSelect, startInput, endInput));

  endInput.addEventListener("change", () => {
    if (periodSelect.value !== "custom") {
      periodSelect.value = "custom";
    }
  });

  cancelButton.addEventListener("click", () => closePeriodEditor(control, habit));

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    errorText.textContent = "";

    const result = updateHabitPeriod(habit, startInput.value, endInput.value, today);

    if (result.error) {
      errorText.textContent = result.error;
      return;
    }

    habits = habits.map((item) => (item.id === habit.id ? result.habit : item));
    saveHabits();
    renderHabits();
  });
}

function closePeriodEditor(control, habit) {
  const periodSelect = control.querySelector(".period-edit-select");
  const startInput = control.querySelector(".period-edit-start");
  const endInput = control.querySelector(".period-edit-end");
  const errorText = control.querySelector(".period-edit-error");

  startInput.value = habit.startDate;
  endInput.value = habit.endDate;
  periodSelect.value = getPeriodSelectValue(habit.period);
  errorText.textContent = "";
  control.classList.remove("editing");
}

function syncPeriodEditorEndDate(periodSelect, startInput, endInput) {
  if (periodSelect.value !== "custom") {
    endInput.value = toDateKey(addDays(parseDateKey(startInput.value), Number(periodSelect.value) - 1));
  } else if (!endInput.value) {
    endInput.value = startInput.value;
  }
}

function getPeriodSelectValue(period) {
  return ["7", "30", "90", "365"].includes(String(period)) ? String(period) : "custom";
}

function startHabitDrag(event, habitId) {
  if (event.button !== 0 || dragState) return;

  const card = event.currentTarget.closest(".habit-card");
  const fromIndex = habits.findIndex((habit) => habit.id === habitId);

  if (!card || fromIndex < 0) return;

  event.preventDefault();
  event.currentTarget.setPointerCapture(event.pointerId);

  const rect = card.getBoundingClientRect();
  const placeholder = document.createElement("div");
  placeholder.className = "habit-placeholder";
  placeholder.style.height = `${rect.height}px`;

  card.after(placeholder);
  card.classList.add("dragging");
  card.style.width = `${rect.width}px`;
  card.style.left = `${rect.left}px`;
  card.style.top = `${rect.top}px`;

  dragState = {
    card,
    handle: event.currentTarget,
    habitId,
    fromIndex,
    pointerId: event.pointerId,
    startY: event.clientY,
    offsetY: event.clientY - rect.top,
    placeholder,
    hasMoved: false,
  };

  document.body.classList.add("is-dragging-habit");
  document.addEventListener("pointermove", moveHabitDrag);
  document.addEventListener("pointerup", endHabitDrag);
  document.addEventListener("pointercancel", cancelHabitDrag);
}

function moveHabitDrag(event) {
  if (!dragState || event.pointerId !== dragState.pointerId) return;

  const y = event.clientY;
  dragState.hasMoved = dragState.hasMoved || Math.abs(y - dragState.startY) > 4;
  dragState.card.style.top = `${y - dragState.offsetY}px`;

  const siblings = [...habitList.querySelectorAll(".habit-card:not(.dragging)")];
  const nextCard = siblings.find((card) => {
    const rect = card.getBoundingClientRect();
    return y < rect.top + rect.height / 2;
  });

  if (nextCard) {
    habitList.insertBefore(dragState.placeholder, nextCard);
  } else {
    habitList.append(dragState.placeholder);
  }
}

function endHabitDrag(event) {
  if (!dragState || event.pointerId !== dragState.pointerId) return;
  finishHabitDrag({ commit: dragState.hasMoved });
}

function cancelHabitDrag(event) {
  if (!dragState || event.pointerId !== dragState.pointerId) return;
  finishHabitDrag({ commit: false });
}

function handleDragKeydown(event) {
  if (event.key === "Escape" && dragState) {
    finishHabitDrag({ commit: false });
  }
}

function finishHabitDrag({ commit }) {
  if (!dragState) return;

  const { card, handle, pointerId, fromIndex, placeholder } = dragState;
  const toIndex = [...habitList.children].filter((item) => item !== card).indexOf(placeholder);

  document.removeEventListener("pointermove", moveHabitDrag);
  document.removeEventListener("pointerup", endHabitDrag);
  document.removeEventListener("pointercancel", cancelHabitDrag);
  document.body.classList.remove("is-dragging-habit");

  try {
    handle.releasePointerCapture(pointerId);
  } catch {
    // The pointer may already be released after cancellation.
  }

  card.classList.remove("dragging");
  card.style.width = "";
  card.style.left = "";
  card.style.top = "";
  placeholder.remove();
  dragState = null;

  if (!commit || toIndex < 0 || toIndex === fromIndex) {
    renderHabits();
    return;
  }

  habits = moveHabit(habits, fromIndex, toIndex);
  saveHabits();
  renderHabits();
}

function cycleDayStatus(habitId, dayKey) {
  const habit = habits.find((item) => item.id === habitId);
  setDayStatus(habitId, dayKey, cycleStatusValue(habit?.statuses[dayKey]));
}

function setDayStatus(habitId, dayKey, status) {
  habits = habits.map((habit) => {
    if (habit.id !== habitId) return habit;
    return setStatusForHabit(habit, dayKey, status);
  });

  saveHabits();
  renderHabits();
}

function askDeleteHabit(habit) {
  habitPendingDelete = habit.id;
  deleteDialogText.textContent = `Привычка "${habit.name}" будет удалена вместе со всеми отметками.`;
  openDialog(deleteDialog);
}

function deleteHabit(habitId) {
  habits = habits.filter((habit) => habit.id !== habitId);
  saveHabits();
  renderHabits();
}

function openExportWindow(title) {
  const rows = getExportRows(habits);
  const exportWindow = window.open("", "_blank");

  if (!exportWindow) {
    alert("Браузер заблокировал открытие окна экспорта.");
    return;
  }

  exportWindow.document.open();
  exportWindow.document.write(buildExportDocument(title, rows));
  exportWindow.document.close();
}

function buildExportDocument(title, rows) {
  const rowMarkup =
    rows.length === 0
      ? `<p class="empty-export">Пока нет привычек для экспорта.</p>`
      : rows.map(renderExportRow).join("");

  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: #f3f3f0;
        color: #222;
        font-family: Arial, Helvetica, sans-serif;
      }
      .print-actions {
        position: sticky;
        top: 0;
        z-index: 5;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding: 14px 18px;
        background: rgba(255, 255, 255, 0.92);
        border-bottom: 1px solid #ddd;
      }
      .print-actions button {
        min-height: 38px;
        border: 0;
        border-radius: 8px;
        background: #202123;
        color: white;
        padding: 0 16px;
        font: inherit;
        font-weight: 800;
        cursor: pointer;
      }
      .sheet {
        width: min(1180px, calc(100% - 32px));
        margin: 28px auto;
        padding: 28px 32px 42px;
        background: #fff;
      }
      .export-title {
        width: min(880px, 100%);
        margin: 0 auto 56px;
        padding: 14px 22px;
        background: #ff1f0f;
        color: #000;
        text-align: center;
        font-size: 2.1rem;
        line-height: 1.1;
        font-weight: 900;
      }
      .export-list {
        display: grid;
        gap: 34px;
      }
      .export-row {
        display: grid;
        grid-template-columns: 290px minmax(0, 1fr);
        gap: 38px;
        align-items: center;
        break-inside: avoid;
      }
      .habit-name-box {
        min-height: 92px;
        display: grid;
        place-items: center;
        border: 1.5px solid var(--row-color);
        border-radius: 12px;
        background: var(--row-bg);
        padding: 16px;
        font-size: 1.15rem;
        font-weight: 800;
        text-align: center;
        overflow-wrap: anywhere;
      }
      .day-dots {
        display: grid;
        grid-template-columns: repeat(20, 26px);
        gap: 8px 11px;
        align-items: center;
      }
      .day-dot {
        display: grid;
        width: 26px;
        height: 26px;
        place-items: center;
        border: 1.4px solid #cfcfcf;
        border-radius: 50%;
        color: #333;
        font-size: 0.82rem;
        font-weight: 750;
      }
      .empty-export {
        margin: 0;
        color: #666;
        font-size: 1.1rem;
        text-align: center;
      }
      @media print {
        body { background: #fff; }
        .print-actions { display: none; }
        .sheet {
          width: 100%;
          margin: 0;
          padding: 14mm 12mm;
        }
      }
    </style>
  </head>
  <body>
    <div class="print-actions">
      <button type="button" onclick="window.print()">Печать / PDF</button>
    </div>
    <main class="sheet">
      <h1 class="export-title">${escapeHtml(title)}</h1>
      <section class="export-list">${rowMarkup}</section>
    </main>
  </body>
</html>`;
}

function renderExportRow(row) {
  const days = Array.from({ length: row.period }, (_, index) => `<span class="day-dot">${index + 1}</span>`).join("");
  const color = sanitizeColor(row.color);
  const softColor = hexToRgba(color, 0.15);

  return `<article class="export-row" style="--row-color: ${color}; --row-bg: ${softColor};">
    <div class="habit-name-box">${escapeHtml(row.name)}</div>
    <div class="day-dots">${days}</div>
  </article>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function sanitizeColor(color) {
  return /^#[0-9a-f]{6}$/i.test(color) ? color : "#2e7d5b";
}

function hexToRgba(hex, alpha) {
  const cleanHex = sanitizeColor(hex).slice(1);
  const red = parseInt(cleanHex.slice(0, 2), 16);
  const green = parseInt(cleanHex.slice(2, 4), 16);
  const blue = parseInt(cleanHex.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function renderStatusSummary(container, counts) {
  container.replaceChildren();

  getOrderedVisibleStatusStats(counts).forEach((stat, index) => {
    if (index > 0) {
      container.append(document.createTextNode(" · "));
    }

    const item = document.createElement("span");
    item.className = `status-count ${stat.key}`;
    item.textContent = `${stat.label}: ${stat.value}`;
    container.append(item);
  });
}

function resetHabitForm() {
  habitForm.reset();
  habitStart.value = todayKey;
  habitPeriod.value = "30";
  document.querySelector("#colorGreen").checked = true;
  formError.textContent = "";
  syncEndDateFromPeriod();
}

function syncEndDateFromPeriod() {
  const startDate = habitStart.value || todayKey;
  const periodValue = habitPeriod.value;

  if (periodValue !== "custom") {
    habitEnd.value = toDateKey(addDays(parseDateKey(startDate), Number(periodValue) - 1));
  } else if (!habitEnd.value) {
    habitEnd.value = startDate;
  }
}

function isHabitFinished(habit) {
  return logicIsHabitFinished(habit, today);
}

function isDateInsideHabit(habit, dayKey) {
  return logicIsDateInsideHabit(habit, dayKey);
}

function loadHabits() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
  } catch {
    return [];
  }
}

function saveHabits() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}

function openDialog(dialog) {
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    dialog.setAttribute("open", "");
  }
}

function isDesktopFormMode() {
  return desktopFormQuery.matches;
}

function syncHabitFormMode() {
  if (isDesktopFormMode()) {
    if (!habitDialog.open) {
      habitDialog.setAttribute("open", "");
    }
    return;
  }

  if (habitDialog.open) {
    habitDialog.close();
  }
}

function formatDate(dateKey) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
  }).format(parseDateKey(dateKey));
}

saveHabits();
renderHabits();
