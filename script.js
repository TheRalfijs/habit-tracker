let habits = JSON.parse(localStorage.getItem("habits")) || [];

const CATEGORY_ORDER = ["Health", "Mind", "Work", "Faith", "Finance", "Other"];

function saveHabits() {
  localStorage.setItem("habits", JSON.stringify(habits));
}

function getCurrentDateObject() {
  const savedTestDate = localStorage.getItem("testDate");
  return savedTestDate ? new Date(savedTestDate) : new Date();
}

function getDateString(date) {
  return date.toLocaleDateString("en-CA");
}

function getTodayDate() {
  return getDateString(getCurrentDateObject());
}

function normalizeHabits() {
  habits = habits.map(habit => ({
    name: habit.name || "Untitled Habit",
    category: habit.category || "Other",
    done: Boolean(habit.done),
    history: Array.isArray(habit.history) ? [...new Set(habit.history)] : [],
    notes: habit.notes || ""
  }));

  saveHabits();
}

function resetHabitsIfNewDay() {
  const lastSavedDate = localStorage.getItem("lastSavedDate");
  const today = getTodayDate();

  if (lastSavedDate !== today) {
    habits = habits.map(habit => ({
      ...habit,
      done: false
    }));

    localStorage.setItem("lastSavedDate", today);
    saveHabits();
  }
}

function calculateStreak(history, isDoneToday) {
  if (!Array.isArray(history) || history.length === 0) return 0;

  const historySet = new Set(history);
  const cursor = new Date(getCurrentDateObject());
  cursor.setHours(0, 0, 0, 0);

  if (!isDoneToday) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;

  while (historySet.has(getDateString(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function getTopStreak() {
  return habits.reduce((max, habit) => {
    const streak = calculateStreak(habit.history, habit.done);
    return Math.max(max, streak);
  }, 0);
}

function updateHeaderSummary() {
  const total = habits.length;
  const completed = habits.filter(habit => habit.done).length;
  const topStreak = getTopStreak();

  const progressText = document.getElementById("todayProgress");
  const streakText = document.getElementById("topStreakText");
  const subtitleText = document.getElementById("subtitleText");
  const habitCountText = document.getElementById("habitCountText");
  const progressFill = document.getElementById("progressFill");

  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  progressText.textContent = `${completed} / ${total}`;
  streakText.textContent = `${topStreak} days`;
  habitCountText.textContent = `${total} active`;

  if (percent === 100 && total > 0) {
    subtitleText.textContent = "Perfect day. Steel your discipline.";
  } else if (percent >= 50) {
    subtitleText.textContent = "Strong momentum. Finish the forge.";
  } else if (total === 0) {
    subtitleText.textContent = "Start with one habit.";
  } else {
    subtitleText.textContent = "Keep the chain alive.";
  }

  progressFill.style.width = `${percent}%`;
}

function editHabit(index) {
  const newName = prompt("Edit habit name:", habits[index].name);
  if (newName === null) return;

  const trimmedName = newName.trim();
  if (trimmedName === "") return;

  habits[index].name = trimmedName;
  saveHabits();
  renderHabits();
}

function editNotes(index) {
  const newNote = prompt("Habit notes:", habits[index].notes || "");
  if (newNote === null) return;

  habits[index].notes = newNote;
  saveHabits();
}

function deleteHabit(index) {
  habits.splice(index, 1);
  saveHabits();
  renderHabits();
}

function createHabitRow(habit, index) {
  const li = document.createElement("li");
  li.classList.add("habit-row");

  if (habit.done) {
    li.classList.add("completed");
  }

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.classList.add("habit-checkbox");
  checkbox.checked = habit.done;

  checkbox.onchange = function () {
    const today = getTodayDate();

    habits[index].done = checkbox.checked;

    if (checkbox.checked) {
      if (!habits[index].history.includes(today)) {
        habits[index].history.push(today);
      }

      li.classList.add("completed");
      li.classList.remove("pop");
      void li.offsetWidth;
      li.classList.add("pop");
    } else {
      habits[index].history = habits[index].history.filter(date => date !== today);
      li.classList.remove("completed");
    }

    saveHabits();
    renderHabits();
  };

  const main = document.createElement("div");
  main.classList.add("habit-main");

  const topRow = document.createElement("div");
  topRow.classList.add("habit-top-row");

  const textBlock = document.createElement("div");
  textBlock.classList.add("habit-text-block");

  const name = document.createElement("div");
  name.classList.add("habit-name");
  name.textContent = habit.name;

  const meta = document.createElement("div");
  meta.classList.add("habit-meta");

  const streak = calculateStreak(habit.history, habit.done);
  const category = habit.category || "Other";

  meta.textContent = `${streak} day streak • ${category}`;

  textBlock.appendChild(name);
  textBlock.appendChild(meta);

  topRow.appendChild(checkbox);
  topRow.appendChild(textBlock);

  main.appendChild(topRow);

  const actions = document.createElement("div");
  actions.classList.add("habit-actions");

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.textContent = "Edit";
  editButton.onclick = function () {
    editHabit(index);
  };

  const notesButton = document.createElement("button");
  notesButton.type = "button";
  notesButton.textContent = "Notes";
  notesButton.onclick = function () {
    editNotes(index);
  };

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.textContent = "Delete";
  deleteButton.onclick = function () {
    deleteHabit(index);
  };

  actions.appendChild(editButton);
  actions.appendChild(notesButton);
  actions.appendChild(deleteButton);

  li.appendChild(main);
  li.appendChild(actions);

  return li;
}

function renderHabits() {
  const habitList = document.getElementById("habitList");
  const emptyState = document.getElementById("emptyState");

  habitList.innerHTML = "";

  if (habits.length === 0) {
    emptyState.classList.add("show");
  } else {
    emptyState.classList.remove("show");
  }

  const groupedHabits = {};
  CATEGORY_ORDER.forEach(category => {
    groupedHabits[category] = [];
  });

  habits.forEach((habit, index) => {
    const category = habit.category || "Other";
    groupedHabits[category].push({ habit, index });
  });

  CATEGORY_ORDER.forEach(category => {
    if (groupedHabits[category].length === 0) return;

    groupedHabits[category].forEach(item => {
      const row = createHabitRow(item.habit, item.index);
      habitList.appendChild(row);
    });
  });

  updateHeaderSummary();
}

function addHabit() {
  const input = document.getElementById("habitInput");
  const categorySelect = document.getElementById("categorySelect");

  const habitText = input.value.trim();
  const selectedCategory = categorySelect.value;

  if (habitText === "") return;

  habits.push({
    name: habitText,
    category: selectedCategory,
    done: false,
    history: [],
    notes: ""
  });

  saveHabits();
  renderHabits();

  input.value = "";
  categorySelect.value = "Health";
}

document.getElementById("habitInput").addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    addHabit();
  }
});

document.getElementById("addHabitButton").addEventListener("click", addHabit);

const themeToggle = document.getElementById("themeToggle");

function updateThemeButtonText() {
  themeToggle.textContent = document.body.classList.contains("light") ? "☾" : "☼";
}

function applySavedTheme() {
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "light") {
    document.body.classList.add("light");
  }

  updateThemeButtonText();
}

themeToggle.addEventListener("click", function () {
  document.body.classList.toggle("light");

  localStorage.setItem(
    "theme",
    document.body.classList.contains("light") ? "light" : "dark"
  );

  updateThemeButtonText();
});

function updateDateTimeHeader() {
  const now = getCurrentDateObject();

  const dayElement = document.getElementById("currentDay");
  const dateTimeElement = document.getElementById("currentDateTime");

  if (!dayElement || !dateTimeElement) return;

  const dayName = now.toLocaleDateString("en-US", {
    weekday: "long"
  });

  const dateText = now.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long"
  });

  const timeText = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  dayElement.textContent = dayName;
  dateTimeElement.textContent = `${dateText} • ${timeText}`;
}

normalizeHabits();
applySavedTheme();
updateDateTimeHeader();
resetHabitsIfNewDay();
renderHabits();

setInterval(() => {
  updateDateTimeHeader();
}, 60000);