// Service Worker Registration
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("sw.js")
      .then((registration) =>
        console.log("Service Worker registered successfully")
      )
      .catch((err) => console.log("Service Worker registration failed:", err));
  });
}

let entries = [];
let progressChart = null;

function loadEntries() {
  const stored = localStorage.getItem("fundoplicationEntries");
  if (stored) {
    entries = JSON.parse(stored);
  }
  displayEntries();
}

function saveEntries() {
  localStorage.setItem("fundoplicationEntries", JSON.stringify(entries));
}

function showTab(tabName) {
  document
    .querySelectorAll(".tab")
    .forEach((tab) => tab.classList.remove("active"));
  document
    .querySelectorAll(".tab-content")
    .forEach((content) => content.classList.remove("active"));

  event.target.classList.add("active");
  document.getElementById(tabName).classList.add("active");

  if (tabName === "view-entries") {
    displayEntries();
  } else if (tabName === "progress") {
    renderProgressChart();
  }
}

document.getElementById("entryForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const entry = {
    id: Date.now(),
    date: document.getElementById("entryDate").value,
    foods: document.getElementById("foods").value,
    medicines: document.getElementById("medicines").value,
    symptoms: document.getElementById("symptoms").value,
    feeling: document.getElementById("feeling").value,
    notes: document.getElementById("notes").value,
  };

  entries.unshift(entry);
  saveEntries();

  this.reset();
  document.getElementById("entryDate").valueAsDate = new Date();

  alert("Entry saved successfully!");
});

function displayEntries() {
  const container = document.getElementById("entriesList");

  if (entries.length === 0) {
    container.innerHTML = `
            <div class="empty-state">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <h3>No entries yet</h3>
                <p>Start tracking your recovery by adding your first entry</p>
            </div>
        `;
    return;
  }

  container.innerHTML = entries
    .map(
      (entry) => `
        <div class="entry-card">
            <div class="entry-header">
                <span class="entry-date">${formatDate(entry.date)}</span>
                <div class="entry-actions">
                    <span class="entry-feeling feeling-${
                      entry.feeling
                    }">${capitalizeFirst(entry.feeling)}</span>
                    <button class="btn-edit" onclick="editEntry(${
                      entry.id
                    })">Edit</button>
                    <button class="delete-btn" onclick="deleteEntry(${
                      entry.id
                    })">Delete</button>
                </div>
            </div>
            
            ${
              entry.foods
                ? `
                <div class="entry-section">
                    <h4>🍽️ Foods Eaten</h4>
                    <p>${entry.foods}</p>
                </div>
            `
                : ""
            }
            
            ${
              entry.medicines
                ? `
                <div class="entry-section">
                    <h4>💊 Medications</h4>
                    <p>${entry.medicines}</p>
                </div>
            `
                : ""
            }
            
            ${
              entry.symptoms
                ? `
                <div class="entry-section">
                    <h4>⚠️ Symptoms</h4>
                    <p>${entry.symptoms}</p>
                </div>
            `
                : ""
            }
            
            ${
              entry.notes
                ? `
                <div class="entry-section">
                    <h4>📝 Notes</h4>
                    <p>${entry.notes}</p>
                </div>
            `
                : ""
            }
        </div>
    `
    )
    .join("");
}

function deleteEntry(id) {
  if (confirm("Are you sure you want to delete this entry?")) {
    entries = entries.filter((entry) => entry.id !== id);
    saveEntries();
    displayEntries();
  }
}

function editEntry(id) {
  const entry = entries.find((e) => e.id === id);
  if (!entry) return;

  document.getElementById("entryDate").value = entry.date;
  document.getElementById("foods").value = entry.foods;
  document.getElementById("medicines").value = entry.medicines;
  document.getElementById("symptoms").value = entry.symptoms;
  document.getElementById("feeling").value = entry.feeling;
  document.getElementById("notes").value = entry.notes;

  entries = entries.filter((e) => e.id !== id);
  saveEntries();

  document
    .querySelectorAll(".tab")
    .forEach((tab) => tab.classList.remove("active"));
  document
    .querySelectorAll(".tab-content")
    .forEach((content) => content.classList.remove("active"));
  document.querySelector(".tab:first-child").classList.add("active");
  document.getElementById("new-entry").classList.add("active");

  window.scrollTo({ top: 0, behavior: "smooth" });

  alert("Entry loaded for editing. Make your changes and click Save Entry.");
}

function formatDate(dateString) {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function renderProgressChart() {
  if (entries.length === 0) {
    const canvas = document.getElementById("progressChart");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "16px Segoe UI";
    ctx.fillStyle = "#999";
    ctx.textAlign = "center";
    ctx.fillText(
      "No data to display yet. Add some entries to see your progress!",
      canvas.width / 2,
      canvas.height / 2
    );
    return;
  }

  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  const feelingValues = {
    poor: 1,
    okay: 2,
    good: 3,
    great: 4,
  };

  const firstDate = new Date(sortedEntries[0].date + "T00:00:00");

  const labels = sortedEntries.map((entry) => {
    const date = new Date(entry.date + "T00:00:00");
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });

  const actualData = sortedEntries.map((entry) => feelingValues[entry.feeling]);

  const expectedData = sortedEntries.map((entry) => {
    const date = new Date(entry.date + "T00:00:00");
    const daysSinceSurgery = Math.floor(
      (date - firstDate) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceSurgery <= 14) {
      return 1 + (daysSinceSurgery / 14) * 1;
    } else if (daysSinceSurgery <= 28) {
      return 2 + ((daysSinceSurgery - 14) / 14) * 1;
    } else if (daysSinceSurgery <= 56) {
      return 3 + ((daysSinceSurgery - 28) / 28) * 0.5;
    } else {
      return 3.5 + Math.min((daysSinceSurgery - 56) / 28, 0.5);
    }
  });

  if (progressChart) {
    progressChart.destroy();
  }

  const ctx = document.getElementById("progressChart").getContext("2d");
  progressChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Your Progress",
          data: actualData,
          borderColor: "#11998e",
          backgroundColor: "rgba(17, 153, 142, 0.1)",
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: "#11998e",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
        },
        {
          label: "Expected Recovery",
          data: expectedData,
          borderColor: "#ffa726",
          backgroundColor: "rgba(255, 167, 38, 0.05)",
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0.4,
          fill: false,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: "#ffa726",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: "top",
          labels: {
            usePointStyle: true,
            padding: 15,
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const feelingNames = ["", "Poor", "Okay", "Good", "Great"];
              const value = Math.round(context.parsed.y);
              if (context.datasetIndex === 0) {
                return "Your Feeling: " + feelingNames[value];
              } else {
                return "Expected: " + feelingNames[value];
              }
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          min: 0,
          max: 4,
          ticks: {
            stepSize: 1,
            callback: function (value) {
              const labels = ["", "Poor", "Okay", "Good", "Great"];
              return labels[value] || "";
            },
          },
          grid: {
            color: "rgba(0, 0, 0, 0.05)",
          },
        },
        x: {
          grid: {
            display: false,
          },
        },
      },
    },
  });
}

function exportToPDF() {
  if (entries.length === 0) {
    alert("No entries to export. Please add some entries first.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let yPos = 20;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const lineHeight = 7;

  doc.setFontSize(18);
  doc.setFont(undefined, "bold");
  doc.text("Nissen Fundoplication Recovery Journal", margin, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPos);
  yPos += 15;

  doc.setFontSize(14);
  doc.setFont(undefined, "bold");
  doc.text("Recovery Progress Chart", margin, yPos);
  yPos += 10;

  const canvas = document.getElementById("progressChart");
  if (canvas) {
    const chartImage = canvas.toDataURL("image/png");
    const imgWidth = 170;
    const imgHeight = 80;
    doc.addImage(chartImage, "PNG", margin, yPos, imgWidth, imgHeight);
    yPos += imgHeight + 15;
  }

  if (yPos > pageHeight - 40) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.setFont(undefined, "bold");
  doc.text("Daily Entries", margin, yPos);
  yPos += 10;

  entries.forEach((entry, index) => {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.text(formatDate(entry.date), margin, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont(undefined, "italic");
    doc.text(
      `Overall Feeling: ${capitalizeFirst(entry.feeling)}`,
      margin,
      yPos
    );
    yPos += 10;

    doc.setFont(undefined, "normal");

    if (entry.foods) {
      doc.setFont(undefined, "bold");
      doc.text("Foods Eaten:", margin, yPos);
      yPos += 5;
      doc.setFont(undefined, "normal");
      const foodLines = doc.splitTextToSize(entry.foods, 170);
      foodLines.forEach((line) => {
        if (yPos > pageHeight - 20) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, margin + 5, yPos);
        yPos += lineHeight;
      });
      yPos += 3;
    }

    if (entry.medicines) {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFont(undefined, "bold");
      doc.text("Medications:", margin, yPos);
      yPos += 5;
      doc.setFont(undefined, "normal");
      const medLines = doc.splitTextToSize(entry.medicines, 170);
      medLines.forEach((line) => {
        if (yPos > pageHeight - 20) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, margin + 5, yPos);
        yPos += lineHeight;
      });
      yPos += 3;
    }

    if (entry.symptoms) {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFont(undefined, "bold");
      doc.text("Symptoms:", margin, yPos);
      yPos += 5;
      doc.setFont(undefined, "normal");
      const sympLines = doc.splitTextToSize(entry.symptoms, 170);
      sympLines.forEach((line) => {
        if (yPos > pageHeight - 20) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, margin + 5, yPos);
        yPos += lineHeight;
      });
      yPos += 3;
    }

    if (entry.notes) {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFont(undefined, "bold");
      doc.text("Additional Notes:", margin, yPos);
      yPos += 5;
      doc.setFont(undefined, "normal");
      const noteLines = doc.splitTextToSize(entry.notes, 170);
      noteLines.forEach((line) => {
        if (yPos > pageHeight - 20) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, margin + 5, yPos);
        yPos += lineHeight;
      });
      yPos += 3;
    }

    yPos += 10;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, 190, yPos);
    yPos += 10;
  });

  doc.save("fundoplication-recovery-journal.pdf");
}

document.getElementById("entryDate").valueAsDate = new Date();
loadEntries();
