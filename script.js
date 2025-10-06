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
    // Theme toggle functionality
    const themeToggle = document.getElementById('theme-toggle');
    const html = document.documentElement;

    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    function updateThemeIcon(theme) {
        const icon = themeToggle.querySelector('i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    // PWA Installation functionality
    let deferredPrompt;
    const installBanner = document.getElementById('pwa-install-banner');
    const installBtn = document.getElementById('install-btn');
    const dismissBtn = document.getElementById('dismiss-btn');

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
        // App is already installed, hide banner
        installBanner.style.display = 'none';
    }

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('PWA: Install prompt triggered');
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later
        deferredPrompt = e;

        // Show the install banner after a short delay
        setTimeout(() => {
            // Check if user has already dismissed the banner
            const dismissed = localStorage.getItem('pwa-install-dismissed');
            if (!dismissed) {
                installBanner.style.display = 'block';
            }
        }, 3000); // Show after 3 seconds
    });

    // Handle install button click
    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) {
            console.log('PWA: Install prompt not available');
            return;
        }

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        console.log(`PWA: User response to install prompt: ${outcome}`);

        // Reset the deferred prompt variable
        deferredPrompt = null;

        // Hide the banner
        installBanner.style.display = 'none';
    });

    // Handle dismiss button click
    dismissBtn.addEventListener('click', () => {
        installBanner.style.display = 'none';
        // Remember that user dismissed the banner
        localStorage.setItem('pwa-install-dismissed', 'true');
    });

    // Listen for successful installation
    window.addEventListener('appinstalled', (evt) => {
        console.log('PWA: App was installed successfully');
        installBanner.style.display = 'none';
    });

    // Check if running in standalone mode (already installed)
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('PWA: Running in standalone mode');
    }

    new Vue({
        el: '#app',
        data: {
            currentPage: 'dashboard', // Default page
            budget: 0,
            expenses: [],
            newExpense: {
                name: '',
                amount: 0,
                frequency: 'weekly',
                day: 'monday',
                category: 'other',
                startDate: new Date().toISOString().split('T')[0]
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
            isEditing: false,
            // Search and filter properties
            searchQuery: '',
            categoryFilter: '',
            frequencyFilter: '',
            sortBy: 'date-desc',
            expenseCategories: [
                { id: 'food', name: 'Food & Dining', icon: 'fas fa-utensils', color: '#ff6b6b' },
                { id: 'transport', name: 'Transportation', icon: 'fas fa-car', color: '#4ecdc4' },
                { id: 'shopping', name: 'Shopping', icon: 'fas fa-shopping-bag', color: '#45b7d1' },
                { id: 'entertainment', name: 'Entertainment', icon: 'fas fa-film', color: '#f9ca24' },
                { id: 'bills', name: 'Bills & Utilities', icon: 'fas fa-bolt', color: '#6c5ce7' },
                { id: 'health', name: 'Health & Fitness', icon: 'fas fa-heartbeat', color: '#fd79a8' },
                { id: 'education', name: 'Education', icon: 'fas fa-graduation-cap', color: '#00b894' },
                { id: 'travel', name: 'Travel', icon: 'fas fa-plane', color: '#a29bfe' },
                { id: 'other', name: 'Other', icon: 'fas fa-ellipsis-h', color: '#636e72' }
            ]
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
                const { name, amount, frequency, day, category, startDate } = this.newExpense;
                const parsedAmount = parseFloat(amount);
                if (name && !isNaN(parsedAmount) && parsedAmount > 0) {
                    if (this.editingIndex !== null) {
                        this.expenses.splice(this.editingIndex, 1, { name, amount: parsedAmount.toFixed(2), frequency, day, category, startDate });
                        this.editingIndex = null;
                        this.isEditing = false;
                    } else {
                        this.expenses.push({ name, amount: parsedAmount.toFixed(2), frequency, day, category, startDate });
                    }
                    this.resetNewExpense();
                    this.updateTotalExpenses();
                    this.updateDeductions();
                    this.updateUpcomingDeductions();
                    localStorage.setItem('expenses', JSON.stringify(this.expenses)); // Store expenses in Local Storage
                    this.displaySuccess('Expense added successfully!');
                } else {
                    this.displayError('Please enter valid expense details.');
                }
            },
            resetNewExpense() {
                this.newExpense = { name: '', amount: 0, frequency: 'weekly', day: 'monday', category: 'other', startDate: new Date().toISOString().split('T')[0] };
                this.isEditing = false;
            },
            getCategoryById(categoryId) {
                return this.expenseCategories.find(cat => cat.id === categoryId) || this.expenseCategories.find(cat => cat.id === 'other');
            },
            formatDate(dateString) {
                if (!dateString) return '';
                const date = new Date(dateString);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
            displayNotification(message, type = 'error') {
                const notification = document.createElement('div');
                notification.className = `notification ${type}-notification`;
                notification.innerHTML = `
                    <div class="flex items-center gap-2">
                        <i class="fas ${type === 'error' ? 'fa-exclamation-triangle' : type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
                        <span>${message}</span>
                    </div>
                `;
                document.body.appendChild(notification);

                // Trigger animation
                setTimeout(() => {
                    notification.style.display = 'block';
                }, 10);

                // Auto-hide after 4 seconds
                setTimeout(() => {
                    notification.style.opacity = '0';
                    notification.style.transform = 'translateX(100%)';
                    setTimeout(() => {
                        if (notification.parentNode) {
                            document.body.removeChild(notification);
                        }
                    }, 300);
                }, 4000);

                // Allow manual dismissal
                notification.addEventListener('click', () => {
                    notification.style.opacity = '0';
                    notification.style.transform = 'translateX(100%)';
                    setTimeout(() => {
                        if (notification.parentNode) {
                            document.body.removeChild(notification);
                        }
                    }, 300);
                });
            },
            displayError(message) {
                this.displayNotification(message, 'error');
            },
            displaySuccess(message) {
                this.displayNotification(message, 'success');
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
            },
            createCharts() {
                this.$nextTick(() => {
                    this.createCategoryChart();
                    this.createFrequencyChart();
                });
            },
            createCategoryChart() {
                const ctx = document.getElementById('categoryChart');
                if (!ctx) return;

                const categoryData = {};
                this.expenses.forEach(expense => {
                    const category = this.getCategoryById(expense.category);
                    const amount = parseFloat(expense.amount);
                    categoryData[category.name] = (categoryData[category.name] || 0) + amount;
                });

                const labels = Object.keys(categoryData);
                const data = Object.values(categoryData);
                const colors = labels.map(label => {
                    const category = this.expenseCategories.find(cat => cat.name === label);
                    return category ? category.color : '#636e72';
                });

                new Chart(ctx, {
                    type: 'pie',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: data,
                            backgroundColor: colors,
                            borderWidth: 2,
                            borderColor: 'rgba(255, 255, 255, 0.8)'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    padding: 20,
                                    usePointStyle: true
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                        const percentage = ((context.parsed / total) * 100).toFixed(1);
                                        return `${context.label}: $${context.parsed} (${percentage}%)`;
                                    }
                                }
                            }
                        }
                    }
                });
            },
            createFrequencyChart() {
                const ctx = document.getElementById('frequencyChart');
                if (!ctx) return;

                const frequencyData = {
                    'Weekly': 0,
                    'Fortnightly': 0,
                    'Monthly': 0
                };

                this.expenses.forEach(expense => {
                    const amount = parseFloat(expense.amount);
                    const frequency = expense.frequency.charAt(0).toUpperCase() + expense.frequency.slice(1);
                    frequencyData[frequency] += amount;
                });

                const labels = Object.keys(frequencyData);
                const data = Object.values(frequencyData);

                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Amount ($)',
                            data: data,
                            backgroundColor: [
                                'rgba(0, 123, 255, 0.8)',
                                'rgba(40, 167, 69, 0.8)',
                                'rgba(255, 193, 7, 0.8)'
                            ],
                            borderColor: [
                                'rgba(0, 123, 255, 1)',
                                'rgba(40, 167, 69, 1)',
                                'rgba(255, 193, 7, 1)'
                            ],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: function(value) {
                                        return '$' + value;
                                    }
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return `$${context.parsed.y}`;
                                    }
                                }
                            }
                        }
                    }
                });
            },
            clearFilters() {
                this.searchQuery = '';
                this.categoryFilter = '';
                this.frequencyFilter = '';
                this.sortBy = 'date-desc';
            },
            exportToCSV() {
                if (this.expenses.length === 0) {
                    this.displayError('No expenses to export.');
                    return;
                }

                // Create CSV headers
                const headers = ['Name', 'Amount', 'Frequency', 'Category', 'Day', 'Start Date'];

                // Convert expenses to CSV rows
                const csvRows = this.expenses.map(expense => [
                    expense.name,
                    expense.amount,
                    expense.frequency,
                    this.getCategoryById(expense.category).name,
                    expense.day,
                    expense.startDate || ''
                ]);

                // Combine headers and rows
                const csvContent = [headers, ...csvRows]
                    .map(row => row.map(field => `"${field}"`).join(','))
                    .join('\n');

                // Create and download the file
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');

                if (link.download !== undefined) {
                    const url = URL.createObjectURL(blob);
                    link.setAttribute('href', url);
                    link.setAttribute('download', `expenses_${new Date().toISOString().split('T')[0]}.csv`);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    this.displaySuccess('Expenses exported successfully!');
                } else {
                    this.displayError('Export not supported in this browser.');
                }
            },
            importFromCSV(event) {
                const file = event.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const csvText = e.target.result;
                        const lines = csvText.split('\n').filter(line => line.trim());
                        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

                        // Validate CSV format
                        const expectedHeaders = ['Name', 'Amount', 'Frequency', 'Category', 'Day', 'Start Date'];
                        const isValidFormat = expectedHeaders.every(header =>
                            headers.includes(header)
                        );

                        if (!isValidFormat) {
                            this.displayError('Invalid CSV format. Please use the exported format.');
                            return;
                        }

                        const importedExpenses = [];
                        for (let i = 1; i < lines.length; i++) {
                            const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
                            if (values.length >= 5) {
                                const [name, amount, frequency, category, day, startDate] = values;

                                // Validate and convert category
                                const categoryId = this.expenseCategories.find(cat =>
                                    cat.name.toLowerCase() === category.toLowerCase()
                                )?.id || 'other';

                                if (name && amount && !isNaN(parseFloat(amount))) {
                                    importedExpenses.push({
                                        name: name.trim(),
                                        amount: parseFloat(amount).toFixed(2),
                                        frequency: frequency.toLowerCase().trim(),
                                        category: categoryId,
                                        day: day.toLowerCase().trim(),
                                        startDate: startDate ? startDate.trim() : new Date().toISOString().split('T')[0]
                                    });
                                }
                            }
                        }

                        if (importedExpenses.length > 0) {
                            // Merge with existing expenses
                            this.expenses = [...this.expenses, ...importedExpenses];
                            localStorage.setItem('expenses', JSON.stringify(this.expenses));
                            this.updateTotalExpenses();
                            this.updateDeductions();
                            this.updateUpcomingDeductions();
                            this.displaySuccess(`Successfully imported ${importedExpenses.length} expenses!`);
                        } else {
                            this.displayError('No valid expenses found in the CSV file.');
                        }
                    } catch (error) {
                        this.displayError('Error reading CSV file. Please check the format.');
                    }
                };
                reader.readAsText(file);

                // Reset file input
                event.target.value = '';
            },
            backupData() {
                try {
                    const backupData = {
                        budget: this.budget,
                        expenses: this.expenses,
                        theme: localStorage.getItem('theme') || 'light',
                        timestamp: new Date().toISOString(),
                        version: '1.0'
                    };

                    const dataStr = JSON.stringify(backupData, null, 2);
                    const blob = new Blob([dataStr], { type: 'application/json' });
                    const link = document.createElement('a');

                    if (link.download !== undefined) {
                        const url = URL.createObjectURL(blob);
                        link.setAttribute('href', url);
                        link.setAttribute('download', `budget_backup_${new Date().toISOString().split('T')[0]}.json`);
                        link.style.visibility = 'hidden';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        this.displaySuccess('Data backup created successfully!');
                    } else {
                        this.displayError('Backup not supported in this browser.');
                    }
                } catch (error) {
                    this.displayError('Error creating backup. Please try again.');
                }
            },
            validateExpenseData() {
                let isValid = true;
                const errors = [];

                // Validate budget
                if (this.budget && (isNaN(this.budget) || this.budget < 0)) {
                    errors.push('Budget must be a valid positive number');
                    isValid = false;
                }

                // Validate expenses
                this.expenses.forEach((expense, index) => {
                    if (!expense.name || expense.name.trim().length === 0) {
                        errors.push(`Expense ${index + 1}: Name is required`);
                        isValid = false;
                    }
                    if (!expense.amount || isNaN(expense.amount) || expense.amount <= 0) {
                        errors.push(`Expense ${index + 1}: Amount must be a valid positive number`);
                        isValid = false;
                    }
                    if (!['weekly', 'fortnightly', 'monthly'].includes(expense.frequency)) {
                        errors.push(`Expense ${index + 1}: Invalid frequency`);
                        isValid = false;
                    }
                    if (!this.expenseCategories.find(cat => cat.id === expense.category)) {
                        errors.push(`Expense ${index + 1}: Invalid category`);
                        isValid = false;
                    }
                    if (!['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(expense.day)) {
                        errors.push(`Expense ${index + 1}: Invalid day`);
                        isValid = false;
                    }
                });

                if (!isValid) {
                    this.displayError('Data validation failed: ' + errors.join('; '));
                }

                return isValid;
            },
            switchPage(page) {
                this.currentPage = page;
                // Create charts when switching to analytics page
                if (page === 'analytics') {
                    this.$nextTick(() => {
                        this.createCharts();
                    });
                }
            }
        },
        computed: {
            budgetPercentage() {
                if (this.budget <= 0) return 0;
                return Math.min((this.budget / (this.budget + this.totalExpenses)) * 100, 100);
            },
            actualPercentage() {
                if (this.totalExpenses <= 0) return 0;
                return Math.min((this.totalExpenses / (this.budget + this.totalExpenses)) * 100, 100);
            },
            filteredExpenses() {
                let filtered = [...this.expenses];

                // Apply search filter
                if (this.searchQuery.trim()) {
                    const query = this.searchQuery.toLowerCase();
                    filtered = filtered.filter(expense =>
                        expense.name.toLowerCase().includes(query)
                    );
                }

                // Apply category filter
                if (this.categoryFilter) {
                    filtered = filtered.filter(expense =>
                        expense.category === this.categoryFilter
                    );
                }

                // Apply frequency filter
                if (this.frequencyFilter) {
                    filtered = filtered.filter(expense =>
                        expense.frequency === this.frequencyFilter
                    );
                }

                // Apply sorting
                filtered.sort((a, b) => {
                    switch (this.sortBy) {
                        case 'date-desc':
                            return new Date(b.startDate || '1970-01-01') - new Date(a.startDate || '1970-01-01');
                        case 'date-asc':
                            return new Date(a.startDate || '1970-01-01') - new Date(b.startDate || '1970-01-01');
                        case 'amount-desc':
                            return parseFloat(b.amount) - parseFloat(a.amount);
                        case 'amount-asc':
                            return parseFloat(a.amount) - parseFloat(b.amount);
                        case 'name-asc':
                            return a.name.localeCompare(b.name);
                        case 'name-desc':
                            return b.name.localeCompare(a.name);
                        default:
                            return 0;
                    }
                });

                return filtered;
            }
        },
        watch: {
            expenses: {
                handler() {
                    // Only create charts if on analytics page
                    if (this.currentPage === 'analytics') {
                        this.createCharts();
                    }
                },
                deep: true
            },
            currentPage(newPage) {
                if (newPage === 'analytics') {
                    this.$nextTick(() => {
                        this.createCharts();
                    });
                }
            }
        },
        mounted() {
            this.requestNotificationPermission();
            this.loadFromLocalStorage(); // Load data from Local Storage on mount
            this.createCharts(); // Create charts on mount
        }
    });
});
