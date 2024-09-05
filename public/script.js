document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("dataForm");
  const dataTable = document
    .getElementById("dataTable")
    .getElementsByTagName("tbody")[0];
  const ctx = document.getElementById("expenseChart").getContext("2d");

  let data = [];
  let myPieChart;

  // Fetch categories and populate dropdown
  fetch("/categories")
    .then((response) => response.json())
    .then((categories) => {
      const categorySelect = document.getElementById("category");
      categories.forEach((category) => {
        const option = document.createElement("option");
        option.value = category.id;
        option.textContent = category.name;
        categorySelect.appendChild(option);
      });
    })
    .catch((error) => console.error("Error fetching categories:", error));

  // Fetch existing expenses
  fetch("/expenses")
    .then((response) => response.json())
    .then((expenses) => {
      data = expenses.map((expense) => ({
        type: expense.categoryId, // Adjust based on how your expenses data is structured
        amount: expense.amount,
        date: new Date(expense.createdAt).toLocaleDateString(),
      }));
      updateTable();
      updateChart();
    })
    .catch((error) => console.error("Error fetching expenses:", error));

  function updateTable() {
    dataTable.innerHTML = "";
    data.forEach((entry, index) => {
      const row = dataTable.insertRow();
      row.insertCell(0).innerText = entry.type; // Will be replaced with category name
      row.insertCell(1).innerText = entry.amount;
      row.insertCell(2).innerText = entry.date;

      const actionsCell = row.insertCell(3); // Actions column

      // Create a container for buttons
      const actionsContainer = document.createElement("div");
      actionsContainer.className = "table-actions";

      // Edit Button
      const editButton = document.createElement("button");
      editButton.innerText = "Edit";
      editButton.className = "table-button"; // Apply the table-button class
      editButton.onclick = () => editEntry(index);
      actionsContainer.appendChild(editButton);

      // Delete Button
      const deleteButton = document.createElement("button");
      deleteButton.innerText = "Delete";
      deleteButton.className = "table-button delete"; // Apply the table-button class and delete class
      deleteButton.onclick = () => deleteEntry(index);
      actionsContainer.appendChild(deleteButton);

      // Append actions container to the actions cell
      actionsCell.appendChild(actionsContainer);
    });
  }

  function updateChart() {
    // Group data by category and sum amounts
    const labels = [...new Set(data.map((entry) => entry.type))];
    const amounts = labels.map((label) => {
      return data
        .filter((entry) => entry.type === label)
        .reduce((sum, entry) => sum + entry.amount, 0);
    });

    if (myPieChart) {
      myPieChart.data.labels = labels;
      myPieChart.data.datasets[0].data = amounts;
      myPieChart.update();
    } else {
      myPieChart = new Chart(ctx, {
        type: "pie",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Expenses",
              data: amounts,
              backgroundColor: [
                "rgba(255, 99, 132, 0.2)",
                "rgba(54, 162, 235, 0.2)",
                "rgba(255, 206, 86, 0.2)",
                "rgba(75, 192, 192, 0.2)",
                "rgba(153, 102, 255, 0.2)",
                "rgba(255, 159, 64, 0.2)",
              ],
              borderColor: [
                "rgba(255, 99, 132, 1)",
                "rgba(54, 162, 235, 1)",
                "rgba(255, 206, 86, 1)",
                "rgba(75, 192, 192, 1)",
                "rgba(153, 102, 255, 1)",
                "rgba(255, 159, 64, 1)",
              ],
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: "top",
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  let label = context.label || "";
                  if (label) {
                    label += ": ";
                  }
                  if (context.parsed !== null) {
                    label += context.parsed + "$";
                  }
                  return label;
                },
              },
            },
          },
        },
      });
    }
  }

  function deleteEntry(index) {
    data.splice(index, 1);
    updateTable();
    updateChart();
  }

  function editEntry(index) {
    const entry = data[index];
    form.category.value = entry.type; // Assuming category ID is stored
    form.amount.value = entry.amount;
    form.date.value = entry.date;

    form.dataset.editIndex = index; // Set the edit index for updating
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const categoryId = parseInt(form.category.value);
    const amount = parseFloat(form.amount.value);
    const date = form.date.value;

    if (form.dataset.editIndex !== undefined) {
      // Update existing entry
      const index = parseInt(form.dataset.editIndex);
      data[index] = { type: categoryId, amount, date };
      delete form.dataset.editIndex; // Clear the edit index
    } else {
      // Add new entry
      data.push({ type: categoryId, amount, date });
    }
    updateTable();
    updateChart();

    form.reset();
  });

  // For initial chart setup if there is pre-existing data
  updateChart();
});


// Add this to handle the logout button click
document.getElementById("logoutButton").addEventListener("click", async () => {
  try {
    const response = await fetch("/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      // Redirect to login page or home page after logout
      window.location.href = "/login";
    } else {
      console.error("Error during logout");
    }
  } catch (error) {
    console.error("Error:", error);
  }
});
