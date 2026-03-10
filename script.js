let habits = JSON.parse(localStorage.getItem("habits")) || [];

function saveHabits() {
    localStorage.setItem("habits", JSON.stringify(habits));
}

function getTodayDate() {
    const today = new Date();
    return today.toLocaleDateString("en-CA");
}

function resetHabitsIfNewDay() {

    const lastSavedDate = localStorage.getItem("lastSavedDate");
    const today = getTodayDate();

    if (lastSavedDate !== today) {

        habits = habits.map(habit => {

            if (habit.done) {
                habit.streak = (habit.streak || 0) + 1;
            } else {
                habit.streak = 0;
            }

            habit.done = false;

            return habit;
        });

        localStorage.setItem("lastSavedDate", today);
        saveHabits();
    }
}

function deleteHabit(index) {
    habits.splice(index, 1);
    saveHabits();
    renderHabits();
}

function updateProgress() {

    const progressText = document.getElementById("progressText");

    const total = habits.length;
    const completed = habits.filter(habit => habit.done).length;

    let percent = 0;

    if (total > 0) {
        percent = Math.round((completed / total) * 100);
    }

    progressText.textContent = `${completed} of ${total} habits completed — ${percent}%`;
}

function renderHabits() {

    const habitList = document.getElementById("habitList");
    habitList.innerHTML = "";

    habits.forEach((habit, index) => {

        const li = document.createElement("li");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = habit.done;

        checkbox.onchange = function () {
            habits[index].done = checkbox.checked;
            saveHabits();
            updateProgress();
        };

        const text = document.createElement("span");
        text.textContent = `${habit.name} — 🔥 ${habit.streak || 0} day streak`;

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";

        deleteButton.onclick = function () {
            deleteHabit(index);
        };

        li.appendChild(checkbox);
        li.appendChild(text);
        li.appendChild(deleteButton);

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
        streak: 0
    });

    saveHabits();
    renderHabits();

    input.value = "";
}

resetHabitsIfNewDay();
renderHabits();