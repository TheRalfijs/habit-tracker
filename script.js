let habits = JSON.parse(localStorage.getItem("habits")) || [];

function saveHabits() {
    localStorage.setItem("habits", JSON.stringify(habits));
}

function getCurrentDateObject() {
    const savedTestDate = localStorage.getItem("testDate");

    if (savedTestDate) {
        return new Date(savedTestDate);
    }

    return new Date();
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
        done: Boolean(habit.done),
        history: Array.isArray(habit.history) ? [...new Set(habit.history)] : []
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
    const day = current.getDay(); // 0=Sun, 1=Mon, ...
    const diff = day === 0 ? -6 : 1 - day; // move Sunday back to Monday
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

function deleteHabit(index) {
    habits.splice(index, 1);
    saveHabits();
    renderHabits();
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

function updateProgress() {
    const progressText = document.getElementById("progressText");
    const progressFill = document.getElementById("progressFill");

    const total = habits.length;
    const completed = habits.filter(habit => habit.done).length;

    let percent = 0;
    if (total > 0) {
        percent = Math.round((completed / total) * 100);
    }

    progressText.textContent = `${completed} of ${total} habits completed — ${percent}%`;

    if (progressFill) {
        progressFill.style.width = `${percent}%`;
    }
}

function renderWeekLabels() {
    const weekLabels = document.getElementById("weekLabels");
    if (!weekLabels) return;

    weekLabels.innerHTML = "";

    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    labels.forEach(dayName => {
        const label = document.createElement("div");
        label.classList.add("week-label");
        label.textContent = dayName;
        weekLabels.appendChild(label);
    });
}

function createWeekSquares(history) {
    const weekContainer = document.createElement("div");
    weekContainer.classList.add("week-inline");

    const monday = getMondayOfCurrentWeek();

    for (let i = 0; i < 7; i++) {
        const day = new Date(monday);
        day.setDate(monday.getDate() + i);

        const dateString = getDateString(day);

        const square = document.createElement("div");
        square.classList.add("day");

        if (history.includes(dateString)) {
            square.classList.add("done");
        }

        weekContainer.appendChild(square);
    }

    return weekContainer;
}

function renderHabits() {
    const habitList = document.getElementById("habitList");
    habitList.innerHTML = "";

    renderWeekLabels();

    habits.forEach((habit, index) => {
        const li = document.createElement("li");

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
        title.textContent = `${habit.name} — 🔥 ${streak} day streak`;

        topRow.appendChild(checkbox);
        topRow.appendChild(title);

        const weekContainer = createWeekSquares(habit.history);

        main.appendChild(topRow);
        main.appendChild(weekContainer);

        const actions = document.createElement("div");
        actions.classList.add("habit-actions");

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.onclick = function () {
            editHabit(index);
        };

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.onclick = function () {
            deleteHabit(index);
        };

        actions.appendChild(editButton);
        actions.appendChild(deleteButton);

        li.appendChild(main);
        li.appendChild(actions);

        habitList.appendChild(li);
    });

    updateProgress();
}

function addHabit() {
    const input = document.getElementById("habitInput");
    const habitText = input.value.trim();

    if (habitText === "") return;

    habits.push({
        name: habitText,
        done: false,
        history: []
    });

    saveHabits();
    renderHabits();

    input.value = "";
}

document.getElementById("habitInput").addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        addHabit();
    }
});

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
    updateThemeButtonText();
});

normalizeHabits();
applySavedTheme();
resetHabitsIfNewDay();
renderHabits();