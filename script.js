"use strict";

const fields = {
  startingAmount: document.querySelector("#startingAmount"),
  monthlyContribution: document.querySelector("#monthlyContribution"),
  goalAmount: document.querySelector("#goalAmount"),
  annualReturn: document.querySelector("#annualReturn"),
  years: document.querySelector("#years"),
};

const monthlyField = document.querySelector("#monthlyField");
const goalField = document.querySelector("#goalField");
const errorMessage = document.querySelector("#errorMessage");
const monthlyResultCard = document.querySelector("#monthlyResultCard");
const yearTableBody = document.querySelector("#yearTableBody");
const modeButtons = document.querySelectorAll(".mode-button");

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

let mode = "monthly";
let growthChart = null;

function formatMoney(value) {
  return moneyFormatter.format(value);
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
}

function clearError() {
  errorMessage.textContent = "";
  errorMessage.hidden = true;
}

function readNumber(input, label, { minimum = 0, integer = false } = {}) {
  const rawValue = input.value.trim();

  if (rawValue === "") {
    throw new Error(`Please enter ${label.toLowerCase()}.`);
  }

  const value = Number(rawValue);

  if (!Number.isFinite(value)) {
    throw new Error(`Please enter a valid ${label.toLowerCase()}.`);
  }

  if (value < minimum) {
    throw new Error(`${label} must be ${minimum === 0 ? "zero or more" : "greater than zero"}.`);
  }

  if (integer && !Number.isInteger(value)) {
    throw new Error(`${label} must be a whole number.`);
  }

  return value;
}

function calculateRequiredMonthlyPayment(start, goal, monthlyRate, months) {
  const startingBalanceAtEnd = start * Math.pow(1 + monthlyRate, months);

  // If the starting balance alone reaches the goal, no deposits are needed.
  if (startingBalanceAtEnd >= goal) {
    return 0;
  }

  const growthFactor = monthlyRate === 0
    ? months
    : (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;

  const exactPayment = (goal - startingBalanceAtEnd) / growthFactor;

  // Round up to cents so the modeled savings reaches, rather than misses, the goal.
  return Math.ceil((exactPayment - 1e-10) * 100) / 100;
}

function buildSchedule(start, monthlyPayment, annualRate, years) {
  const monthlyRate = annualRate / 100 / 12;
  const months = years * 12;
  const points = [{ year: 0, contributed: start, interest: 0, balance: start }];
  let balance = start;

  for (let month = 1; month <= months; month += 1) {
    // Interest is added first; the month's contribution is deposited at month end.
    balance *= 1 + monthlyRate;
    balance += monthlyPayment;

    if (month % 12 === 0) {
      const contributed = start + monthlyPayment * month;
      points.push({
        year: month / 12,
        contributed,
        interest: balance - contributed,
        balance,
      });
    }
  }

  return points;
}

function renderTable(points) {
  const rows = points.slice(1).map((point) => {
    const row = document.createElement("tr");

    [String(point.year), formatMoney(point.contributed), formatMoney(point.interest), formatMoney(point.balance)]
      .forEach((value) => {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.append(cell);
      });

    return row;
  });

  yearTableBody.replaceChildren(...rows);
}

function renderChart(points) {
  const canvas = document.querySelector("#growthChart");
  const labels = points.map((point) => point.year === 0 ? "Now" : `Year ${point.year}`);
  const contributions = points.map((point) => point.contributed);
  const interest = points.map((point) => point.interest);

  if (growthChart) {
    growthChart.data.labels = labels;
    growthChart.data.datasets[0].data = contributions;
    growthChart.data.datasets[1].data = interest;
    growthChart.update();
    return;
  }

  growthChart = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Contributions",
          data: contributions,
          borderColor: "#1c7c68",
          backgroundColor: "#1c7c68",
          borderWidth: 3,
          pointRadius: 2,
          pointHoverRadius: 5,
          tension: 0.25,
        },
        {
          label: "Interest earned",
          data: interest,
          borderColor: "#79b8a5",
          backgroundColor: "#79b8a5",
          borderWidth: 3,
          pointRadius: 2,
          pointHoverRadius: 5,
          tension: 0.25,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: "index" },
      plugins: {
        legend: {
          position: "bottom",
          labels: { usePointStyle: true, boxWidth: 8, padding: 18 },
        },
        tooltip: {
          callbacks: {
            label(context) {
              return `${context.dataset.label}: ${formatMoney(context.parsed.y)}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: "#66736f" },
        },
        y: {
          beginAtZero: true,
          grid: { color: "#edf1ef" },
          ticks: {
            color: "#66736f",
            callback(value) {
              return new Intl.NumberFormat("en-US", {
                notation: "compact",
                maximumFractionDigits: 1,
              }).format(value);
            },
          },
        },
      },
    },
  });
}

function updateResults() {
  try {
    clearError();

    const start = readNumber(fields.startingAmount, "Starting amount");
    const annualRate = readNumber(fields.annualReturn, "Annual return");
    const years = readNumber(fields.years, "Number of years", { minimum: 1, integer: true });

    if (years > 100) {
      throw new Error("Number of years must be 100 or less.");
    }

    const months = years * 12;
    const monthlyRate = annualRate / 100 / 12;
    let monthlyPayment;

    if (mode === "goal") {
      const goal = readNumber(fields.goalAmount, "Savings goal", { minimum: 0.01 });
      monthlyPayment = calculateRequiredMonthlyPayment(start, goal, monthlyRate, months);
      monthlyResultCard.hidden = false;
      document.querySelector("#monthlyNeeded").textContent = formatMoney(monthlyPayment);
    } else {
      monthlyPayment = readNumber(fields.monthlyContribution, "Monthly contribution");
      monthlyResultCard.hidden = true;
    }

    const points = buildSchedule(start, monthlyPayment, annualRate, years);
    const finalPoint = points[points.length - 1];
    const totalContributed = start + monthlyPayment * months;

    document.querySelector("#finalBalance").textContent = formatMoney(finalPoint.balance);
    document.querySelector("#totalContributed").textContent = formatMoney(totalContributed);
    document.querySelector("#interestEarned").textContent = formatMoney(finalPoint.interest);
    document.querySelector("#finalCaption").textContent = `After ${years} ${years === 1 ? "year" : "years"}`;

    renderTable(points);
    renderChart(points);
  } catch (error) {
    showError(error.message);
  }
}

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    mode = button.dataset.mode;
    const isGoalMode = mode === "goal";

    monthlyField.hidden = isGoalMode;
    goalField.hidden = !isGoalMode;

    modeButtons.forEach((modeButton) => {
      const isActive = modeButton === button;
      modeButton.classList.toggle("is-active", isActive);
      modeButton.setAttribute("aria-pressed", String(isActive));
    });

    updateResults();
  });
});

Object.values(fields).forEach((input) => {
  input.addEventListener("input", updateResults);
});

updateResults();