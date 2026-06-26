const assert = require("assert");
const logic = require("../habitLogic");

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
} = logic;

function test(name, run) {
  try {
    run();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`fail - ${name}`);
    throw error;
  }
}

const baseHabit = {
  id: "habit-1",
  name: "Чтение",
  startDate: "2026-06-19",
  endDate: "2026-06-21",
  period: 3,
  statuses: {},
};

test("parseDateKey creates a local date from YYYY-MM-DD", () => {
  const date = parseDateKey("2026-06-19");
  assert.equal(date.getFullYear(), 2026);
  assert.equal(date.getMonth(), 5);
  assert.equal(date.getDate(), 19);
});

test("toDateKey formats dates as YYYY-MM-DD", () => {
  assert.equal(toDateKey(new Date(2026, 5, 9)), "2026-06-09");
});

test("addDays returns a shifted copy without mutating the original date", () => {
  const original = new Date(2026, 5, 19);
  const shifted = addDays(original, 2);
  assert.equal(toDateKey(original), "2026-06-19");
  assert.equal(toDateKey(shifted), "2026-06-21");
});

test("getInclusiveDays counts both start and end dates", () => {
  assert.equal(getInclusiveDays("2026-06-19", "2026-06-21"), 3);
});

test("buildDays creates one key per habit day", () => {
  assert.deepEqual(
    buildDays(baseHabit).map((day) => day.key),
    ["2026-06-19", "2026-06-20", "2026-06-21"],
  );
});

test("isHabitFinished is true only after the end date", () => {
  assert.equal(isHabitFinished(baseHabit, new Date(2026, 5, 21)), false);
  assert.equal(isHabitFinished(baseHabit, new Date(2026, 5, 22)), true);
});

test("isDateInsideHabit respects habit boundaries", () => {
  assert.equal(isDateInsideHabit(baseHabit, "2026-06-18"), false);
  assert.equal(isDateInsideHabit(baseHabit, "2026-06-19"), true);
  assert.equal(isDateInsideHabit(baseHabit, "2026-06-21"), true);
  assert.equal(isDateInsideHabit(baseHabit, "2026-06-22"), false);
});

test("normalizeHabits migrates old completed days into done statuses", () => {
  const [habit] = normalizeHabits(
    [
      {
        id: "legacy",
        name: "Legacy",
        startDate: "2026-06-19",
        period: 2,
        completed: ["2026-06-19"],
      },
    ],
    "2026-06-19",
  );

  assert.equal(habit.endDate, "2026-06-20");
  assert.equal(habit.period, 2);
  assert.deepEqual(habit.statuses, { "2026-06-19": DONE });
});

test("cycleStatusValue changes empty to done, done to missed, missed to empty", () => {
  assert.equal(cycleStatusValue(undefined), DONE);
  assert.equal(cycleStatusValue(DONE), MISSED);
  assert.equal(cycleStatusValue(MISSED), null);
});

test("setStatusForHabit sets, replaces, clears, and ignores outside dates", () => {
  const doneHabit = setStatusForHabit(baseHabit, "2026-06-19", DONE);
  assert.equal(doneHabit.statuses["2026-06-19"], DONE);

  const missedHabit = setStatusForHabit(doneHabit, "2026-06-19", MISSED);
  assert.equal(missedHabit.statuses["2026-06-19"], MISSED);

  const clearedHabit = setStatusForHabit(missedHabit, "2026-06-19", MISSED);
  assert.equal(clearedHabit.statuses["2026-06-19"], undefined);

  const outsideHabit = setStatusForHabit(baseHabit, "2026-06-18", DONE);
  assert.deepEqual(outsideHabit.statuses, {});
});

test("getStatusCounts returns done, missed, and unmarked counts", () => {
  const habit = {
    ...baseHabit,
    statuses: {
      "2026-06-19": DONE,
      "2026-06-20": MISSED,
    },
  };

  assert.deepEqual(getStatusCounts(habit), { done: 1, missed: 1, unmarked: 1 });
});

test("getOrderedVisibleStatusStats puts the larger visible count first", () => {
  assert.deepEqual(
    getOrderedVisibleStatusStats({ done: 1, missed: 3 }).map((item) => item.key),
    [MISSED, DONE],
  );
  assert.deepEqual(
    getOrderedVisibleStatusStats({ done: 3, missed: 1 }).map((item) => item.key),
    [DONE, MISSED],
  );
});

test("getDominantStatus returns done when done is larger", () => {
  assert.equal(getDominantStatus({ done: 3, missed: 1 }), DONE);
});

test("getDominantStatus returns missed when missed is larger", () => {
  assert.equal(getDominantStatus({ done: 1, missed: 3 }), MISSED);
});

test("getDominantStatus returns null for ties and empty counts", () => {
  assert.equal(getDominantStatus({ done: 2, missed: 2 }), null);
  assert.equal(getDominantStatus({ done: 0, missed: 0 }), null);
});

test("getExportRows keeps habit order and returns printable fields", () => {
  const rows = getExportRows([
    { name: "A", period: 7, color: "#111111", ignored: true },
    { name: "B", period: 30, color: "#222222" },
  ]);

  assert.deepEqual(rows, [
    { name: "A", period: 7, color: "#111111" },
    { name: "B", period: 30, color: "#222222" },
  ]);
});

test("getExportRows does not mutate source habits", () => {
  const habits = [{ name: "A", period: 7, color: "#111111" }];
  const rows = getExportRows(habits);

  assert.notEqual(rows, habits);
  assert.deepEqual(habits, [{ name: "A", period: 7, color: "#111111" }]);
});

test("getExportRows handles an empty list", () => {
  assert.deepEqual(getExportRows([]), []);
});

test("moveHabit moves an item from top to bottom", () => {
  const habits = [{ id: "a" }, { id: "b" }, { id: "c" }];
  assert.deepEqual(moveHabit(habits, 0, 2).map((habit) => habit.id), ["b", "c", "a"]);
});

test("moveHabit moves an item from bottom to top", () => {
  const habits = [{ id: "a" }, { id: "b" }, { id: "c" }];
  assert.deepEqual(moveHabit(habits, 2, 0).map((habit) => habit.id), ["c", "a", "b"]);
});

test("moveHabit keeps order when moving to the same index", () => {
  const habits = [{ id: "a" }, { id: "b" }, { id: "c" }];
  assert.deepEqual(moveHabit(habits, 1, 1).map((habit) => habit.id), ["a", "b", "c"]);
});

test("moveHabit keeps order for invalid indexes", () => {
  const habits = [{ id: "a" }, { id: "b" }, { id: "c" }];
  assert.deepEqual(moveHabit(habits, -1, 2).map((habit) => habit.id), ["a", "b", "c"]);
  assert.deepEqual(moveHabit(habits, 0, 3).map((habit) => habit.id), ["a", "b", "c"]);
});

test("moveHabit does not mutate the source array", () => {
  const habits = [{ id: "a" }, { id: "b" }, { id: "c" }];
  const moved = moveHabit(habits, 0, 2);
  assert.notEqual(moved, habits);
  assert.deepEqual(habits.map((habit) => habit.id), ["a", "b", "c"]);
});

test("updateHabitPeriod expands the habit period", () => {
  const result = updateHabitPeriod(baseHabit, "2026-06-19", "2026-06-25", new Date(2026, 5, 19));
  assert.equal(result.error, "");
  assert.equal(result.habit.period, 7);
  assert.equal(result.habit.endDate, "2026-06-25");
});

test("updateHabitPeriod rejects an end date before the start date", () => {
  const result = updateHabitPeriod(baseHabit, "2026-06-21", "2026-06-19", new Date(2026, 5, 19));
  assert.notEqual(result.error, "");
  assert.equal(result.habit, baseHabit);
});

test("updateHabitPeriod rejects shortening an active habit before today", () => {
  const result = updateHabitPeriod(baseHabit, "2026-06-19", "2026-06-20", new Date(2026, 5, 21));
  assert.equal(result.error, "Нельзя сократить срок раньше сегодняшнего дня.");
  assert.equal(result.habit, baseHabit);
});

test("updateHabitPeriod rejects shortening that cuts off existing marks", () => {
  const habit = {
    ...baseHabit,
    endDate: "2026-06-25",
    period: 7,
    statuses: {
      "2026-06-24": DONE,
    },
  };
  const result = updateHabitPeriod(habit, "2026-06-19", "2026-06-23", new Date(2026, 5, 19));
  assert.equal(result.error, "Нельзя сократить срок: за пределами нового периода уже есть отметки.");
  assert.equal(result.habit, habit);
});

test("updateHabitPeriod saves a valid custom period", () => {
  const result = updateHabitPeriod(baseHabit, "2026-06-20", "2026-06-24", new Date(2026, 5, 19));
  assert.equal(result.error, "");
  assert.equal(result.habit.startDate, "2026-06-20");
  assert.equal(result.habit.endDate, "2026-06-24");
  assert.equal(result.habit.period, 5);
});

test("startOfDay removes time from a date", () => {
  assert.equal(toDateKey(startOfDay(new Date(2026, 5, 19, 18, 45))), "2026-06-19");
  assert.equal(startOfDay(new Date(2026, 5, 19, 18, 45)).getHours(), 0);
});

test("getStatusLabel returns Russian labels for status values", () => {
  assert.equal(getStatusLabel(DONE), "сделано");
  assert.equal(getStatusLabel(MISSED), "не сделано");
  assert.equal(getStatusLabel(undefined), "без отметки");
});

test("pluralize selects the correct Russian word form", () => {
  const forms = ["день", "дня", "дней"];
  assert.equal(pluralize(1, forms), "день");
  assert.equal(pluralize(2, forms), "дня");
  assert.equal(pluralize(5, forms), "дней");
  assert.equal(pluralize(11, forms), "дней");
  assert.equal(pluralize(21, forms), "день");
});
