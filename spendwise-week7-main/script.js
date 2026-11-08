
/* ==========================================
   SPENDWISE WEEK 7
   Personal Budget and Expense Tracker
========================================== */

"use strict";

// APPLICATION SETTINGS
const STORAGE_KEY = "spendwise-week7-data";

let budget = 0;
let expenses = [];

// HTML ELEMENTS
const totalBudgetElement = document.getElementById("totalBudget");
const totalExpensesElement = document.getElementById("totalExpenses");
const remainingBalanceElement = document.getElementById("remainingBalance");
const balanceMessageElement = document.getElementById("balanceMessage");

const budgetPercentElement = document.getElementById("budgetPercent");
const progressFillElement = document.getElementById("progressFill");
const budgetStatusElement = document.getElementById("budgetStatus");
const budgetInsightElement = document.getElementById("budgetInsight");

const editBudgetButton = document.getElementById("editBudgetBtn");

const expenseForm = document.getElementById("expenseForm");
const expenseNameInput = document.getElementById("expenseName");
const expenseAmountInput = document.getElementById("expenseAmount");
const expenseCategoryInput = document.getElementById("expenseCategory");

const expenseTable = document.getElementById("expenseTable");
const expenseCountElement = document.getElementById("expenseCount");

const expenseSearch = document.getElementById("expenseSearch");
const categoryFilter = document.getElementById("categoryFilter");
const exportButton = document.getElementById("exportBtn");
const formMessage = document.getElementById("formMessage");

// FORMAT MONEY IN KENYAN SHILLINGS
function formatMoney(amount) {
    return new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency: "KES",
        minimumFractionDigits: 2
    }).format(amount);
}

// SAVE DATA TO LOCAL STORAGE
function saveData() {
    const data = {
        budget: budget,
        expenses: expenses
    };

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error("Could not save application data:", error);
        showMessage("Your data could not be saved in this browser.", true);
    }
}

// LOAD SAVED DATA
function loadData() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);

        if (!savedData) {
            return;
        }

        const data = JSON.parse(savedData);

        if (
            typeof data.budget === "number" &&
            Number.isFinite(data.budget) &&
            data.budget >= 0
        ) {
            budget = data.budget;
        }

        if (Array.isArray(data.expenses)) {
            expenses = data.expenses.filter(expense =>
                expense &&
                typeof expense.id === "string" &&
                typeof expense.name === "string" &&
                typeof expense.amount === "number" &&
                Number.isFinite(expense.amount) &&
                expense.amount > 0 &&
                typeof expense.category === "string" &&
                typeof expense.date === "string"
            );
        }
    } catch (error) {
        console.error("Could not load saved data:", error);
        showMessage("Saved data could not be loaded.", true);
    }
}

// DISPLAY FEEDBACK MESSAGES
function showMessage(message, isError = false) {
    formMessage.textContent = message;
    formMessage.style.color = isError ? "#df4d5a" : "#159b70";
}

// CALCULATE TOTAL EXPENSES
function calculateTotalExpenses() {
    return expenses.reduce((total, expense) => {
        return total + expense.amount;
    }, 0);
}

// UPDATE DASHBOARD
function updateDashboard() {
    const total = calculateTotalExpenses();
    const remaining = budget - total;

    totalBudgetElement.textContent = formatMoney(budget);
    totalExpensesElement.textContent = formatMoney(total);
    remainingBalanceElement.textContent = formatMoney(remaining);

    if (budget === 0) {
        balanceMessageElement.textContent = "Set your budget to begin";
        budgetPercentElement.textContent = "0%";
        progressFillElement.style.width = "0%";
        budgetStatusElement.textContent = "Set a budget to monitor your spending.";
        budgetInsightElement.textContent = "";
        return;
    }

    if (remaining >= 0) {
        balanceMessageElement.textContent = "Money remaining";
    } else {
        balanceMessageElement.textContent = "You are over budget";
    }

    const percentage = (total / budget) * 100;
    const safePercentage = Math.min(percentage, 100);

    budgetPercentElement.textContent = `${percentage.toFixed(1)}%`;
    progressFillElement.style.width = `${safePercentage}%`;

    if (percentage < 75) {
        progressFillElement.style.background = "#159b70";
        budgetStatusElement.textContent = "Good job! Your spending is within a healthy range.";
    } else if (percentage <= 100) {
        progressFillElement.style.background = "#e5a22c";
        budgetStatusElement.textContent = "Warning: You are approaching your budget limit.";
    } else {
        progressFillElement.style.background = "#df4d5a";
        budgetStatusElement.textContent = "Alert: You have exceeded your budget.";
    }

    if (remaining >= 0) {
        budgetInsightElement.textContent =
            `You have ${formatMoney(remaining)} available to spend.`;
    } else {
        budgetInsightElement.textContent =
            `You have exceeded your budget by ${formatMoney(Math.abs(remaining))}.`;
    }
}

// DISPLAY EXPENSES
function displayExpenses() {
    expenseTable.replaceChildren();

    const searchTerm = expenseSearch.value.trim().toLowerCase();
    const selectedCategory = categoryFilter.value;

    const filteredExpenses = expenses.filter(expense => {
        const matchesSearch =
            expense.name.toLowerCase().includes(searchTerm);

        const matchesCategory =
            selectedCategory === "All" ||
            expense.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    expenseCountElement.textContent =
        `${expenses.length} ${expenses.length === 1 ? "expense" : "expenses"}`;

    if (filteredExpenses.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 5;
        cell.textContent = expenses.length === 0
            ? "No expenses recorded yet."
            : "No matching expenses found.";

        row.appendChild(cell);
        expenseTable.appendChild(row);
        return;
    }

    filteredExpenses.forEach(expense => {
        const row = document.createElement("tr");

        const nameCell = document.createElement("td");
        nameCell.textContent = expense.name;

        const categoryCell = document.createElement("td");
        categoryCell.textContent = expense.category;

        const dateCell = document.createElement("td");
        dateCell.textContent = expense.date;

        const amountCell = document.createElement("td");
        amountCell.textContent = formatMoney(expense.amount);

        const actionCell = document.createElement("td");
        const deleteButton = document.createElement("button");

        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-button";
        deleteButton.type = "button";

        deleteButton.addEventListener("click", () => {
            deleteExpense(expense.id);
        });

        actionCell.appendChild(deleteButton);

        row.append(
            nameCell,
            categoryCell,
            dateCell,
            amountCell,
            actionCell
        );

        expenseTable.appendChild(row);
    });
}

// ADD A NEW EXPENSE
function addExpense(event) {
    event.preventDefault();

    const name = expenseNameInput.value.trim();
    const amount = Number(expenseAmountInput.value);
    const category = expenseCategoryInput.value;

    if (!name || !category) {
        showMessage("Please complete all expense fields.", true);
        return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        showMessage("Please enter a valid amount greater than zero.", true);
        return;
    }

    const newExpense = {
        id: crypto.randomUUID(),
        name: name,
        amount: amount,
        category: category,
        date: new Date().toLocaleDateString("en-KE")
    };

    expenses.unshift(newExpense);

    saveData();
    updateDashboard();
    displayExpenses();

    expenseForm.reset();

    showMessage("Expense added successfully!");
}

// DELETE AN EXPENSE
function deleteExpense(id) {
    const confirmed = window.confirm(
        "Are you sure you want to delete this expense?"
    );

    if (!confirmed) {
        return;
    }

    expenses = expenses.filter(expense => expense.id !== id);

    saveData();
    updateDashboard();
    displayExpenses();

    showMessage("Expense deleted successfully!");
}

// SET OR EDIT MONTHLY BUDGET
function editBudget() {
    const answer = window.prompt(
        "Enter your budget in Kenyan Shillings:",
        budget > 0 ? budget : ""
    );

    if (answer === null) {
        return;
    }

    const newBudget = Number(answer);

    if (!answer.trim() || !Number.isFinite(newBudget) || newBudget < 0) {
        showMessage("Please enter a valid budget amount.", true);
        return;
    }

    budget = newBudget;

    saveData();
    updateDashboard();

    showMessage("Your budget has been updated successfully!");
}

// EXPORT EXPENSES TO CSV
function exportExpenses() {
    if (expenses.length === 0) {
        showMessage("There are no expenses to export.", true);
        return;
    }

    const headers = ["Expense Name", "Category", "Date", "Amount (KSh)"];

    const rows = expenses.map(expense => [
        expense.name,
        expense.category,
        expense.date,
        expense.amount.toFixed(2)
    ]);

    const escapeCSV = value =>
        `"${String(value).replace(/"/g, '""')}"`;

    const csvContent = [headers, ...rows]
        .map(row => row.map(escapeCSV).join(","))
        .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "spendwise-expenses.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    showMessage("Your expense report has been exported!");
}

// EVENT LISTENERS
expenseForm.addEventListener("submit", addExpense);

editBudgetButton.addEventListener("click", editBudget);

expenseSearch.addEventListener("input", displayExpenses);

categoryFilter.addEventListener("change", displayExpenses);

exportButton.addEventListener("click", exportExpenses);

// START APPLICATION
function initializeApp() {
    loadData();
    updateDashboard();
    displayExpenses();

    console.log("SpendWise Week 7 application is ready.");
}

initializeApp();
