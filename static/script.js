// ==== Chart Setup ====
const ctx = document.getElementById("priceChart").getContext("2d");
let price = 100; // starting price
let priceData = [price];
let labels = [0];

const chart = new Chart(ctx, {
  type: "line",
  data: {
    labels: labels,
    datasets: [{
      data: priceData,
      borderColor: "#00d27a",
      borderWidth: 2,
      fill: true,
      backgroundColor: "rgba(0,210,122,0.1)",
      tension: 0.4
    }]
  },
  options: {
    responsive: true,
    animation: false,
    plugins: { legend: { display: false } },
    scales: { x: { display: false }, y: { display: false } }
  }
});

// ==== Game Variables ====
let balance = 1000;
let round = 1;
let timer = 20;
let gameInterval;
let resultPhase = false;

const balanceEl = document.getElementById("balance");
const upTotalEl = document.getElementById("upTotal");
const downTotalEl = document.getElementById("downTotal");
const upBotsList = document.getElementById("upBotsList");
const downBotsList = document.getElementById("downBotsList");
const activityEl = document.getElementById("activity");

let upTotal = 0;
let downTotal = 0;

// ==== Price Movement ====
function updatePrice() {
  const change = (Math.random() - 0.5) * 2;
  price += change;
  if (price < 50) price = 50;

  priceData.push(price);
  labels.push(labels.length);

  if (priceData.length > 50) {
    priceData.shift();
    labels.shift();
  }

  chart.data.datasets[0].borderColor = change >= 0 ? "#00d27a" : "#ff4d4f";
  chart.data.datasets[0].backgroundColor =
    change >= 0 ? "rgba(0,210,122,0.1)" : "rgba(255,77,79,0.1)";
  chart.update();
}

// ==== Timer & Rounds ====
function startGame() {
  resetRound();
  gameInterval = setInterval(() => {
    if (!resultPhase) {
      timer--;
      updatePrice();
      if (timer <= 0) {
        showResult();
      }
    }
  }, 1000);
}

function resetRound() {
  timer = 20;
  resultPhase = false;
  upTotal = 0;
  downTotal = 0;
  upBotsList.innerHTML = "";
  downBotsList.innerHTML = "";
  upTotalEl.textContent = "0.00";
  downTotalEl.textContent = "0.00";
  document.getElementById("roundNumber").textContent = round;
  document.getElementById("timer").textContent = timer;
}

function showResult() {
  resultPhase = true;
  const result = priceData[priceData.length - 1] >= priceData[0] ? "UP" : "DOWN";

  addActivity(`Round ${round} Result: ${result}`);

  setTimeout(() => {
    round++;
    resetRound();
  }, 5000);
}

// ==== Bets ====
function placeBet(side) {
  if (resultPhase) return alert("Wait for next round!");

  const amount = parseFloat(document.getElementById("betAmount").value);
  if (isNaN(amount) || amount <= 0) return alert("Enter valid amount!");
  if (amount > balance) return alert("Not enough balance!");

  balance -= amount;
  balanceEl.textContent = balance.toFixed(2);

  const player = `Player${Math.floor(Math.random() * 1000)}`;
  const entry = `<div class="bot">
    <div class="avatar">${player[0]}</div>
    <div class="meta">${player}</div>
    <div class="amt">$${amount}</div>
  </div>`;

  if (side === "UP") {
    upTotal += amount;
    upTotalEl.textContent = upTotal.toFixed(2);
    upBotsList.innerHTML = entry + upBotsList.innerHTML;
  } else {
    downTotal += amount;
    downTotalEl.textContent = downTotal.toFixed(2);
    downBotsList.innerHTML = entry + downBotsList.innerHTML;
  }

  addActivity(`${player} bet $${amount} on ${side}`);
}

// ==== Activity ====
function addActivity(text) {
  const row = `<div class="row"><span>${text}</span></div>`;
  activityEl.innerHTML = row + activityEl.innerHTML;
}

// ==== Init ====
document.getElementById("betUp").addEventListener("click", () => placeBet("UP"));
document.getElementById("betDown").addEventListener("click", () => placeBet("DOWN"));

balanceEl.textContent = balance.toFixed(2);
startGame();
