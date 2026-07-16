const state = {
  tasks: [],
  currentTaskId: null,
  coins: 3,
  wheelRotation: 0,
  clawLocked: false,
  wheelLocked: false,
  clawPlayedForTurn: false,
  clawPosition: 50
};

const taskForm = document.querySelector("#taskForm");
const taskInput = document.querySelector("#taskInput");
const setupTaskList = document.querySelector("#setupTaskList");
const arcadeTaskList = document.querySelector("#arcadeTaskList");
const startButton = document.querySelector("#startButton");
const setupPanel = document.querySelector("#setupPanel");
const arcadePanel = document.querySelector("#arcadePanel");
const coinCount = document.querySelector("#coinCount");
const doneCount = document.querySelector("#doneCount");
const totalCount = document.querySelector("#totalCount");
const progressFill = document.querySelector("#progressFill");
const progressText = document.querySelector("#progressText");
const currentTask = document.querySelector("#currentTask");
const completeTaskButton = document.querySelector("#completeTaskButton");
const skipTaskButton = document.querySelector("#skipTaskButton");
const moveLeftButton = document.querySelector("#moveLeftButton");
const moveRightButton = document.querySelector("#moveRightButton");
const dropClawButton = document.querySelector("#dropClawButton");
const clawMessage = document.querySelector("#clawMessage");
const claw = document.querySelector("#claw");
const prizes = document.querySelector("#prizes");
const spinButton = document.querySelector("#spinButton");
const wheel = document.querySelector("#wheel");
const wheelMessage = document.querySelector("#wheelMessage");
const winPanel = document.querySelector("#winPanel");
const resetButton = document.querySelector("#resetButton");

const prizePool = [
  { name: "Bear", icon: "🧸", color: "#b676ff", x: 13, bottom: 12 },
  { name: "Candy", icon: "🍬", color: "#ff4e9a", x: 28, bottom: 72 },
  { name: "Robot", icon: "🤖", color: "#19b8ff", x: 43, bottom: 18 },
  { name: "Duck", icon: "🦆", color: "#fff55c", x: 59, bottom: 82 },
  { name: "Rocket", icon: "🚀", color: "#ff3d47", x: 75, bottom: 22 },
  { name: "Dino", icon: "🦖", color: "#1fc486", x: 20, bottom: 126 },
  { name: "Ball", icon: "⚽", color: "#ff9c1a", x: 38, bottom: 120 },
  { name: "Crown", icon: "👑", color: "#ffffff", x: 66, bottom: 132 },
  { name: "Cube", icon: "🎲", color: "#7e4cff", x: 84, bottom: 116 }
];

function addTask(name) {
  const cleaned = name.trim();
  if (!cleaned) return;

  state.tasks.push({
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    name: cleaned,
    done: false
  });
  taskInput.value = "";
  render();
}

function removeTask(id) {
  state.tasks = state.tasks.filter((task) => task.id !== id);
  if (state.currentTaskId === id) {
    state.currentTaskId = null;
  }
  render();
}

function remainingTasks() {
  return state.tasks.filter((task) => !task.done);
}

function currentTaskRecord() {
  return state.tasks.find((task) => task.id === state.currentTaskId && !task.done);
}

function chooseRandomTask() {
  const remaining = remainingTasks();
  if (!remaining.length) return null;

  const currentIndex = remaining.findIndex((task) => task.id === state.currentTaskId);
  const pool = remaining.length > 1 && currentIndex >= 0
    ? remaining.filter((task) => task.id !== state.currentTaskId)
    : remaining;
  return pool[Math.floor(Math.random() * pool.length)];
}

function renderTaskList(target, removable = false) {
  target.innerHTML = "";

  if (!state.tasks.length) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "task-ticket";
    emptyItem.textContent = "No task tickets yet.";
    target.append(emptyItem);
    return;
  }

  state.tasks.forEach((task) => {
    const item = document.createElement("li");
    item.className = "task-ticket";
    if (task.done) item.classList.add("done");
    if (task.id === state.currentTaskId && !task.done) item.classList.add("current");

    const taskName = document.createElement("span");
    taskName.textContent = task.done ? `${task.name} - complete` : task.name;
    item.append(taskName);

    if (removable) {
      const removeButton = document.createElement("button");
      removeButton.className = "remove-task";
      removeButton.type = "button";
      removeButton.textContent = "X";
      removeButton.setAttribute("aria-label", `Remove ${task.name}`);
      removeButton.addEventListener("click", () => removeTask(task.id));
      item.append(removeButton);
    }

    target.append(item);
  });
}

function renderPrizes() {
  prizes.innerHTML = "";
  prizePool.forEach((prizeData, index) => {
    const prize = document.createElement("div");
    prize.className = "prize";
    prize.style.setProperty("--tilt", `${index % 2 === 0 ? -1 : 1}deg`);
    prize.style.left = `${prizeData.x}%`;
    prize.style.bottom = `${prizeData.bottom}px`;
    prize.style.background = prizeData.color;
    prize.dataset.prize = prizeData.name;
    prize.dataset.x = prizeData.x;

    const icon = document.createElement("span");
    icon.className = "prize-icon";
    icon.textContent = prizeData.icon;

    const label = document.createElement("span");
    label.className = "prize-label";
    label.textContent = prizeData.name;

    prize.append(icon, label);
    prizes.append(prize);
  });
}

function updateStats() {
  const done = state.tasks.filter((task) => task.done).length;
  const total = state.tasks.length;
  const percent = total ? Math.round((done / total) * 100) : 0;

  coinCount.textContent = state.coins;
  doneCount.textContent = done;
  totalCount.textContent = total;
  progressFill.style.width = `${percent}%`;
  progressText.textContent = `${percent}%`;

  const active = currentTaskRecord();
  currentTask.textContent = active
    ? active.name
    : remainingTasks().length
      ? "Spin the wheel to choose the next task."
      : "The task list is clear.";

  completeTaskButton.disabled = !active;
  skipTaskButton.disabled = !active || remainingTasks().length < 2;
  const clawControlsDisabled = state.coins < 1 || state.clawLocked || Boolean(active);
  moveLeftButton.disabled = clawControlsDisabled || state.clawPosition <= 10;
  moveRightButton.disabled = clawControlsDisabled || state.clawPosition >= 90;
  dropClawButton.disabled = clawControlsDisabled;
  spinButton.disabled = state.wheelLocked
    || remainingTasks().length === 0
    || Boolean(active)
    || !state.clawPlayedForTurn;

  if (remainingTasks().length === 0 && total > 0) {
    winPanel.classList.remove("hidden");
    spinButton.disabled = true;
    completeTaskButton.disabled = true;
    skipTaskButton.disabled = true;
  } else {
    winPanel.classList.add("hidden");
  }
}

function renderWheelSlices() {
  const remaining = remainingTasks();
  const colors = ["#ff4e9a", "#fff55c", "#19b8ff", "#1fc486", "#ff9c1a", "#7e4cff", "#ffffff", "#ff3d47"];

  if (!remaining.length) {
    wheel.style.background = "#ffffff";
    return;
  }

  const slice = 360 / remaining.length;
  const stops = remaining.map((_, index) => {
    const color = colors[index % colors.length];
    return `${color} ${index * slice}deg ${(index + 1) * slice}deg`;
  });
  wheel.style.background = `conic-gradient(${stops.join(", ")})`;
}

function render() {
  renderTaskList(setupTaskList, true);
  renderTaskList(arcadeTaskList);
  renderWheelSlices();
  startButton.disabled = state.tasks.length === 0;
  updateStats();
}

function startArcade() {
  if (!state.tasks.length) return;
  setupPanel.classList.add("hidden");
  arcadePanel.classList.remove("hidden");
  state.clawPlayedForTurn = false;
  state.clawPosition = 50;
  claw.style.setProperty("--claw-x", `${state.clawPosition}%`);
  wheelMessage.textContent = "Play the claw machine to unlock the task wheel.";
  renderPrizes();
  render();
}

function spinWheel() {
  if (state.wheelLocked || currentTaskRecord()) return;

  const selected = chooseRandomTask();
  if (!selected) return;

  state.wheelLocked = true;
  spinButton.disabled = true;
  wheelMessage.textContent = "Round and round the task wheel goes...";

  const remaining = remainingTasks();
  const selectedIndex = remaining.findIndex((task) => task.id === selected.id);
  const slice = 360 / remaining.length;
  const targetAngle = 360 - (selectedIndex * slice + slice / 2);
  state.wheelRotation += 1440 + targetAngle;
  wheel.style.transform = `rotate(${state.wheelRotation}deg)`;

  window.setTimeout(() => {
    state.currentTaskId = selected.id;
    state.wheelLocked = false;
    wheelMessage.textContent = `The wheel picked: ${selected.name}`;
    render();
  }, 3100);
}

function completeCurrentTask() {
  const active = currentTaskRecord();
  if (!active) return;

  active.done = true;
  state.currentTaskId = null;
  state.coins += 2;
  state.clawPlayedForTurn = remainingTasks().length === 0;
  wheelMessage.textContent = remainingTasks().length
    ? "Task cashed in. Play the claw to unlock the next spin."
    : "That was the last ticket.";
  clawMessage.textContent = "Two fresh coins dropped into the machine.";
  render();
}

function skipCurrentTask() {
  if (!currentTaskRecord()) return;
  state.currentTaskId = null;
  state.clawPlayedForTurn = true;
  wheelMessage.textContent = "Ticket parked. Spin another ticket when ready.";
  render();
}

function moveClaw(direction) {
  if (state.clawLocked || state.coins < 1 || currentTaskRecord()) return;

  state.clawPosition = Math.max(8, Math.min(92, state.clawPosition + direction * 8));
  claw.style.setProperty("--claw-x", `${state.clawPosition}%`);
  clawMessage.textContent = direction < 0 ? "Claw moved left. Line it up!" : "Claw moved right. Line it up!";
  render();
}

function dropClaw() {
  if (state.coins < 1 || state.clawLocked) return;

  state.coins -= 1;
  state.clawLocked = true;
  claw.classList.remove("drop");
  clawMessage.textContent = "Claw dropping...";
  render();

  window.requestAnimationFrame(() => {
    claw.classList.add("drop");
  });

  window.setTimeout(() => {
    const prizeElements = [...document.querySelectorAll(".prize:not(.won)")];
    const aimedPrize = prizeElements
      .map((prize) => ({
        element: prize,
        distance: Math.abs(Number(prize.dataset.x) - state.clawPosition)
      }))
      .filter((target) => target.distance <= 8)
      .sort((a, b) => a.distance - b.distance)[0];
    const gripHeld = Math.random() > 0.42;

    if (aimedPrize && gripHeld) {
      aimedPrize.element.classList.add("won");
      state.coins += 1;
      clawMessage.textContent = `${aimedPrize.element.dataset.prize} grabbed! Bonus coin earned.`;
    } else {
      const nearMisses = [
        aimedPrize ? "You lined it up, but the grip slipped at the last second." : "The claw missed. Move it closer to a prize before dropping.",
        aimedPrize ? "Great aim, weak grip. The machine kept that one." : "Almost. Try lining the claw over the center of a prize.",
        aimedPrize ? "The prize wobbled loose. Classic arcade drama." : "No prize under the claw. Aim first, then drop."
      ];
      clawMessage.textContent = nearMisses[Math.floor(Math.random() * nearMisses.length)];
    }

    state.clawPlayedForTurn = true;
    state.clawLocked = false;
    claw.classList.remove("drop");
    if (!currentTaskRecord() && remainingTasks().length) {
      wheelMessage.textContent = "Claw round finished. The task wheel is unlocked.";
    }
    render();
  }, 1300);
}

function resetGame() {
  state.tasks = [];
  state.currentTaskId = null;
  state.coins = 3;
  state.wheelRotation = 0;
  state.clawLocked = false;
  state.wheelLocked = false;
  state.clawPlayedForTurn = false;
  state.clawPosition = 50;
  wheel.style.transform = "rotate(0deg)";
  claw.style.setProperty("--claw-x", `${state.clawPosition}%`);
  setupPanel.classList.remove("hidden");
  arcadePanel.classList.add("hidden");
  taskInput.focus();
  render();
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addTask(taskInput.value);
});

startButton.addEventListener("click", startArcade);
spinButton.addEventListener("click", spinWheel);
completeTaskButton.addEventListener("click", completeCurrentTask);
skipTaskButton.addEventListener("click", skipCurrentTask);
moveLeftButton.addEventListener("click", () => moveClaw(-1));
moveRightButton.addEventListener("click", () => moveClaw(1));
dropClawButton.addEventListener("click", dropClaw);
resetButton.addEventListener("click", resetGame);

document.addEventListener("keydown", (event) => {
  if (arcadePanel.classList.contains("hidden")) return;
  if (event.key === "ArrowLeft") moveClaw(-1);
  if (event.key === "ArrowRight") moveClaw(1);
  if (event.key === " " || event.key === "Enter") dropClaw();
});

render();
