document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    changeColors('#', '#007bff'); // Change button color to original and summary text color to blue
});

function setupEventListeners() {
    console.log('Setting up event listeners'); // Log when setting up listeners
    addEventListenerToButton('set-budget', setBudget);
    addEventListenerToButton('add-expense', addExpense);
    console.log('Event listeners attached'); // Log to confirm listeners are attached
}

function addEventListenerToButton(buttonId, callback) {
    console.log(`Adding event listener to button: ${buttonId}`); // Log button ID
    document.getElementById(buttonId).addEventListener('click', callback);
}

function setBudget() {
    console.log('Set Budget button clicked'); // Log button click
    try {
        const budgetInput = document.getElementById('budget').value;
        const totalBudget = validateInput(budgetInput);
        if (totalBudget) {
            const fortnightlyBudget = parseFloat(document.getElementById('fortnightly-budget').value) || 0; // Get fortnightly budget
            const combinedBudget = totalBudget + fortnightlyBudget; // Include fortnightly budget in total
            updateRemainingBudget(combinedBudget);
            updateSavings(totalExpenses, combinedBudget);
            clearBudgetInput();
            updateTotalExpenses(); // Reset expenses
        } else {
            alert('Please enter a valid budget amount.');
        }
    } catch (error) {
        console.error('Error setting budget:', error); // Log any errors
    }
}

function validateInput(input) {
    const parsedValue = parseFloat(input);
    return !isNaN(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function updateRemainingBudget(combinedBudget) {
    const remainingBudgetElement = document.getElementById('remaining-budget');
    if (remainingBudgetElement) {
        remainingBudgetElement.innerText = combinedBudget.toFixed(2);
    } else {
        console.error('Remaining budget element not found');
    }
}

function updateSavings(totalExpenses, totalBudget) {
    const savings = calculateSavings(totalExpenses, totalBudget); // Calculate savings
    document.getElementById('savings').innerText = savings.toFixed(2); // Display savings
}

function clearBudgetInput() {
    document.getElementById('budget').value = ''; // Clear the budget input field
}

function addExpense() {
    console.log('Add Expense function triggered'); // Log when the function is triggered
    console.log('Expense Name:', document.getElementById('expense-name').value); // Log expense name
    console.log('Expense Amount:', document.getElementById('expense-amount').value); // Log expense amount
    const expenseName = document.getElementById('expense-name').value;
    const expenseAmount = document.getElementById('expense-amount').value;
    const expenseFrequency = document.getElementById('expense-frequency').value.toLowerCase(); // Get selected frequency
    const amount = validateInput(expenseAmount);
    
    if (expenseName && amount) {
        addExpenseToList(expenseName, amount, expenseFrequency);
        clearExpenseInputs(); // Clear input fields after adding the expense
        updateTotalExpenses(); // Update total expenses after adding a new expense
    } else {
        alert('Please enter valid expense details.');
    }
}

function clearExpenseInputs() {
    document.getElementById('expense-name').value = ''; // Clear the expense name input
    document.getElementById('expense-amount').value = ''; // Clear the expense amount input
    document.getElementById('expense-frequency').value = 'weekly'; // Reset frequency to default
}

function addExpenseToList(expenseName, amount, frequency) {
    console.log('Adding expense:', expenseName, amount, frequency); // Log expense details
    const expenseList = document.getElementById('expense-list');
    const listItem = document.getElementById('expense-item-template').cloneNode(true);
    listItem.style.display = 'flex'; // Make the cloned item visible
    listItem.classList.add('flex', 'justify-between', 'items-center', 'border-b', 'border-gray-200', 'py-2');
    listItem.innerHTML = `
        <span class="expense-name font-bold text-lg text-gray-800 hover:text-gray-600 transition duration-300">${expenseName}</span>
        <span class="expense-amount font-bold text-lg text-gray-800 hover:text-gray-600 transition duration-300">$${amount.toFixed(2)}</span>
        <span class="expense-frequency font-bold text-lg text-gray-800 hover:text-gray-600 transition duration-300">${frequency}</span>
        <div class="flex space-x-1">
            <button class="edit-expense bg-yellow-500 text-white p-1 rounded hover:bg-yellow-600 transition duration-300" aria-label="Edit Expense"><i class="fas fa-edit"></i></button>
            <button class="delete-expense bg-red-500 text-white p-1 rounded hover:bg-red-600 transition duration-300" aria-label="Delete Expense"><i class="fas fa-trash"></i></button>
        </div>
    `;
    expenseList.appendChild(listItem);

    // Add event listeners for inline editing
    listItem.querySelector('.expense-name').addEventListener('click', function() {
        inlineEdit(listItem, 'name', expenseName);
    });
    listItem.querySelector('.expense-amount').addEventListener('click', function() {
        inlineEdit(listItem, 'amount', amount);
    });
    listItem.querySelector('.expense-frequency').addEventListener('click', function() {
        inlineEdit(listItem, 'frequency', frequency);
    });

    // Add event listeners for edit and delete buttons
    listItem.querySelector('.edit-expense').addEventListener('click', function() {
        editExpense(listItem, expenseName, amount, frequency);
    });
    
    listItem.querySelector('.delete-expense').addEventListener('click', function() {
        deleteExpense(listItem);
    });
}

// Inline Edit Functionality
function inlineEdit(listItem, field, currentValue) {
    const fieldElement = listItem.querySelector(`.expense-${field}`);
    const input = document.createElement('input');
    input.value = currentValue;
    fieldElement.innerHTML = '';
    fieldElement.appendChild(input);

    const saveButton = document.createElement('button');
    saveButton.innerText = 'Save';
    saveButton.className = 'bg-green-500 text-white p-1 rounded';
    fieldElement.appendChild(saveButton);

    saveButton.addEventListener('click', function() {
        const newValue = input.value;
        if (newValue) {
            fieldElement.innerText = newValue;
            // Update the corresponding variable
            if (field === 'name') {
                expenseName = newValue;
            } else if (field === 'amount') {
                expenseAmount = parseFloat(newValue);
            } else if (field === 'frequency') {
                expenseFrequency = newValue;
            }
            updateTotalExpenses(); // Update totals after editing
            fieldElement.removeChild(saveButton); // Remove the save button
        } else {
            alert('Please enter valid details.');
        }
    });
}

// Edit Expense Functionality
function editExpense(listItem, expenseName, amount, frequency) {
    // Existing edit logic can be retained or modified as needed
}

// Delete Expense Functionality
function deleteExpense(listItem) {
    listItem.remove(); // Remove the list item from the expense list
    updateTotalExpenses(); // Update totals after deleting
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

function calculateTotalExpenses() {
    // Logic to calculate total expenses
    let totalWeekly = 0;
    let totalFortnightly = 0;
    let totalMonthly = 0;

    const expenseItems = document.querySelectorAll('#expense-list li');
    expenseItems.forEach(item => {
        const amount = parseFloat(item.querySelector('.expense-amount').innerText.replace('$', ''));
        const frequency = item.querySelector('.expense-frequency').innerText;

        if (frequency === 'weekly') {
            totalWeekly += amount;
        } else if (frequency === 'fortnightly') {
            totalFortnightly += amount;
        } else if (frequency === 'monthly') {
            totalMonthly += amount;
        }
    });

    document.getElementById('total-weekly-expenses').innerText = totalWeekly.toFixed(2);
    document.getElementById('total-fortnightly-expenses').innerText = totalFortnightly.toFixed(2);
    document.getElementById('total-monthly-expenses').innerText = totalMonthly.toFixed(2);
    document.getElementById('total-expenses').innerText = (totalWeekly + totalFortnightly + totalMonthly).toFixed(2);
}

// Add event listener for calculating total expenses
document.getElementById('calculate-total-expenses').addEventListener('click', calculateTotalExpenses);