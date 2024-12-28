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
            nextDeduction: {}
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
                    this.expenses.push({ name, amount: parsedAmount.toFixed(2), frequency, day });
                    this.newExpense = { name: '', amount: 0, frequency: 'weekly', day: 'monday' };
                    this.updateTotalExpenses();
                    this.updateDeductions();
                    this.updateUpcomingDeductions();
                    localStorage.setItem('expenses', JSON.stringify(this.expenses)); // Store expenses in Local Storage
                } else {
                    this.displayError('Please enter valid expense details.');
                }
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
                this.deductions.weekly = this.calculateDeductions('weekly', now).toFixed(2);
                this.deductions.fortnightly = this.calculateDeductions('fortnightly', now).toFixed(2);
                this.deductions.monthly = this.calculateDeductions('monthly', now).toFixed(2);
                this.deductions.daily = this.calculateDeductions('day', now).toFixed(2);
                this.updateUpcomingDeductions();
            },
            calculateDeductions(frequency, now) {
                let totalDeductions = 0;
                this.expenses.forEach(expense => {
                    if (expense.frequency === frequency) {
                        totalDeductions += parseFloat(expense.amount);
                    }
                });
                return totalDeductions;
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
                if (this.nextDeduction.name) {
                    this.sendNotificationAndAddToAppleCalendar(this.nextDeduction);
                }
            },
            displayError(message) {
                alert(message); // Show error as a pop-up
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
                this.expenses.splice(index, 1);
            },
            saveEdits(index) {
                const { name, amount, frequency, day } = this.newExpense;
                const parsedAmount = parseFloat(amount);
                if (name && !isNaN(parsedAmount) && parsedAmount > 0) {
                    this.expenses.splice(index, 1, { name, amount: parsedAmount.toFixed(2), frequency, day });
                    this.newExpense = { name: '', amount: 0, frequency: 'weekly', day: 'monday' };
                    this.updateTotalExpenses();
                    this.updateDeductions();
                    this.updateUpcomingDeductions();
                    localStorage.setItem('expenses', JSON.stringify(this.expenses)); // Update expenses in Local Storage
                } else {
                    this.displayError('Please enter valid expense details.');
                }
            },
            deleteExpense(index) {
                this.expenses.splice(index, 1);
                this.updateTotalExpenses();
                this.updateDeductions();
                this.updateUpcomingDeductions();
                localStorage.setItem('expenses', JSON.stringify(this.expenses)); // Update expenses in Local Storage
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
            sendNotificationAndAddToAppleCalendar(deduction) {
                if ('Notification' in window && navigator.serviceWorker) {
                    navigator.serviceWorker.ready.then(registration => {
                        registration.showNotification('Upcoming Deduction', {
                            body: `Expense: ${deduction.name}, Amount: $${deduction.amount}, Due: ${deduction.nextDueDate}`,
                            icon: 'icons/icon-192x192.png',
                            tag: 'upcoming-deduction'
                        });
                    });
                }
                this.addToAppleCalendar(deduction);
            },
            addToAppleCalendar(deduction) {
                const cal = ics();
                const startDate = new Date(deduction.nextDueDate);
                const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // 30 minutes duration
                cal.addEvent(deduction.name, `Amount: $${deduction.amount}`, '', startDate, endDate);
                cal.download(`${deduction.name}-event`);
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