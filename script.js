if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/service-worker.js').then(function(registration) {
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, function(error) {
      console.log('ServiceWorker registration failed: ', error);
    });
  });
}

document.addEventListener('DOMContentLoaded', function() {
    new Vue({
        el: '#app',
        data: {
            budget: 0,
            expenses: [],
            newExpense: {
                name: '',
                amount: 0,
                frequency: 'weekly',
                day: 'monday'
            },
            totalExpenses: 0,
            remainingBalance: 0,
            deductions: {
                weekly: 0,
                fortnightly: 0,
                monthly: 0,
                daily: 0
            },
            nextDeduction: {},
            editingIndex: null,
            isEditing: false
        },
        methods: {
            setBudget() {
                const totalBudget = parseFloat(this.budget);
                if (!isNaN(totalBudget) && totalBudget > 0) {
                    this.budget = totalBudget.toFixed(2);
                    this.remainingBalance = totalBudget.toFixed(2);
                    this.updateTotalExpenses();
                    localStorage.setItem('budget', this.budget); // Store budget in Local Storage
                } else {
                    this.displayError('Please enter a valid budget amount.');
                }
            },
            addExpense() {
                const { name, amount, frequency, day } = this.newExpense;
                const parsedAmount = parseFloat(amount);
                if (name && !isNaN(parsedAmount) && parsedAmount > 0) {
                    if (this.editingIndex !== null) {
                        this.expenses.splice(this.editingIndex, 1, { name, amount: parsedAmount.toFixed(2), frequency, day });
                        this.editingIndex = null;
                        this.isEditing = false;
                    } else {
                        this.expenses.push({ name, amount: parsedAmount.toFixed(2), frequency, day });
                    }
                    this.resetNewExpense();
                    this.updateTotalExpenses();
                    this.updateDeductions();
                    this.updateUpcomingDeductions();
                    localStorage.setItem('expenses', JSON.stringify(this.expenses)); // Store expenses in Local Storage
                } else {
                    this.displayError('Please enter valid expense details.');
                }
            },
            resetNewExpense() {
                this.newExpense = { name: '', amount: 0, frequency: 'weekly', day: 'monday' };
                this.isEditing = false;
            },
            updateTotalExpenses() {
                let totalWeekly = 0;
                let totalFortnightly = 0;
                let totalMonthly = 0;

                this.expenses.forEach(expense => {
                    const amount = parseFloat(expense.amount);
                    if (expense.frequency === 'weekly') {
                        totalWeekly += amount;
                    } else if (expense.frequency === 'fortnightly') {
                        totalFortnightly += amount;
                    } else if (expense.frequency === 'monthly') {
                        totalMonthly += amount;
                    }
                });

                this.totalExpenses = (totalWeekly + totalFortnightly + totalMonthly).toFixed(2);
                this.remainingBalance = (this.budget - this.totalExpenses).toFixed(2);
            },
            updateDeductions() {
                const now = new Date();
                this.deductions.weekly = this.calculateDeductions('weekly').toFixed(2);
                this.deductions.fortnightly = this.calculateDeductions('fortnightly').toFixed(2);
                this.deductions.monthly = this.calculateDeductions('monthly').toFixed(2);
                this.deductions.daily = this.calculateDeductions('daily').toFixed(2);
                this.updateUpcomingDeductions();
            },
            calculateDeductions(frequency) {
                return this.expenses.reduce((total, expense) => {
                    return expense.frequency === frequency ? total + parseFloat(expense.amount) : total;
                }, 0);
            },
            getNextDueDate(frequency, now, day) {
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
            },
            updateUpcomingDeductions() {
                const now = new Date();
                let upcomingDeductions = [];

                this.expenses.forEach(expense => {
                    if (expense.frequency === 'weekly') {
                        const nextDueDate = this.getNextDueDate(expense.frequency, now, expense.day);
                        upcomingDeductions.push({ ...expense, nextDueDate });
                    }
                });

                if (upcomingDeductions.length === 0) {
                    this.expenses.forEach(expense => {
                        if (expense.frequency === 'fortnightly') {
                            const nextDueDate = this.getNextDueDate(expense.frequency, now, expense.day);
                            upcomingDeductions.push({ ...expense, nextDueDate });
                        }
                    });
                }

                if (upcomingDeductions.length === 0) {
                    this.expenses.forEach(expense => {
                        if (expense.frequency === 'monthly') {
                            const nextDueDate = this.getNextDueDate(expense.frequency, now, expense.day);
                            upcomingDeductions.push({ ...expense, nextDueDate });
                        }
                    });
                }

                const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                upcomingDeductions.sort((a, b) => daysOfWeek.indexOf(a.day) - daysOfWeek.indexOf(b.day));

                this.nextDeduction = upcomingDeductions[0] || {};
            },
            displayNotification(message, isError = true) {
                const notification = document.createElement('div');
                notification.className = isError ? 'error-notification' : 'success-notification';
                notification.textContent = message;
                document.body.appendChild(notification);
                notification.style.display = 'block';
                setTimeout(() => {
                    notification.style.display = 'none';
                    document.body.removeChild(notification);
                }, 3000); // Hide after 3 seconds
            },
            displayError(message) {
                this.displayNotification(message, true);
            },
            displaySuccess(message) {
                this.displayNotification(message, false);
            },
            calculateTotalExpenses() {
                this.updateTotalExpenses();
            },
            clearAllExpenses() {
                this.expenses = [];
                this.updateTotalExpenses();
                this.updateDeductions();
                this.updateUpcomingDeductions();
                localStorage.removeItem('expenses'); // Remove expenses from Local Storage
            },
            editExpense(index) {
                const expense = this.expenses[index];
                this.newExpense = { ...expense };
                this.editingIndex = index;
                this.isEditing = true;
                this.refreshExpenseButtons();
            },
            saveEdits() {
                this.addExpense();
                this.refreshExpenseButtons();
            },
            deleteExpense(index) {
                this.expenses.splice(index, 1);
                this.updateTotalExpenses();
                this.updateDeductions();
                this.updateUpcomingDeductions();
                localStorage.setItem('expenses', JSON.stringify(this.expenses)); // Update expenses in Local Storage
            },
            refreshExpenseButtons() {
                this.$nextTick(() => {
                    document.querySelectorAll('.save-expense').forEach(button => button.style.display = 'none');
                    document.querySelectorAll('.edit-expense').forEach(button => button.style.display = 'inline-block');
                });
            },
            requestNotificationPermission() {
                if ('Notification' in window && navigator.serviceWorker) {
                    Notification.requestPermission().then(permission => {
                        if (permission === 'granted') {
                            console.log('Notification permission granted.');
                        } else {
                            console.log('Notification permission denied.');
                        }
                    });
                }
            },
            loadFromLocalStorage() {
                const storedBudget = localStorage.getItem('budget');
                if (storedBudget) {
                    this.budget = parseFloat(storedBudget);
                    this.remainingBalance = this.budget;
                }
                const storedExpenses = localStorage.getItem('expenses');
                if (storedExpenses) {
                    this.expenses = JSON.parse(storedExpenses);
                    this.updateTotalExpenses();
                    this.updateDeductions();
                    this.updateUpcomingDeductions();
                }
            }
        },
        mounted() {
            this.requestNotificationPermission();
            this.loadFromLocalStorage(); // Load data from Local Storage on mount
        }
    });
});