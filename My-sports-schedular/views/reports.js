/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
function filterDate(startDate, endDate) {
  window.location.href = `/sports/reports/insights/${startDate.toISOString()}/${endDate.toISOString()}`;
}

function getInsights(sportName) {
  const urlParams = new URLSearchParams(window.location.search);
  const startDate = urlParams.get("startDate");
  const endDate = urlParams.get("endDate");
  if (startDate !== null && endDate !== null) {
    window.location.href = `/sports/reports/${sportName}/insights?startDate=${startDate}&endDate=${endDate}`;
  } else {
    window.location.href = `/sports/reports/${sportName}/insights`;
  }
}

const chartData = {
  labels: sports_Name,
  data: sportPercentage,
};
const chart = document.querySelector(".chart");
const ul = document.querySelector(".stats-content .details ul");

new Chart(chart, {
  type: "doughnut",
  data: {
    labels: chartData.labels,
    datasets: [
      {
        label: "Popular Sport",
        data: chartData.data,
      },
    ],
  },
  options: {
    borderWidth: 10,
    borderRadius: 2,
    hoverBorderWidth: 0,
    plugins: {
      legend: {
        display: false,
      },
    },
  },
});

const populateUl = () => {
  chartData.labels.forEach((l, i) => {
    let li = document.createElement("li");
    li.innerHTML = `${l}: <span class'percentage'>${chartData.data[i]}</span>`;
    ul.appendChild(li);
  });
};
