document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    changeColors('#ff69b4', '#007bff'); // Change button color to original and summary text color to blue
    updateDeductions(); // Update deductions on load
    setInterval(updateDeductions, 60000); // Update deductions every minute
});

function setupEventListeners() {
    console.log('Setting up event listeners'); // Log when setting up listeners
    addEventListenerToButton('set-budget', setBudget);
    addEventListenerToButton('add-expense', addExpense);
    addEventListenerToButton('clear-expenses', clearAllExpenses);
    document.getElementById('calculate-total-expenses').addEventListener('click', calculateTotalExpenses);
    document.getElementById('calculate-remaining-budget').addEventListener('click', calculateRemainingBalance);
    document.getElementById('calculate-upcoming-deductions').addEventListener('click', updateDeductions);
    document.getElementById('calculate-next-deduction').addEventListener('click', updateUpcomingDeductions);
    console.log('Event listeners attached'); // Log to confirm listeners are attached
}

function addEventListenerToButton(buttonId, callback) {
    console.log(`Adding event listener to button: ${buttonId}`); // Log button ID
    const button = document.getElementById(buttonId);
    if (button) {
        button.addEventListener('click', callback);
    } else {
        console.error(`Button with ID ${buttonId} not found`);
    }
}

function setBudget() {
    console.log('Set Budget button clicked'); // Log button click
    try {
        const budgetInput = document.getElementById('budget').value;
        const totalBudget = validateInput(budgetInput);
        if (totalBudget) {
            document.getElementById('total-budget').innerText = totalBudget.toFixed(2); // Display budget
            document.getElementById('remaining-balance').innerText = totalBudget.toFixed(2); // Display initial remaining balance
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

function clearBudgetInput() {
    document.getElementById('budget').value = ''; // Clear the budget input field
}

function addExpense() {
    console.log('Add Expense function triggered'); // Log when the function is triggered
    const expenseNames = document.getElementById('expense-name').value.split(',').map(name => name.trim());
    const expenseAmounts = document.getElementById('expense-amount').value.split(',').map(amount => parseFloat(amount.trim()));
    const expenseFrequency = document.getElementById('expense-frequency').value.toLowerCase(); // Get selected frequency
    const expenseDay = document.getElementById('expense-day').value.toLowerCase(); // Get selected day

    if (expenseNames.length === expenseAmounts.length) {
        expenseNames.forEach((expenseName, index) => {
            const amount = validateInput(expenseAmounts[index]);
            if (expenseName && amount) {
                addExpenseToList(expenseName, amount, expenseFrequency, expenseDay);
            } else {
                alert('Please enter valid expense details.');
            }
        });
        clearExpenseInputs(); // Clear input fields after adding the expenses
        updateTotalExpenses(); // Update total expenses after adding new expenses
        updateDeductions(); // Update deductions after adding new expenses
        updateUpcomingDeductions(); // Update next upcoming deduction after adding new expenses
    } else {
        alert('Please ensure the number of expense names matches the number of expense amounts.');
    }
}

function clearExpenseInputs() {
    document.getElementById('expense-name').value = ''; // Clear the expense name input
    document.getElementById('expense-amount').value = ''; // Clear the expense amount input
    document.getElementById('expense-frequency').value = 'weekly'; // Reset frequency to default
    document.getElementById('expense-day').value = 'monday'; // Reset day to default
}

function addExpenseToList(expenseName, amount, frequency, day) {
    console.log('Adding expense:', expenseName, amount, frequency); // Log expense details
    const expenseList = document.getElementById('expense-list');
    const listItem = document.getElementById('expense-item-template').cloneNode(true);
    listItem.style.display = 'flex'; // Make the cloned item visible
    listItem.querySelector('.expense-name').innerText = expenseName;
    listItem.querySelector('.expense-amount').innerText = `$${amount.toFixed(2)}`;
    listItem.querySelector('.expense-frequency').innerText = frequency;
    listItem.querySelector('.expense-day').innerText = day;
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
    listItem.querySelector('.expense-day').addEventListener('click', function() {
        inlineEdit(listItem, 'day', day);
    });

    // Add event listeners for edit and delete buttons
    listItem.querySelector('.edit-expense').addEventListener('click', function() {
        editExpense(listItem);
    });
    
    listItem.querySelector('.delete-expense').addEventListener('click', function() {
        deleteExpense(listItem);
    });

    listItem.querySelector('.save-expense').addEventListener('click', function() {
        saveEdits(listItem);
    });
}

// Inline Edit Functionality
function inlineEdit(listItem, field, currentValue) {
    const fieldElement = listItem.querySelector(`.expense-${field}`);
    fieldElement.innerHTML = '';

    if (field === 'frequency') {
        const select = document.createElement('select');
        select.className = 'edit-input border border-gray-300 p-2 rounded w-full';
        ['weekly', 'fortnightly', 'monthly'].forEach(optionValue => {
            const option = document.createElement('option');
            option.value = optionValue;
            option.text = optionValue.charAt(0).toUpperCase() + optionValue.slice(1);
            if (optionValue === currentValue) {
                option.selected = true;
            }
            select.appendChild(option);
        });
        fieldElement.appendChild(select);
    } else if (field === 'day') {
        const select = document.createElement('select');
        select.className = 'edit-input border border-gray-300 p-2 rounded w-full';
        ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].forEach(optionValue => {
            const option = document.createElement('option');
            option.value = optionValue;
            option.text = optionValue.charAt(0).toUpperCase() + optionValue.slice(1);
            if (optionValue === currentValue) {
                option.selected = true;
            }
            select.appendChild(option);
        });
        fieldElement.appendChild(select);
    } else {
        const input = document.createElement('input');
        input.value = currentValue;
        input.className = 'edit-input border border-gray-300 p-2 rounded w-full'; // Add class for styling
        fieldElement.appendChild(input);
    }

    listItem.querySelector('.save-expense').style.display = 'inline-block';
}

function saveEdits(listItem) {
    const nameField = listItem.querySelector('.expense-name input');
    const amountField = listItem.querySelector('.expense-amount input');
    const frequencyField = listItem.querySelector('.expense-frequency select');
    const dayField = listItem.querySelector('.expense-day select');

    if (nameField && amountField && frequencyField && dayField) {
        const newName = nameField.value;
        const newAmount = parseFloat(amountField.value);
        const newFrequency = frequencyField.value;
        const newDay = dayField.value;

        if (newName && !isNaN(newAmount) && newFrequency && newDay) {
            listItem.querySelector('.expense-name').innerText = newName;
            listItem.querySelector('.expense-amount').innerText = `$${newAmount.toFixed(2)}`;
            listItem.querySelector('.expense-frequency').innerText = newFrequency;
            listItem.querySelector('.expense-day').innerText = newDay;

            updateTotalExpenses(); // Update totals after editing
            updateDeductions(); // Update deductions after editing
            updateUpcomingDeductions(); // Update next upcoming deduction after editing
            listItem.querySelector('.save-expense').style.display = 'none'; // Hide the save button
        } else {
            alert('Please enter valid details.');
        }
    }
}

// Edit Expense Functionality
function editExpense(listItem) {
    const expenseNameElement = listItem.querySelector('.expense-name');
    const expenseAmountElement = listItem.querySelector('.expense-amount');
    const expenseFrequencyElement = listItem.querySelector('.expense-frequency');
    const expenseDayElement = listItem.querySelector('.expense-day');

    const expenseName = expenseNameElement.innerText;
    const expenseAmount = parseFloat(expenseAmountElement.innerText.replace('$', ''));
    const expenseFrequency = expenseFrequencyElement.innerText;
    const expenseDay = expenseDayElement.innerText;

    inlineEdit(listItem, 'name', expenseName);
    inlineEdit(listItem, 'amount', expenseAmount);
    inlineEdit(listItem, 'frequency', expenseFrequency);
    inlineEdit(listItem, 'day', expenseDay);
}

// Delete Expense Functionality
function deleteExpense(listItem) {
    listItem.remove(); // Remove the list item from the expense list
    updateTotalExpenses(); // Update totals after deleting
    updateDeductions(); // Update deductions after deleting
    updateUpcomingDeductions(); // Update next upcoming deduction after deleting
}

// Clear All Expenses Functionality
function clearAllExpenses() {
    const expenseList = document.getElementById('expense-list');
    expenseList.innerHTML = ''; // Clear all expenses
    updateTotalExpenses(); // Update totals after clearing
    updateDeductions(); // Update deductions after clearing
    updateUpcomingDeductions(); // Update next upcoming deduction after clearing
}

function changeColors(buttonColor, summaryColor) {
    // Change button colors
    const buttons = document.querySelectorAll('#set-budget, #add-expense, .edit-expense, .delete-expense, .save-expense, #clear-expenses, #calculate-total-expenses, #calculate-remaining-budget');
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
    const totalExpenses = totalWeekly + totalFortnightly + totalMonthly;
    document.getElementById('total-expenses').innerText = totalExpenses.toFixed(2);
}

function calculateRemainingBalance() {
    // Calculate remaining balance
    const totalExpenses = parseFloat(document.getElementById('total-expenses').innerText);
    const totalBudget = parseFloat(document.getElementById('total-budget').innerText);
    const remainingBalance = totalBudget - totalExpenses;
    document.getElementById('remaining-balance').innerText = remainingBalance.toFixed(2);
}

function updateDeductions() {
    const now = new Date();
    const weeklyDeductions = calculateDeductions('weekly', now);
    const fortnightlyDeductions = calculateDeductions('fortnightly', now);
    const monthlyDeductions = calculateDeductions('monthly', now);
    const dailyDeductions = calculateDeductions('day', now);

    document.getElementById('weekly-deductions').innerText = weeklyDeductions.toFixed(2);
    document.getElementById('fortnightly-deductions').innerText = fortnightlyDeductions.toFixed(2);
    document.getElementById('monthly-deductions').innerText = monthlyDeductions.toFixed(2);
    document.getElementById('daily-deductions').innerText = dailyDeductions.toFixed(2);

    updateUpcomingDeductions();
}

function calculateDeductions(frequency, now) {
    let totalDeductions = 0;
    const expenseItems = document.querySelectorAll('#expense-list li');
    expenseItems.forEach(item => {
        const amount = parseFloat(item.querySelector('.expense-amount').innerText.replace('$', ''));
        const expenseFrequency = item.querySelector('.expense-frequency').innerText;

        if (expenseFrequency === frequency) {
            totalDeductions += amount;
        }
    });
    return totalDeductions;
}

function getNextDueDate(frequency, now, day) {
    const nextDueDate = new Date(now);
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDay = daysOfWeek.indexOf(day);
    const currentDay = now.getDay();
    let daysUntilNext = (targetDay - currentDay + 7) % 7;

    if (frequency === 'weekly') {
        daysUntilNext = daysUntilNext === 0 ? 7 : daysUntilNext;
    } else if (frequency === 'fortnightly') {
        daysUntilNext = daysUntilNext === 0 ? 14 : daysUntilNext + 7;
    } else if (frequency === 'monthly') {
        nextDueDate.setMonth(now.getMonth() + 1);
        nextDueDate.setDate(1);
        return nextDueDate;
    }

    nextDueDate.setDate(now.getDate() + daysUntilNext);
    return nextDueDate;
}

function updateUpcomingDeductions() {
    const now = new Date();
    const expenseItems = document.querySelectorAll('#expense-list li');
    let upcomingDeductions = [];

    // Collect weekly expenses
    expenseItems.forEach(item => {
        const expenseName = item.querySelector('.expense-name').innerText;
        const amount = parseFloat(item.querySelector('.expense-amount').innerText.replace('$', ''));
        const frequency = item.querySelector('.expense-frequency').innerText;
        const day = item.querySelector('.expense-day').innerText;

        if (frequency === 'weekly') {
            const nextDueDate = getNextDueDate(frequency, now, day);
            upcomingDeductions.push({ expenseName, amount, frequency, day, nextDueDate });
        }
    });

    // If no weekly expenses, collect fortnightly expenses
    if (upcomingDeductions.length === 0) {
        expenseItems.forEach(item => {
            const expenseName = item.querySelector('.expense-name').innerText;
            const amount = parseFloat(item.querySelector('.expense-amount').innerText.replace('$', ''));
            const frequency = item.querySelector('.expense-frequency').innerText;
            const day = item.querySelector('.expense-day').innerText;

            if (frequency === 'fortnightly') {
                const nextDueDate = getNextDueDate(frequency, now, day);
                upcomingDeductions.push({ expenseName, amount, frequency, day, nextDueDate });
            }
        });
    }

    // If no fortnightly expenses, collect monthly expenses
    if (upcomingDeductions.length === 0) {
        expenseItems.forEach(item => {
            const expenseName = item.querySelector('.expense-name').innerText;
            const amount = parseFloat(item.querySelector('.expense-amount').innerText.replace('$', ''));
            const frequency = item.querySelector('.expense-frequency').innerText;
            const day = item.querySelector('.expense-day').innerText;

            if (frequency === 'monthly') {
                const nextDueDate = getNextDueDate(frequency, now, day);
                upcomingDeductions.push({ expenseName, amount, frequency, day, nextDueDate });
            }
        });
    }

    // Sort by day of the week
    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    upcomingDeductions.sort((a, b) => daysOfWeek.indexOf(a.day) - daysOfWeek.indexOf(b.day));

    const nextDeduction = upcomingDeductions[0];
    if (nextDeduction) {
        document.getElementById('next-deduction-name').innerText = nextDeduction.expenseName;
        document.getElementById('next-deduction-amount').innerText = `$${nextDeduction.amount.toFixed(2)}`;
        document.getElementById('next-deduction-frequency').innerText = nextDeduction.frequency;
        document.getElementById('next-deduction-day').innerText = nextDeduction.day;
        document.getElementById('next-deduction-date').innerText = nextDeduction.nextDueDate.toDateString();
    }
}