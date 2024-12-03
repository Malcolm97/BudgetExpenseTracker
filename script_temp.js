document.getElementById('set-budget').addEventListener('click', function() {
    try {
        const budgetInput = document.getElementById('budget').value;
        console.log('Budget Input:', budgetInput); // Log the input value
        console.log('Processing budget...'); // Indicate processing start
        const totalBudget = parseFloat(budgetInput);
        if (!isNaN(totalBudget) && totalBudget > 0) {
            document.getElementById('remaining-budget').innerText = totalBudget.toFixed(2);
            document.getElementById('budget').value = ''; // Clear the budget input field
            updateTotalExpenses(); // Reset expenses
        } else {
            alert('Please enter a valid budget amount.');
        }
    } catch (error) {
        console.error('Error setting budget:', error); // Log any errors
    }
});

let totalWeeklyExpenses = 0;
let totalFortnightlyExpenses = 0;
let totalMonthlyExpenses = 0;

document.getElementById('add-expense').addEventListener('click', function() {
    console.log('Add Expense function triggered'); // Log when the function is triggered
    const expenseName = document.getElementById('expense-name').value;
    const expenseAmount = document.getElementById('expense-amount').value;
    const expenseFrequency = document.getElementById('expense-frequency').value; // Get selected frequency
    const amount = parseFloat(expenseAmount);
    
    if (expenseName && !isNaN(amount) && amount > 0) {
        addExpenseToList(expenseName, amount, expenseFrequency);
        clearExpenseInputs();
        updateTotalExpenses(); // Update total expenses after adding a new expense
    } else {
        alert('Please enter valid expense details.');
    }
});

function addExpenseToList(expenseName, amount, frequency) {
    const expenseList = document.getElementById('expense-list');
    const listItem = document.createElement('li');
    listItem.classList.add('flex', 'justify-between', 'items-center');
    listItem.innerHTML = `
        <span class="expense-name">${expenseName}</span>
        <span class="expense-amount">$${amount.toFixed(2)}</span>
        <span class="expense-frequency">${frequency}</span> <!-- Display frequency -->
        <button class="edit-expense bg-yellow-500 text-white p-1 rounded">Edit</button>
        <button class="delete-expense bg-red-500 text-white p-1 rounded">Delete</button>
    `;
    expenseList.appendChild(listItem);
    
    // Update total expenses based on frequency
    updateExpenses(amount, frequency);
}

function updateExpenses(amount, frequency) {
    // Update totals based on frequency
    if (frequency === 'weekly') {
        totalWeeklyExpenses += amount;
    } else if (frequency === 'fortnightly') {
        totalFortnightlyExpenses += amount;
    } else if (frequency === 'monthly') {
        totalMonthlyExpenses += amount;
    }
}

function updateTotalExpenses() {
    const totalExpensesElement = document.getElementById('total-expenses');
    const totalWeeklyExpensesElement = document.getElementById('total-weekly-expenses');
    const totalFortnightlyExpensesElement = document.getElementById('total-fortnightly-expenses');
    const totalMonthlyExpensesElement = document.getElementById('total-monthly-expenses');

    totalExpensesElement.innerText = (totalWeeklyExpenses + totalFortnightlyExpenses + totalMonthlyExpenses).toFixed(2);
    totalWeeklyExpensesElement.innerText = totalWeeklyExpenses.toFixed(2);
    totalFortnightlyExpensesElement.innerText = totalFortnightlyExpenses.toFixed(2);
    totalMonthlyExpensesElement.innerText = totalMonthlyExpenses.toFixed(2);
}

function clearExpenseInputs() {
    document.getElementById('expense-name').value = '';
    document.getElementById('expense-amount').value = '';
    document.getElementById('expense-frequency').value = 'weekly'; // Reset frequency to default
}
