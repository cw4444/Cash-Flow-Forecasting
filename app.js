const data = {
  balance: 48250,
  inflow: 18750,
  outflow: 29400,
  monthly: [
    { month: "Apr", change: -6200 },
    { month: "May", change: -8300 },
    { month: "Jun", change: -9100 },
    { month: "Jul", change: -12800 },
    { month: "Aug", change: -7600 },
    { month: "Sep", change: -5400 },
  ],
};

const balanceValue = document.getElementById("balance-value");
const inflowValue = document.getElementById("inflow-value");
const outflowValue = document.getElementById("outflow-value");
const worstMonth = document.getElementById("worst-month");
const runwayDays = document.getElementById("runway-days");
const snapshotList = document.getElementById("snapshot-list");
const canvas = document.getElementById("chart");
const ctx = canvas.getContext("2d");

function money(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

function forecastBalance() {
  let running = data.balance;
  const points = [{ label: "Now", value: running }];

  data.monthly.forEach((item) => {
    running += item.change;
    points.push({ label: item.month, value: running });
  });

  return points;
}

function calculateRunway(points) {
  let days = 0;
  let cash = points[0].value;

  while (cash > 0 && days < 180) {
    days += 1;
    cash += data.monthly[0].change / 30;
  }

  return days;
}

function renderStats(points) {
  balanceValue.textContent = money(data.balance);
  inflowValue.textContent = money(data.inflow);
  outflowValue.textContent = money(data.outflow);
  worstMonth.textContent = `${data.monthly
    .slice()
    .sort((a, b) => a.change - b.change)[0].month} ${money(
    Math.abs(data.monthly.slice().sort((a, b) => a.change - b.change)[0].change,
  ))}`;
  runwayDays.textContent = calculateRunway(points);

  snapshotList.innerHTML = points
    .map((point) => {
      const tone = point.value < 0 ? "bad" : point.value < 15000 ? "warn" : "good";
      return `
        <div class="snapshot-item">
          <div>
            <strong>${point.label}</strong>
            <span>Projected cash position</span>
          </div>
          <strong class="${tone}">${money(point.value)}</strong>
        </div>
      `;
    })
    .join("");
}

function drawChart(points) {
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = "#09111d";
  ctx.fillRect(0, 0, width, height);

  const padding = 54;
  const max = Math.max(...points.map((p) => p.value), 1);
  const min = Math.min(...points.map((p) => p.value), 0);
  const range = max - min || 1;

  ctx.strokeStyle = "rgba(153, 166, 195, 0.14)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i += 1) {
    const y = padding + ((height - padding * 2) / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }

  const coords = points.map((point, index) => {
    const x = padding + ((width - padding * 2) / (points.length - 1)) * index;
    const y = height - padding - ((point.value - min) / range) * (height - padding * 2);
    return { x, y, ...point };
  });

  ctx.strokeStyle = "#7fd1ff";
  ctx.lineWidth = 4;
  ctx.beginPath();
  coords.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();

  const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
  gradient.addColorStop(0, "rgba(127, 209, 255, 0.26)");
  gradient.addColorStop(1, "rgba(127, 209, 255, 0.02)");
  ctx.lineTo(coords[coords.length - 1].x, height - padding);
  ctx.lineTo(coords[0].x, height - padding);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  coords.forEach((p) => {
    ctx.beginPath();
    ctx.fillStyle = p.value < 0 ? "#ff7f8a" : "#77f0b3";
    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "#99a6c3";
  ctx.font = "600 18px Manrope";
  coords.forEach((p) => {
    ctx.fillText(p.label, p.x - 16, height - 20);
  });
}

function recalc() {
  const points = forecastBalance();
  renderStats(points);
  drawChart(points);
}

document.getElementById("recalc-btn").addEventListener("click", recalc);

recalc();
