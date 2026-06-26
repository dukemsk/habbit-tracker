(function initHabitLogic(globalScope) {
  const DONE = "done";
  const MISSED = "missed";

  function parseDateKey(dateKey) {
    const [year, month, day] = dateKey.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  function toDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function addDays(date, amount) {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + amount);
    return copy;
  }

  function getInclusiveDays(startDate, endDate) {
    const start = parseDateKey(startDate);
    const end = parseDateKey(endDate);
    const diff = end.getTime() - start.getTime();
    return Math.floor(diff / 86400000) + 1;
  }

  function buildDays(habit) {
    const start = parseDateKey(habit.startDate);
    return Array.from({ length: habit.period }, (_, index) => {
      const date = addDays(start, index);
      return {
        date,
        key: toDateKey(date),
      };
    });
  }

  function isHabitFinished(habit, currentDate) {
    return startOfDay(currentDate) > parseDateKey(habit.endDate);
  }

  function isDateInsideHabit(habit, dayKey) {
    const date = parseDateKey(dayKey);
    return date >= parseDateKey(habit.startDate) && date <= parseDateKey(habit.endDate);
  }

  function normalizeHabits(items, fallbackDateKey) {
    return items.map((habit) => {
      const startDate = habit.startDate || fallbackDateKey;
      const period = Number(habit.period) || getInclusiveDays(startDate, habit.endDate || startDate);
      const endDate = habit.endDate || toDateKey(addDays(parseDateKey(startDate), period - 1));
      const statuses = habit.statuses
        ? { ...habit.statuses }
        : Object.fromEntries((habit.completed || []).map((dateKey) => [dateKey, DONE]));

      return {
        ...habit,
        startDate,
        endDate,
        period: getInclusiveDays(startDate, endDate),
        statuses,
      };
    });
  }

  function cycleStatusValue(currentStatus) {
    if (currentStatus === DONE) return MISSED;
    if (currentStatus === MISSED) return null;
    return DONE;
  }

  function setStatusForHabit(habit, dayKey, status) {
    if (!isDateInsideHabit(habit, dayKey)) return habit;

    const statuses = { ...habit.statuses };

    if (!status || statuses[dayKey] === status) {
      delete statuses[dayKey];
    } else {
      statuses[dayKey] = status;
    }

    return { ...habit, statuses };
  }

  function getStatusCounts(habit) {
    const days = buildDays(habit);
    const done = days.filter((day) => habit.statuses[day.key] === DONE).length;
    const missed = days.filter((day) => habit.statuses[day.key] === MISSED).length;

    return {
      done,
      missed,
      unmarked: habit.period - done - missed,
    };
  }

  function getOrderedVisibleStatusStats(counts) {
    const stats = [
      { key: DONE, label: "Сделано", value: counts.done },
      { key: MISSED, label: "Не сделано", value: counts.missed },
    ];

    return stats.sort((left, right) => {
      if (right.value !== left.value) return right.value - left.value;
      return left.key === DONE ? -1 : 1;
    });
  }

  function getDominantStatus(counts) {
    if (counts.done > counts.missed) return DONE;
    if (counts.missed > counts.done) return MISSED;
    return null;
  }

  function moveHabit(items, fromIndex, toIndex) {
    const nextItems = [...items];
    const isInvalidIndex =
      !Number.isInteger(fromIndex) ||
      !Number.isInteger(toIndex) ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= nextItems.length ||
      toIndex >= nextItems.length;

    if (isInvalidIndex || fromIndex === toIndex) {
      return nextItems;
    }

    const [movedItem] = nextItems.splice(fromIndex, 1);
    nextItems.splice(toIndex, 0, movedItem);
    return nextItems;
  }

  function updateHabitPeriod(habit, startDate, endDate, currentDate) {
    const period = getInclusiveDays(startDate, endDate);
    const todayKey = toDateKey(startOfDay(currentDate));
    const hasOutsideFutureMarks = Object.keys(habit.statuses || {}).some((dayKey) => dayKey > endDate);

    if (period < 1) {
      return {
        habit,
        error: "Дата окончания должна быть не раньше даты старта.",
      };
    }

    if (parseDateKey(habit.startDate) <= startOfDay(currentDate) && endDate < todayKey) {
      return {
        habit,
        error: "Нельзя сократить срок раньше сегодняшнего дня.",
      };
    }

    if (hasOutsideFutureMarks) {
      return {
        habit,
        error: "Нельзя сократить срок: за пределами нового периода уже есть отметки.",
      };
    }

    return {
      habit: {
        ...habit,
        startDate,
        endDate,
        period,
      },
      error: "",
    };
  }

  function getExportRows(habits) {
    return habits.map((habit) => ({
      name: habit.name,
      period: habit.period,
      color: habit.color,
    }));
  }

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function getStatusLabel(status) {
    if (status === DONE) return "сделано";
    if (status === MISSED) return "не сделано";
    return "без отметки";
  }

  function pluralize(count, forms) {
    const lastTwo = count % 100;
    const last = count % 10;

    if (lastTwo >= 11 && lastTwo <= 14) return forms[2];
    if (last === 1) return forms[0];
    if (last >= 2 && last <= 4) return forms[1];
    return forms[2];
  }

  const api = {
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
    isDateInsideHabit,
    isHabitFinished,
    moveHabit,
    normalizeHabits,
    parseDateKey,
    pluralize,
    setStatusForHabit,
    startOfDay,
    toDateKey,
    updateHabitPeriod,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  globalScope.HabitLogic = api;
})(typeof window !== "undefined" ? window : globalThis);
