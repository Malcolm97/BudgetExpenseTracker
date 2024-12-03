console.log('Script loaded successfully'); // Log to confirm script execution

const setBudgetButton = document.getElementById('set-budget');
if (setBudgetButton) {
    console.log('Set Budget button found'); // Log to confirm button existence
    setBudgetButton.addEventListener('click', function() {
        console.log('Set Budget event listener triggered'); // Log to confirm listener execution
        console.log('Set Budget button clicked'); // Log when the button is clicked
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
}

let totalWeeklyExpenses = 0;
let totalFortnightlyExpenses = 0;
let totalMonthlyExpenses = 0;

document.getElementById('add-expense').addEventListener('click', function() {
    console.log('Add Expense button clicked'); // Log when the button is clicked
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

    // Add event listeners for edit and delete buttons
    listItem.querySelector('.edit-expense').addEventListener('click', function() {
        console.log('Edit button clicked'); // Log when the edit button is clicked
        const newExpenseName = prompt("Enter new expense name:", expenseName) || expenseName;
        const newExpenseAmount = prompt("Enter new expense amount:", amount) || amount;
        if (newExpenseName === null || newExpenseAmount === null) {
            return; // Exit if the user cancels the prompt
        }
        if (newExpenseName && !isNaN(parseFloat(newExpenseAmount))) {
            // Update the displayed values
            listItem.querySelector('.expense-name').innerText = newExpenseName;
            listItem.querySelector('.expense-amount').innerText = `$${parseFloat(newExpenseAmount).toFixed(2)}`;
            // Update the expense variables
            expenseName = newExpenseName;
            amount = parseFloat(newExpenseAmount);
            updateTotalExpenses(); // Update totals after editing
        }
    });

    listItem.querySelector('.delete-expense').addEventListener('click', function() {
        console.log('Delete button clicked'); // Log when the delete button is clicked
        // Logic for deleting the expense
        expenseList.removeChild(listItem);
        updateTotalExpenses(); // Update totals after deleting
    });
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

function calculateWeeklyBudget(totalExpenses, totalBudget) {
    return totalBudget - totalExpenses; // Calculate weekly budget
}

function calculateSavings(totalExpenses, totalBudget) {
    return totalBudget - totalExpenses; // Calculate savings
}

function updateTotalExpenses() {
    const totalExpensesElement = document.getElementById('total-expenses');
    const totalWeeklyExpensesElement = document.getElementById('total-weekly-expenses');
    const totalFortnightlyExpensesElement = document.getElementById('total-fortnightly-expenses');
    const totalMonthlyExpensesElement = document.getElementById('total-monthly-expenses');
    const weeklyBudgetElement = document.getElementById('remaining-budget'); // Assuming this element holds the budget

    const totalExpenses = totalWeeklyExpenses + totalFortnightlyExpenses + totalMonthlyExpenses;
    totalExpensesElement.innerText = totalExpenses.toFixed(2);
    totalWeeklyExpensesElement.innerText = totalWeeklyExpenses.toFixed(2);
    totalFortnightlyExpensesElement.innerText = totalFortnightlyExpenses.toFixed(2);
    totalMonthlyExpensesElement.innerText = totalMonthlyExpenses.toFixed(2);

    // Calculate savings
    const totalBudget = parseFloat(weeklyBudgetElement.innerText) || 0; // Get the budget value
    console.log('Total Expenses:', totalExpenses); // Log total expenses
    console.log('Total Budget:', totalBudget); // Log total budget
    savings = calculateSavings(totalExpenses, totalBudget); // Calculate savings
    document.getElementById('savings').innerText = savings.toFixed(2); // Display savings
}

function clearExpenseInputs() {
    document.getElementById('expense-name').value = '';
    document.getElementById('expense-amount').value = '';
    document.getElementById('expense-frequency').value = 'weekly'; // Reset frequency to default
}

function changeColors(buttonColor, summaryColor) {
    // Change button colors
    const buttons = document.querySelectorAll('#set-budget, #add-expense, .edit-expense, .delete-expense');
    buttons.forEach(button => {
        button.style.backgroundColor = buttonColor;
    });

    // Change summary text colors
    const summaryTexts = document.querySelectorAll('.summary p');
    summaryTexts.forEach(text => {
        text.style.color = summaryColor;
    });
}

const showExpenseResultsButton = document.getElementById('show-expense-results');
if (showExpenseResultsButton) {
    showExpenseResultsButton.addEventListener('click', function() {
        console.log('Show Expense Results button clicked');
        const expenseList = document.getElementById('expense-list');
        expenseList.style.display = 'block'; // Show the expense list
    });
}

const calculateTotalExpensesButton = document.getElementById('calculate-total-expenses');
if (calculateTotalExpensesButton) {
    calculateTotalExpensesButton.addEventListener('click', function() {
        console.log('Calculate Total Expenses button clicked');
        updateTotalExpenses(); // Call the function to update total expenses
    });
}

// Add event listener for the Change Color Scheme button
document.getElementById('change-color-scheme').addEventListener('click', function() {
    const buttonColor = '#ff69b4'; // Pretty pink color
    const summaryColor = prompt("Enter the desired summary text color (e.g., #007bff):");
    changeColors(buttonColor, summaryColor);
});