// -------------------- Chart Setup --------------------
const ctx = document.getElementById("priceChart").getContext("2d");

let priceData = [100]; // starting price
let labels = [0]; // round/time labels
let round = 1;

// Chart.js line chart
const chart = new Chart(ctx, {
  type: "line",
  data: {
    labels: labels,
    datasets: [{
      label: "Price",
      data: priceData,
      borderColor: "#00d27a",
      backgroundColor: "rgba(0,210,122,0.1)",
      fill: true,
      tension: 0.4,
      borderWidth: 2
    }]
  },
  options: {
    animation: false,
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { display: false },
      y: { ticks: { color: "#9fb0bd" }, grid: { color: "rgba(255,255,255,0.05)" } }
    }
  }
});

// -------------------- Price Update --------------------
function updatePrice() {
  const lastPrice = priceData[priceData.length - 1];
  const change = (Math.random() - 0.5) * 2; // random movement
  const newPrice = Math.max(50, lastPrice + change);

  priceData.push(newPrice.toFixed(2));
  labels.push(round++);
  if (priceData.length > 30) {
    priceData.shift();
    labels.shift();
  }

  chart.data.labels = labels;
  chart.data.datasets[0].data = priceData;
  chart.data.datasets[0].borderColor = (change >= 0) ? "#00d27a" : "#ff4d4f";
  chart.data.datasets[0].backgroundColor = (change >= 0)
    ? "rgba(0,210,122,0.1)"
    : "rgba(255,77,79,0.1)";

  chart.update();

  // floating price update
  document.querySelector(".floating").textContent = `$${newPrice.toFixed(2)}`;
}

// -------------------- Bots / Players --------------------
function addPlayer(lane, name, amount, isUp) {
  const list = document.getElementById(lane);
  const div = document.createElement("div");
  div.className = "bot";

  div.innerHTML = `
    <div class="avatar" style="background:${isUp ? "#00d27a33" : "#ff4d4f33"}">
      ${name[0].toUpperCase()}
    </div>
    <div>
      <div class="meta">${name}</div>
      <div class="amt">$${amount}</div>
    </div>
  `;

  list.prepend(div);

  // update total
  const totalEl = document.querySelector(`.lane.${lane} .lane-total span`);
  const oldTotal = parseFloat(totalEl.textContent);
  totalEl.textContent = (oldTotal + amount).toFixed(2);

  // activity log
  addActivity(`${name} bet $${amount} on ${isUp ? "UP" : "DOWN"}`);
}

function randomPlayer() {
  const names = ["Alex", "Sam", "John", "Ravi", "Priya", "Amit", "Liam", "Noah", "Emma", "Sophia"];
  const name = names[Math.floor(Math.random() * names.length)];
  const amount = (Math.random() * 100).toFixed(2);
  const isUp = Math.random() > 0.5;
  addPlayer(isUp ? "upBotsList" : "downBotsList", name, parseFloat(amount), isUp);
}

// -------------------- Activity --------------------
function addActivity(msg) {
  const act = document.querySelector(".activity");
  const row = document.createElement("div");
  row.className = "row";
  row.textContent = msg;
  act.prepend(row);
}

// -------------------- Controls --------------------
document.getElementById("betUp").addEventListener("click", () => {
  const amt = parseFloat(document.getElementById("betAmt").value || "10");
  addPlayer("upBotsList", "YOU", amt, true);
});
document.getElementById("betDown").addEventListener("click", () => {
  const amt = parseFloat(document.getElementById("betAmt").value || "10");
  addPlayer("downBotsList", "YOU", amt, false);
});

// -------------------- Intervals --------------------
setInterval(updatePrice, 2000); // update chart every 2s
setInterval(randomPlayer, 4000); // add random player every 4s
