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

function getMondayOfCurrentWeek() {
  const current = new Date(getCurrentDateObject());
  const day = current.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  current.setHours(0, 0, 0, 0);
  current.setDate(current.getDate() + diff);

  return current;
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

function calculateStats(history) {
  if (!history || history.length === 0) {
    return {
      bestStreak: 0,
      completionRate: 0
    };
  }

  const sorted = [...history].sort();
  let bestStreak = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (curr - prev) / (1000 * 60 * 60 * 24);

    if (diff === 1) {
      current++;
      if (current > bestStreak) bestStreak = current;
    } else {
      current = 1;
    }
  }

  const completionRate = Math.min(100, Math.round((history.length / 30) * 100));

  return {
    bestStreak,
    completionRate
  };
}

function getAchievementBadge(streak) {
  if (streak >= 100) return "👑 Unbreakable";
  if (streak >= 30) return "⚔️ Disciplined";
  if (streak >= 7) return "🔥 On Fire";
  if (streak >= 1) return "🌱 First Step";
  return "";
}

function updateProgress() {
  const progressText = document.getElementById("progressText");
  const progressFill = document.getElementById("progressFill");

  const total = habits.length;
  const completed = habits.filter(habit => habit.done).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  progressText.textContent = `${completed} of ${total} habits completed — ${percent}%`;
  if (progressFill) {
    progressFill.style.width = `${percent}%`;
  }
}

function updateTodaySummary() {
  const total = habits.length;
  const completed = habits.filter(habit => habit.done).length;
  const score = total > 0 ? Math.round((completed / total) * 100) : 0;

  const doneEl = document.getElementById("summaryDone");
  const scoreEl = document.getElementById("disciplineScore");
  const topStreakEl = document.getElementById("summaryTopStreak");
  const bestCategoryEl = document.getElementById("summaryBestCategory");
  const headlineEl = document.getElementById("summaryHeadline");

  const topStreak = habits.reduce((max, habit) => {
    const streak = calculateStreak(habit.history, habit.done);
    return Math.max(max, streak);
  }, 0);

  const categoryCount = {};
  habits.forEach(habit => {
    if (!categoryCount[habit.category]) {
      categoryCount[habit.category] = { total: 0, done: 0 };
    }
    categoryCount[habit.category].total++;
    if (habit.done) categoryCount[habit.category].done++;
  });

  let bestCategory = "—";
  let bestRatio = -1;

  Object.entries(categoryCount).forEach(([category, data]) => {
    const ratio = data.total > 0 ? data.done / data.total : 0;
    if (ratio > bestRatio) {
      bestRatio = ratio;
      bestCategory = category;
    }
  });

  let headline = "Start strong today";
  if (score === 100 && total > 0) headline = "Perfect day. Keep it burning.";
  else if (score >= 70) headline = "Strong momentum today.";
  else if (score >= 40) headline = "Solid start. Push a bit more.";
  else if (total === 0) headline = "Create your first habit.";
  else headline = "Get one more habit done now.";

  doneEl.textContent = `${completed} / ${total}`;
  scoreEl.textContent = score;
  topStreakEl.textContent = `${topStreak} days`;
  bestCategoryEl.textContent = bestCategory;
  headlineEl.textContent = headline;
}

function renderWeekLabels() {
  const weekLabels = document.getElementById("weekLabels");
  if (!weekLabels) return;

  weekLabels.innerHTML = "";
  ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach(labelText => {
    const label = document.createElement("div");
    label.classList.add("week-label");
    label.textContent = labelText;
    weekLabels.appendChild(label);
  });
}

function createWeekSquares(history) {
  const weekContainer = document.createElement("div");
  weekContainer.classList.add("week-inline");

  const monday = getMondayOfCurrentWeek();
  const today = getCurrentDateObject();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    day.setHours(0, 0, 0, 0);

    const dateString = getDateString(day);
    const square = document.createElement("div");
    square.classList.add("day");

    if (history.includes(dateString)) {
      square.classList.add("done");
    } else if (day < today) {
      square.classList.add("missed");
    }

    weekContainer.appendChild(square);
  }

  return weekContainer;
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
  renderHabits();
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

  const title = document.createElement("span");
  const streak = calculateStreak(habit.history, habit.done);
  const stats = calculateStats(habit.history);
  const badge = getAchievementBadge(streak);

  title.textContent = `${habit.name} — 🔥 ${streak} | 🏆 ${stats.bestStreak} | 📊 ${stats.completionRate}%`;

  topRow.appendChild(checkbox);
  topRow.appendChild(title);

  const weekContainer = createWeekSquares(habit.history);

  main.appendChild(topRow);
  main.appendChild(weekContainer);

  if (badge) {
    const badgeElement = document.createElement("div");
    badgeElement.classList.add("habit-badge");
    badgeElement.textContent = badge;
    main.appendChild(badgeElement);
  }

  if (habit.notes) {
    const note = document.createElement("div");
    note.classList.add("habit-note");
    note.textContent = "📝 " + habit.notes;
    main.appendChild(note);
  }

  const actions = document.createElement("div");
  actions.classList.add("habit-actions");

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.textContent = "Edit";
  editButton.onclick = function () {
    editHabit(index);
  };

  const noteButton = document.createElement("button");
  noteButton.type = "button";
  noteButton.textContent = "Notes";
  noteButton.onclick = function () {
    editNotes(index);
  };

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.textContent = "Delete";
  deleteButton.onclick = function () {
    deleteHabit(index);
  };

  actions.appendChild(editButton);
  actions.appendChild(noteButton);
  actions.appendChild(deleteButton);

  li.appendChild(main);
  li.appendChild(actions);

  return li;
}

function createCategoryHeader(category) {
  const header = document.createElement("li");
  header.classList.add("category-header");
  header.textContent = category;
  return header;
}

function renderHabits() {
  const habitList = document.getElementById("habitList");
  habitList.innerHTML = "";

  renderWeekLabels();

  const groupedHabits = {};
  CATEGORY_ORDER.forEach(category => {
    groupedHabits[category] = [];
  });

  habits.forEach((habit, index) => {
    const category = habit.category || "Other";
    if (!groupedHabits[category]) groupedHabits[category] = [];
    groupedHabits[category].push({ habit, index });
  });

  CATEGORY_ORDER.forEach(category => {
    if (groupedHabits[category].length === 0) return;

    const categoryHeader = createCategoryHeader(category);
    habitList.appendChild(categoryHeader);

    groupedHabits[category].forEach(item => {
      const row = createHabitRow(item.habit, item.index);
      habitList.appendChild(row);
    });
  });

  updateProgress();
  updateTodaySummary();
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
  themeToggle.textContent = document.body.classList.contains("dark")
    ? "Light Mode"
    : "Dark Mode";
}

function applySavedTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
  }
  updateThemeButtonText();
}

themeToggle.addEventListener("click", function () {
  document.body.classList.toggle("dark");
  localStorage.setItem(
    "theme",
    document.body.classList.contains("dark") ? "dark" : "light"
  );
  renderHabits();
  updateThemeButtonText();
});

const exportButton = document.getElementById("exportButton");
const importButton = document.getElementById("importButton");
const importFile = document.getElementById("importFile");

if (exportButton && importButton && importFile) {
  exportButton.addEventListener("click", function () {
    const data = {
      habits,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "forge-tracker-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  importButton.addEventListener("click", function () {
    importFile.click();
  });

  importFile.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {
      try {
        const importedData = JSON.parse(e.target.result);

        if (!importedData.habits || !Array.isArray(importedData.habits)) {
          alert("Invalid backup file.");
          return;
        }

        habits = importedData.habits;
        normalizeHabits();
        saveHabits();
        renderHabits();
        alert("Data imported successfully.");
      } catch {
        alert("Failed to import file.");
      }
    };

    reader.readAsText(file);
    importFile.value = "";
  });
}

normalizeHabits();
applySavedTheme();
resetHabitsIfNewDay();
renderHabits();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js")
      .then(() => {
        console.log("Service Worker registered");
      })
      .catch(error => {
        console.log("Service Worker registration failed:", error);
      });
  });
}