document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('set-budget').addEventListener('click', function() {
        console.log('Set Budget button clicked'); // Log button click
        try {
            const budgetInput = document.getElementById('budget').value;
            console.log('Budget Input:', budgetInput); // Log the input value
            const totalBudget = parseFloat(budgetInput);
            console.log('Parsed Total Budget:', totalBudget); // Log parsed budget
            if (!isNaN(totalBudget) && totalBudget > 0) {
                const fortnightlyBudget = parseFloat(document.getElementById('fortnightly-budget').value) || 0; // Get fortnightly budget
                console.log('Fortnightly Budget:', fortnightlyBudget); // Log fortnightly budget
                const combinedBudget = totalBudget + fortnightlyBudget; // Include fortnightly budget in total
                const totalExpenses = totalWeeklyExpenses + totalFortnightlyExpenses + totalMonthlyExpenses; // Calculate total expenses
                
                const remainingBudgetElement = document.getElementById('remaining-budget');
                if (remainingBudgetElement) {
                    remainingBudgetElement.innerText = combinedBudget.toFixed(2);
                } else {
                    console.error('Remaining budget element not found');
                }
                
                // Update savings
                const savings = calculateSavings(totalExpenses, combinedBudget); // Calculate savings
                document.getElementById('savings').innerText = savings.toFixed(2); // Display savings
                
                document.getElementById('budget').value = ''; // Clear the budget input field
                updateTotalExpenses(); // Reset expenses
            } else {
                alert('Please enter a valid budget amount.');
            }
        } catch (error) {
            console.error('Error setting budget:', error); // Log any errors
        }
    });

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

    // Example usage
    changeColors('#', '#007bff'); // Change button color to original and summary text color to blue

    // Add event listener for the Change Color Scheme button
    document.getElementById('change-color-scheme').addEventListener('click', function() {
        const buttonColor = '#ff69b4'; // Pretty pink color
        const summaryColor = prompt("Enter the desired summary text color (e.g., #007bff):");
        changeColors(buttonColor, summaryColor);
    });
});

let totalWeeklyExpenses = 0;
let totalFortnightlyExpenses = 0;
let totalMonthlyExpenses = 0;

function collectFortnightlyBudget() {
    return totalFortnightlyExpenses; // Return the total fortnightly expenses
}

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
    
    // Add event listeners for edit and delete buttons
    listItem.querySelector('.edit-expense').addEventListener('click', function() {
        editExpense(listItem, expenseName, amount, frequency);
    });
    
    // Add event listener for delete button
    listItem.querySelector('.delete-expense').addEventListener('click', function() {
        console.log('Delete button clicked'); // Log when the delete button is clicked
        expenseList.removeChild(listItem); // Remove the list item from the expense list
        updateTotalExpenses(); // Update totals after deleting
    });

    // Update total expenses based on frequency
    updateExpenses(amount, frequency);
}

function editExpense(listItem, expenseName, amount, frequency) {
    console.log('Edit button clicked'); // Log when the edit button is clicked
    const expenseNameElement = listItem.querySelector('.expense-name');
    const expenseAmountElement = listItem.querySelector('.expense-amount');
    const expenseFrequencyElement = listItem.querySelector('.expense-frequency');

    // Create input fields for editing
    const nameInput = document.createElement('input');
    nameInput.value = expenseNameElement.innerText;
    const amountInput = document.createElement('input');
    amountInput.value = amount.toFixed(2);
    const frequencyInput = document.createElement('select');
    const frequencies = ['weekly', 'fortnightly', 'monthly'];
    frequencies.forEach(freq => {
        const option = document.createElement('option');
        option.value = freq;
        option.textContent = freq.charAt(0).toUpperCase() + freq.slice(1);
        if (freq === frequency) {
            option.selected = true;
        }
        frequencyInput.appendChild(option);
    });

    // Replace the displayed values with input fields
    expenseNameElement.innerHTML = '';
    expenseAmountElement.innerHTML = '';
    expenseFrequencyElement.innerHTML = '';
    expenseNameElement.appendChild(nameInput);
    expenseAmountElement.appendChild(amountInput);
    expenseFrequencyElement.appendChild(frequencyInput);

    // Create a save button
    const saveButton = document.createElement('button');
    saveButton.innerText = 'Save';
    saveButton.className = 'bg-green-500 text-white p-1 rounded';
    listItem.appendChild(saveButton);

    // Add event listener for save button
    saveButton.addEventListener('click', function() {
        const newExpenseName = nameInput.value;
        const newExpenseAmount = parseFloat(amountInput.value);
        const newExpenseFrequency = frequencyInput.value;
        if (newExpenseName && !isNaN(newExpenseAmount)) {
            // Update the displayed values
            expenseNameElement.innerText = newExpenseName;
            expenseAmountElement.innerText = `$${newExpenseAmount.toFixed(2)}`;
            expenseFrequencyElement.innerText = newExpenseFrequency.charAt(0).toUpperCase() + newExpenseFrequency.slice(1);
            // Update the expense variables
            expenseName = newExpenseName;
            amount = newExpenseAmount;
            frequency = newExpenseFrequency;
            updateTotalExpenses(); // Update totals after editing
            listItem.removeChild(saveButton); // Remove the save button
        } else {
            alert('Please enter valid expense details.');
        }
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
    const savings = calculateSavings(totalExpenses, totalBudget); // Calculate savings
    document.getElementById('savings').innerText = savings.toFixed(2); // Display savings

    // Display the fortnightly budget in the summary section
    const fortnightlyBudgetElement = document.getElementById('fortnightly-budget-summary');
    fortnightlyBudgetElement.innerText = `Fortnightly Budget: $${collectFortnightlyBudget().toFixed(2)}`;
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