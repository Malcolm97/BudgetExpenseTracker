document.getElementById('set-budget').addEventListener('click', function() {
    const budgetInput = document.getElementById('budget').value;
    const totalBudget = parseFloat(budgetInput);
    if (!isNaN(totalBudget) && totalBudget > 0) {
        document.getElementById('remaining-budget').innerText = totalBudget.toFixed(2);
        document.getElementById('total-expenses').innerText = '0';
        document.getElementById('expense-list').innerHTML = ''; // Clear previous expenses
    } else {
        alert('Please enter a valid budget amount.');
    }
});

document.getElementById('add-expense').addEventListener('click', function() {
    const expenseName = document.getElementById('expense-name').value;
    const expenseAmount = document.getElementById('expense-amount').value;
    const expenseFrequency = document.getElementById('expense-frequency').value;
    const totalExpensesElement = document.getElementById('total-expenses');
    const remainingBudgetElement = document.getElementById('remaining-budget');

    const amount = parseFloat(expenseAmount);
    if (expenseName && !isNaN(amount) && amount > 0) {
        // Adjust amount based on frequency
        let adjustedAmount = amount;
        if (expenseFrequency === 'weekly') {
            adjustedAmount *= 1; // Weekly remains the same
        } else if (expenseFrequency === 'monthly') {
            adjustedAmount /= 4; // Monthly to weekly
        } else if (expenseFrequency === 'yearly') {
            adjustedAmount /= 52; // Yearly to weekly
        }

        // Add expense to the list
        const expenseList = document.getElementById('expense-list');
        const listItem = document.createElement('li');
        listItem.innerText = `${expenseName}: $${adjustedAmount.toFixed(2)} (${expenseFrequency})`;
        expenseList.appendChild(listItem);

        // Update total expenses and remaining budget
        const currentTotalExpenses = parseFloat(totalExpensesElement.innerText);
        const newTotalExpenses = currentTotalExpenses + adjustedAmount;
        totalExpensesElement.innerText = newTotalExpenses.toFixed(2);

        const currentRemainingBudget = parseFloat(remainingBudgetElement.innerText);
        const newRemainingBudget = currentRemainingBudget - adjustedAmount;
        remainingBudgetElement.innerText = newRemainingBudget.toFixed(2);

        // Clear input fields
        document.getElementById('expense-name').value = '';
        document.getElementById('expense-amount').value = '';
    } else {
        alert('Please enter valid expense details.');
    }
});
