// Budget Expense Tracker - Production Ready Version
// Optimized and enhanced with modern features

// ===== SERVICE WORKER REGISTRATION =====
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('./service-worker.js').then(function(registration) {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
            
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            showUpdateNotification();
                        }
                    });
                }
            });
        }, function(error) {
            console.log('ServiceWorker registration failed: ', error);
        });
    });
}

function showUpdateNotification() {
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = '<div class="update-content"><i class="fas fa-sync-alt"></i><span>New version available!</span><button onclick="window.location.reload()" class="btn-primary btn-sm">Update</button></div>';
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 100);
}

// ===== UTILITY FUNCTIONS =====
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ===== MAIN APPLICATION =====
document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('theme-toggle');
    const html = document.documentElement;

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
        if (icon) icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    // ===== OFFLINE INDICATOR =====
    const offlineIndicator = document.createElement('div');
    offlineIndicator.className = 'offline-indicator';
    offlineIndicator.innerHTML = '<i class="fas fa-wifi-slash"></i> You are offline';
    document.body.appendChild(offlineIndicator);

    function updateOnlineStatus() {
        if (navigator.onLine) {
            offlineIndicator.classList.remove('show');
        } else {
            offlineIndicator.classList.add('show');
        }
    }

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();

    // ===== PWA INSTALLATION =====
    let deferredPrompt;
    const installBanner = document.getElementById('pwa-install-banner');
    const installBtn = document.getElementById('install-btn');
    const dismissBtn = document.getElementById('dismiss-btn');

    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
        if (installBanner) installBanner.style.display = 'none';
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('PWA: Install prompt triggered');
        e.preventDefault();
        deferredPrompt = e;
        setTimeout(() => {
            const dismissed = localStorage.getItem('pwa-install-dismissed');
            if (!dismissed && installBanner) installBanner.style.display = 'block';
        }, 3000);
    });

    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log('PWA: User response:', outcome);
            deferredPrompt = null;
            if (installBanner) installBanner.style.display = 'none';
        });
    }

    if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
            if (installBanner) installBanner.style.display = 'none';
            localStorage.setItem('pwa-install-dismissed', 'true');
        });
    }

    window.addEventListener('appinstalled', () => {
        console.log('PWA: App installed successfully');
        if (installBanner) installBanner.style.display = 'none';
    });

    // ===== VUE APPLICATION =====
    new Vue({
        el: '#app',
        data: {
            currentPage: 'dashboard',
            budget: 0,
            expenses: [],
            newExpense: {
                name: '',
                amount: '',
                frequency: 'weekly',
                day: 'monday',
                dayOfMonth: 1,
                category: 'other',
                startDate: new Date().toISOString().split('T')[0],
                notes: ''
            },
            totalExpenses: 0,
            remainingBalance: 0,
            deductions: { weekly: 0, fortnightly: 0, monthly: 0, daily: 0 },
            nextDeduction: { name: '', amount: 0, frequency: '', day: '', nextDueDate: '' },
            upcomingDeductions: [],
            editingIndex: null,
            isEditing: false,
            isLoading: false,
            
            // Filters
                categoryFilter: '',
                frequencyFilter: '',
                sortBy: 'date-desc',
            
            // Currency
            currency: localStorage.getItem('currency') || 'USD',
            
            // Budget tracking mode
            budgetEnabled: localStorage.getItem('budgetEnabled') !== 'false',
            
            // Undo functionality
            lastDeleted: null,
            undoTimeout: null,
            
            // Chart instances
            categoryChart: null,
            frequencyChart: null,
            trendChart: null,
            
            // Budget alerts
            budgetAlerts: { 50: false, 75: false, 90: false, 100: false },
            
            // Category budgets and alerts
            categoryBudgets: {},
            categoryAlerts: {},
            
            // Spending history for trends
            spendingHistory: [],
            
            // Confirmation modal
            confirmModal: { show: false, title: '', message: '', onConfirm: null },
            
            // Categories
            expenseCategories: [
                { id: 'food', name: 'Food & Dining', icon: 'fas fa-utensils', color: '#ff6b6b' },
                { id: 'transport', name: 'Transportation', icon: 'fas fa-car', color: '#4ecdc4' },
                { id: 'shopping', name: 'Shopping', icon: 'fas fa-shopping-bag', color: '#45b7d1' },
                { id: 'entertainment', name: 'Entertainment', icon: 'fas fa-film', color: '#f9ca24' },
                { id: 'bills', name: 'Bills & Utilities', icon: 'fas fa-bolt', color: '#6c5ce7' },
                { id: 'health', name: 'Health & Fitness', icon: 'fas fa-heartbeat', color: '#fd79a8' },
                { id: 'education', name: 'Education', icon: 'fas fa-graduation-cap', color: '#00b894' },
                { id: 'travel', name: 'Travel', icon: 'fas fa-plane', color: '#a29bfe' },
                { id: 'subscriptions', name: 'Subscriptions', icon: 'fas fa-repeat', color: '#e17055' },
                { id: 'other', name: 'Other', icon: 'fas fa-ellipsis-h', color: '#636e72' }
            ],
            
            // Currencies
            availableCurrencies: [
                { code: 'USD', name: 'US Dollar', symbol: '$' },
                { code: 'EUR', name: 'Euro', symbol: '€' },
                { code: 'GBP', name: 'British Pound', symbol: '£' },
                { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
                { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
                { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
                { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
                { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' }
            ]
        },
        methods: {
            // ===== CURRENCY =====
            formatCurrency(amount) {
                const currencies = {
                    'USD': { symbol: '$', locale: 'en-US' },
                    'EUR': { symbol: '€', locale: 'de-DE' },
                    'GBP': { symbol: '£', locale: 'en-GB' },
                    'JPY': { symbol: '¥', locale: 'ja-JP' },
                    'AUD': { symbol: 'A$', locale: 'en-AU' },
                    'CAD': { symbol: 'C$', locale: 'en-CA' },
                    'INR': { symbol: '₹', locale: 'en-IN' },
                    'CNY': { symbol: '¥', locale: 'zh-CN' }
                };
                const curr = currencies[this.currency] || currencies['USD'];
                const num = parseFloat(amount) || 0;
                return curr.symbol + num.toLocaleString(curr.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            },
            
            getCurrencySymbol() {
                const curr = this.availableCurrencies.find(c => c.code === this.currency);
                return curr ? curr.symbol : '$';
            },
            
            setCurrency() {
                localStorage.setItem('currency', this.currency);
                this.displaySuccess('Currency changed to ' + this.currency);
            },
            
            // ===== BUDGET =====
            toggleBudgetEnabled() {
                this.budgetEnabled = !this.budgetEnabled;
                localStorage.setItem('budgetEnabled', this.budgetEnabled.toString());
                
                if (!this.budgetEnabled) {
                    this.budget = 0;
                    localStorage.removeItem('budget');
                    this.resetBudgetAlerts();
                    this.displaySuccess('Budget tracking disabled. Focus on expense tracking!');
                } else {
                    this.displaySuccess('Budget tracking enabled. Set your budget below.');
                }
                
                this.updateTotalExpenses();
            },
            
            setBudget() {
                try {
                    const totalBudget = parseFloat(this.budget);
                    
                    if (!this.budgetEnabled) {
                        this.budget = 0;
                        localStorage.removeItem('budget');
                        this.updateTotalExpenses();
                        return;
                    }
                    
                    if (isNaN(totalBudget) || totalBudget <= 0) {
                        this.displayError('Please enter a valid budget amount greater than 0.');
                        return;
                    }
                    this.budget = totalBudget;
                    this.updateTotalExpenses();
                    localStorage.setItem('budget', this.budget.toString());
                    this.resetBudgetAlerts();
                    this.displaySuccess('Budget set successfully!');
                } catch (error) {
                    console.error('Error setting budget:', error);
                    this.displayError('Failed to set budget. Please try again.');
                }
            },
            
            clearBudget() {
                this.showConfirmationModal(
                    'Clear Budget',
                    'Are you sure you want to clear your budget? You can still track expenses without a budget.',
                    () => {
                        this.budget = 0;
                        localStorage.removeItem('budget');
                        this.resetBudgetAlerts();
                        this.updateTotalExpenses();
                        this.displaySuccess('Budget cleared. Continue tracking expenses!');
                    }
                );
            },
            
            resetBudgetAlerts() {
                this.budgetAlerts = { 50: false, 75: false, 90: false, 100: false };
            },
            
            checkBudgetAlerts() {
                if (this.budget <= 0) return;
                const percentage = (this.totalExpenses / this.budget) * 100;
                
                if (percentage >= 100 && !this.budgetAlerts[100]) {
                    this.budgetAlerts[100] = true;
                    this.displayNotification('Budget Exceeded!', 'warning');
                } else if (percentage >= 90 && !this.budgetAlerts[90]) {
                    this.budgetAlerts[90] = true;
                    this.displayNotification('You have used 90% of your budget!', 'warning');
                } else if (percentage >= 75 && !this.budgetAlerts[75]) {
                    this.budgetAlerts[75] = true;
                    this.displayNotification('You have used 75% of your budget.', 'info');
                } else if (percentage >= 50 && !this.budgetAlerts[50]) {
                    this.budgetAlerts[50] = true;
                    this.displayNotification('You have used 50% of your budget.', 'info');
                }
            },
            
            // ===== CATEGORY BUDGETS =====
            setCategoryBudget(categoryId, amount) {
                if (amount && parseFloat(amount) > 0) {
                    this.$set(this.categoryBudgets, categoryId, parseFloat(amount));
                } else {
                    this.$delete(this.categoryBudgets, categoryId);
                }
                localStorage.setItem('categoryBudgets', JSON.stringify(this.categoryBudgets));
            },
            
            getCategoryBudget(categoryId) {
                return this.categoryBudgets[categoryId] || 0;
            },
            
            getCategorySpending(categoryId) {
                let total = 0;
                this.expenses.forEach(expense => {
                    if (expense.category === categoryId) {
                        total += this.convertToMonthly(parseFloat(expense.amount), expense.frequency);
                    }
                });
                return total;
            },
            
            getCategoryUtilization(categoryId) {
                const budget = this.getCategoryBudget(categoryId);
                if (budget <= 0) return 0;
                return Math.min((this.getCategorySpending(categoryId) / budget) * 100, 100);
            },
            
            checkCategoryAlerts() {
                this.expenseCategories.forEach(category => {
                    const budget = this.getCategoryBudget(category.id);
                    if (budget > 0) {
                        const spending = this.getCategorySpending(category.id);
                        const percentage = (spending / budget) * 100;
                        
                        if (percentage >= 90 && !this.categoryAlerts[category.id + '_90']) {
                            this.$set(this.categoryAlerts, category.id + '_90', true);
                            this.displayNotification(category.name + ' category is at ' + Math.round(percentage) + '% of budget!', 'warning');
                        }
                    }
                });
            },
            
            // ===== EXPENSES =====
            addExpense() {
                try {
                    const { name, amount, frequency, day, dayOfMonth, category, startDate, notes } = this.newExpense;
                    const parsedAmount = parseFloat(amount);
                    
                    if (!name || name.trim().length === 0) {
                        this.displayError('Please enter an expense name.');
                        return;
                    }
                    
                    if (isNaN(parsedAmount) || parsedAmount <= 0) {
                        this.displayError('Please enter a valid amount greater than 0.');
                        return;
                    }
                    
                    if (this.editingIndex !== null) {
                        const updatedExpense = {
                            id: this.expenses[this.editingIndex].id || generateId(),
                            name: name.trim(),
                            amount: parsedAmount,
                            frequency: frequency,
                            day: frequency !== 'monthly' ? day : '',
                            dayOfMonth: frequency === 'monthly' ? parseInt(dayOfMonth) : null,
                            category: category,
                            startDate: startDate || new Date().toISOString().split('T')[0],
                            notes: notes ? notes.trim() : '',
                            updatedAt: new Date().toISOString()
                        };
                        this.expenses.splice(this.editingIndex, 1, updatedExpense);
                        this.editingIndex = null;
                        this.isEditing = false;
                        this.displaySuccess('Expense updated successfully!');
                    } else {
                        const newExpenseItem = {
                            id: generateId(),
                            name: name.trim(),
                            amount: parsedAmount,
                            frequency: frequency,
                            day: frequency !== 'monthly' ? day : '',
                            dayOfMonth: frequency === 'monthly' ? parseInt(dayOfMonth) : null,
                            category: category,
                            startDate: startDate || new Date().toISOString().split('T')[0],
                            notes: notes ? notes.trim() : '',
                            createdAt: new Date().toISOString()
                        };
                        this.expenses.push(newExpenseItem);
                        this.displaySuccess('Expense added successfully!');
                    }
                    
                    this.resetNewExpense();
                    this.updateTotalExpenses();
                    this.updateDeductions();
                    this.updateUpcomingDeductions();
                    this.saveExpenses();
                    this.checkBudgetAlerts();
                    this.checkCategoryAlerts();
                    this.recordMonthlySpending();
                    
                } catch (error) {
                    console.error('Error adding expense:', error);
                    this.displayError('Failed to add expense. Please try again.');
                }
            },
            
            resetNewExpense() {
                this.newExpense = {
                    name: '',
                    amount: '',
                    frequency: 'weekly',
                    day: 'monday',
                    dayOfMonth: 1,
                    category: 'other',
                    startDate: new Date().toISOString().split('T')[0],
                    notes: ''
                };
                this.isEditing = false;
                this.editingIndex = null;
            },
            
            editExpense(index) {
                try {
                    const expense = this.filteredExpenses[index];
                    const originalIndex = this.expenses.findIndex(e => e.id === expense.id);
                    const editIndex = originalIndex === -1 ? index : originalIndex;
                    
                    this.newExpense = {
                        name: this.expenses[editIndex].name,
                        amount: this.expenses[editIndex].amount.toString(),
                        frequency: this.expenses[editIndex].frequency,
                        day: this.expenses[editIndex].day || 'monday',
                        dayOfMonth: this.expenses[editIndex].dayOfMonth || 1,
                        category: this.expenses[editIndex].category,
                        startDate: this.expenses[editIndex].startDate,
                        notes: this.expenses[editIndex].notes || ''
                    };
                    this.editingIndex = editIndex;
                    this.isEditing = true;
                    
                    const formCard = document.querySelector('.expense-form-card');
                    if (formCard) formCard.scrollIntoView({ behavior: 'smooth' });
                } catch (error) {
                    console.error('Error editing expense:', error);
                    this.displayError('Failed to edit expense.');
                }
            },
            
            deleteExpense(index) {
                try {
                    const expense = this.filteredExpenses[index];
                    const originalIndex = this.expenses.findIndex(e => e.id === expense.id);
                    const deleteIndex = originalIndex === -1 ? index : originalIndex;
                    
                    this.lastDeleted = {
                        expense: { ...this.expenses[deleteIndex] },
                        index: deleteIndex
                    };
                    
                    this.expenses.splice(deleteIndex, 1);
                    this.updateTotalExpenses();
                    this.updateDeductions();
                    this.updateUpcomingDeductions();
                    this.saveExpenses();
                    this.recordMonthlySpending();
                    
                    this.displayUndoNotification('Deleted "' + expense.name + '"');
                    
                    if (this.undoTimeout) clearTimeout(this.undoTimeout);
                    this.undoTimeout = setTimeout(() => { this.lastDeleted = null; }, 5000);
                    
                } catch (error) {
                    console.error('Error deleting expense:', error);
                    this.displayError('Failed to delete expense.');
                }
            },
            
            undoDelete() {
                if (this.lastDeleted) {
                    this.expenses.splice(this.lastDeleted.index, 0, this.lastDeleted.expense);
                    this.updateTotalExpenses();
                    this.updateDeductions();
                    this.updateUpcomingDeductions();
                    this.saveExpenses();
                    this.recordMonthlySpending();
                    this.displaySuccess('Expense restored!');
                    this.lastDeleted = null;
                    if (this.undoTimeout) {
                        clearTimeout(this.undoTimeout);
                        this.undoTimeout = null;
                    }
                }
            },
            
            // ===== CONFIRMATION MODAL =====
            showConfirmationModal(title, message, onConfirm) {
                this.confirmModal.title = title;
                this.confirmModal.message = message;
                this.confirmModal.onConfirm = onConfirm;
                this.confirmModal.show = true;
            },
            
            confirmAction() {
                if (this.confirmModal.onConfirm) this.confirmModal.onConfirm();
                this.closeConfirmModal();
            },
            
            closeConfirmModal() {
                this.confirmModal.show = false;
                this.confirmModal.title = '';
                this.confirmModal.message = '';
                this.confirmModal.onConfirm = null;
            },
            
            clearAllExpenses() {
                this.showConfirmationModal(
                    'Clear All Expenses',
                    'Are you sure you want to delete all expenses? This action cannot be undone.',
                    () => {
                        this.expenses = [];
                        this.updateTotalExpenses();
                        this.updateDeductions();
                        this.updateUpcomingDeductions();
                        localStorage.removeItem('expenses');
                        this.resetBudgetAlerts();
                        this.recordMonthlySpending();
                        this.displaySuccess('All expenses cleared.');
                    }
                );
            },
            
            // ===== CALCULATIONS (OPTIMIZED) =====
            getFrequencyMultipliers() {
                return {
                    weekly: 4.34524,      // 52 weeks / 12 months
                    fortnightly: 2.17262, // 26 fortnights / 12 months
                    monthly: 1
                };
            },
            
            convertToMonthly(amount, frequency) {
                const multipliers = this.getFrequencyMultipliers();
                return amount * (multipliers[frequency] || 1);
            },
            
            updateTotalExpenses() {
                let monthlyEquivalent = 0;
                
                this.expenses.forEach(expense => {
                    const amount = parseFloat(expense.amount) || 0;
                    monthlyEquivalent += this.convertToMonthly(amount, expense.frequency);
                });

                this.totalExpenses = parseFloat(monthlyEquivalent.toFixed(2));
                this.remainingBalance = parseFloat((parseFloat(this.budget) - this.totalExpenses).toFixed(2));
            },
            
            updateDeductions() {
                const rawWeekly = this.calculateDeductions('weekly');
                const rawFortnightly = this.calculateDeductions('fortnightly');
                const rawMonthly = this.calculateDeductions('monthly');
                
                this.deductions.weekly = rawWeekly;
                this.deductions.fortnightly = rawFortnightly;
                this.deductions.monthly = rawMonthly;
                
                // Daily average: 365.25 days/year / 12 months = 30.4375 days/month
                this.deductions.daily = parseFloat((this.totalExpenses / 30.4375).toFixed(2));
                
                this.updateUpcomingDeductions();
            },
            
            calculateDeductions(frequency) {
                return this.expenses.reduce((total, expense) => {
                    return expense.frequency === frequency ? total + parseFloat(expense.amount) : total;
                }, 0);
            },
            
            getMonthlyEquivalentBreakdown() {
                const rawWeekly = this.calculateDeductions('weekly');
                const rawFortnightly = this.calculateDeductions('fortnightly');
                const rawMonthly = this.calculateDeductions('monthly');
                
                return {
                    weekly: parseFloat((rawWeekly * this.getFrequencyMultipliers().weekly).toFixed(2)),
                    fortnightly: parseFloat((rawFortnightly * this.getFrequencyMultipliers().fortnightly).toFixed(2)),
                    monthly: rawMonthly,
                    total: this.totalExpenses
                };
            },
            
            // ===== NEXT DUE DATE CALCULATIONS (IMPROVED) =====
            getNextDueDate(expense, now) {
                const nextDueDate = new Date(now);
                
                if (expense.frequency === 'monthly' && expense.dayOfMonth) {
                    const targetDay = parseInt(expense.dayOfMonth);
                    const currentDay = now.getDate();
                    const currentMonth = now.getMonth();
                    
                    if (currentDay >= targetDay) {
                        nextDueDate.setMonth(currentMonth + 1);
                    }
                    
                    const lastDayOfTargetMonth = new Date(nextDueDate.getFullYear(), nextDueDate.getMonth() + 1, 0).getDate();
                    const actualDay = Math.min(targetDay, lastDayOfTargetMonth);
                    nextDueDate.setDate(actualDay);
                    
                } else if (expense.frequency === 'weekly' || expense.frequency === 'fortnightly') {
                    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                    const targetDay = daysOfWeek.indexOf(expense.day);
                    const currentDay = now.getDay();
                    let daysUntilNext = (targetDay - currentDay + 7) % 7;
                    
                    if (daysUntilNext === 0) {
                        daysUntilNext = 0;
                    }
                    
                    if (expense.frequency === 'fortnightly') {
                        const startDate = expense.startDate ? new Date(expense.startDate) : new Date();
                        const weeksSinceStart = Math.floor((now - startDate) / (7 * 24 * 60 * 60 * 1000));
                        const isAlternateWeek = weeksSinceStart % 2 === 0;
                        
                        if (daysUntilNext === 0) {
                            const dayOfWeek = now.getDay();
                            const refDayOfWeek = startDate.getDay();
                            const daysDiff = (dayOfWeek - refDayOfWeek + 7) % 7;
                            if (!isAlternateWeek && daysDiff <= 6) {
                                daysUntilNext = 0;
                            } else {
                                daysUntilNext = 7;
                            }
                        } else {
                            if (!isAlternateWeek) {
                                daysUntilNext += 7;
                            }
                        }
                    }
                    
                    if (daysUntilNext === 0 && now.getHours() >= 12) {
                        daysUntilNext = expense.frequency === 'weekly' ? 7 : 14;
                    }
                    
                    nextDueDate.setDate(now.getDate() + daysUntilNext);
                }
                
                nextDueDate.setHours(0, 0, 0, 0);
                return nextDueDate;
            },
            
            updateUpcomingDeductions() {
                const now = new Date();
                let allUpcoming = [];

                this.expenses.forEach(expense => {
                    const nextDueDate = this.getNextDueDate(expense, now);
                    allUpcoming.push({
                        ...expense,
                        nextDueDate: nextDueDate,
                        daysUntil: Math.ceil((nextDueDate - now) / (1000 * 60 * 60 * 24))
                    });
                });

                allUpcoming.sort((a, b) => a.nextDueDate - b.nextDueDate);
                
                this.upcomingDeductions = allUpcoming.slice(0, 10);
                
                if (allUpcoming.length > 0) {
                    const next = allUpcoming[0];
                    this.nextDeduction = {
                        name: next.name,
                        amount: next.amount,
                        frequency: next.frequency,
                        day: next.frequency === 'monthly' ? 'Day ' + next.dayOfMonth : next.day,
                        nextDueDate: next.nextDueDate
                    };
                } else {
                    this.nextDeduction = { name: '', amount: 0, frequency: '', day: '', nextDueDate: '' };
                }
            },
            
            // ===== SPENDING HISTORY =====
            recordMonthlySpending() {
                const now = new Date();
                const monthKey = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
                
                const categoryBreakdown = {};
                this.expenseCategories.forEach(cat => {
                    categoryBreakdown[cat.id] = this.getCategorySpending(cat.id);
                });
                
                const existingIndex = this.spendingHistory.findIndex(h => h.month === monthKey);
                const record = {
                    month: monthKey,
                    total: this.totalExpenses,
                    categories: categoryBreakdown,
                    budget: this.budget,
                    updatedAt: new Date().toISOString()
                };
                
                if (existingIndex >= 0) {
                    this.$set(this.spendingHistory, existingIndex, record);
                } else {
                    this.spendingHistory.push(record);
                }
                
                if (this.spendingHistory.length > 24) {
                    this.spendingHistory = this.spendingHistory.slice(-24);
                }
                
                localStorage.setItem('spendingHistory', JSON.stringify(this.spendingHistory));
            },
            
            getSpendingTrend() {
                if (this.spendingHistory.length < 2) return 'stable';
                
                const recent = this.spendingHistory.slice(-3);
                const avgRecent = recent.reduce((sum, h) => sum + h.total, 0) / recent.length;
                const older = this.spendingHistory.slice(-6, -3);
                
                if (older.length === 0) return 'stable';
                
                const avgOlder = older.reduce((sum, h) => sum + h.total, 0) / older.length;
                
                if (avgRecent > avgOlder * 1.1) return 'increasing';
                if (avgRecent < avgOlder * 0.9) return 'decreasing';
                return 'stable';
            },
            
            // ===== STATISTICS & INSIGHTS =====
            getExpenseStatistics() {
                if (this.expenses.length === 0) {
                    return {
                        totalExpenses: 0,
                        expenseCount: 0,
                        averageExpense: 0,
                        highestExpense: null,
                        lowestExpense: null,
                        projectedMonthly: 0,
                        dailyAverage: 0,
                        weeklyAverage: 0
                    };
                }
                
                const monthlyAmounts = this.expenses.map(e => ({
                    expense: e,
                    monthlyAmount: this.convertToMonthly(parseFloat(e.amount), e.frequency)
                }));
                
                const sortedByAmount = [...monthlyAmounts].sort((a, b) => b.monthlyAmount - a.monthlyAmount);
                
                return {
                    totalExpenses: this.totalExpenses,
                    expenseCount: this.expenses.length,
                    averageExpense: parseFloat((this.totalExpenses / this.expenses.length).toFixed(2)),
                    highestExpense: sortedByAmount[0] ? {
                        name: sortedByAmount[0].expense.name,
                        amount: sortedByAmount[0].monthlyAmount,
                        category: sortedByAmount[0].expense.category
                    } : null,
                    lowestExpense: sortedByAmount[sortedByAmount.length - 1] ? {
                        name: sortedByAmount[sortedByAmount.length - 1].expense.name,
                        amount: sortedByAmount[sortedByAmount.length - 1].monthlyAmount
                    } : null,
                    projectedMonthly: this.totalExpenses,
                    dailyAverage: parseFloat((this.totalExpenses / 30.4375).toFixed(2)),
                    weeklyAverage: parseFloat((this.totalExpenses / 4.34524).toFixed(2))
                };
            },
            
            getSpendingInsights() {
                const insights = [];
                const stats = this.getExpenseStatistics();
                const utilization = this.budgetUtilization;
                
                if (this.budget > 0) {
                    if (utilization >= 100) {
                        insights.push({
                            type: 'danger',
                            icon: 'fa-exclamation-circle',
                            title: 'Budget Exceeded',
                            message: 'You have exceeded your budget by ' + this.formatCurrency(Math.abs(this.remainingBalance)) + '. Consider reviewing your expenses.'
                        });
                    } else if (utilization >= 90) {
                        insights.push({
                            type: 'warning',
                            icon: 'fa-exclamation-triangle',
                            title: 'Budget Alert',
                            message: 'You have used ' + Math.round(utilization) + '% of your budget. Only ' + this.formatCurrency(this.remainingBalance) + ' remaining.'
                        });
                    } else if (utilization >= 75) {
                        insights.push({
                            type: 'warning',
                            icon: 'fa-info-circle',
                            title: 'Budget Notice',
                            message: 'You have used ' + Math.round(utilization) + '% of your budget. ' + this.formatCurrency(this.remainingBalance) + ' remaining.'
                        });
                    } else {
                        insights.push({
                            type: 'success',
                            icon: 'fa-check-circle',
                            title: 'On Track',
                            message: 'You have used ' + Math.round(utilization) + '% of your budget. ' + this.formatCurrency(this.remainingBalance) + ' remaining.'
                        });
                    }
                }
                
                if (stats.highestExpense) {
                    const category = this.getCategoryById(stats.highestExpense.category);
                    insights.push({
                        type: 'info',
                        icon: 'fa-arrow-up',
                        title: 'Highest Expense',
                        message: stats.highestExpense.name + ' is your largest expense at ' + this.formatCurrency(stats.highestExpense.amount) + '/month (' + category.name + ').'
                    });
                }
                
                const trend = this.getSpendingTrend();
                if (trend === 'increasing') {
                    insights.push({
                        type: 'warning',
                        icon: 'fa-chart-line',
                        title: 'Spending Trend',
                        message: 'Your spending has been increasing over recent months. Consider reviewing your budget.'
                    });
                } else if (trend === 'decreasing') {
                    insights.push({
                        type: 'success',
                        icon: 'fa-chart-line',
                        title: 'Spending Trend',
                        message: 'Great job! Your spending has been decreasing over recent months.'
                    });
                }
                
                const topCategory = this.getTopSpendingCategory();
                if (topCategory) {
                    insights.push({
                        type: 'info',
                        icon: 'fa-tag',
                        title: 'Top Category',
                        message: topCategory.name + ' is your highest spending category at ' + this.formatCurrency(topCategory.amount) + '/month.'
                    });
                }
                
                return insights;
            },
            
            getTopSpendingCategory() {
                let topCategory = null;
                let topAmount = 0;
                
                this.expenseCategories.forEach(category => {
                    const spending = this.getCategorySpending(category.id);
                    if (spending > topAmount) {
                        topAmount = spending;
                        topCategory = {
                            ...category,
                            amount: spending
                        };
                    }
                });
                
                return topCategory;
            },
            
            getCategoryBreakdown() {
                const breakdown = [];
                this.expenseCategories.forEach(category => {
                    const spending = this.getCategorySpending(category.id);
                    if (spending > 0) {
                        breakdown.push({
                            ...category,
                            amount: spending,
                            percentage: this.totalExpenses > 0 ? ((spending / this.totalExpenses) * 100).toFixed(1) : 0,
                            budget: this.getCategoryBudget(category.id),
                            utilization: this.getCategoryUtilization(category.id)
                        });
                    }
                });
                return breakdown.sort((a, b) => b.amount - a.amount);
            },
            
            // ===== NOTIFICATIONS =====
            displayNotification(message, type) {
                type = type || 'error';
                const notification = document.createElement('div');
                notification.className = 'notification ' + type + '-notification';
                notification.innerHTML = '<div class="flex items-center gap-2"><i class="fas ' + (type === 'error' ? 'fa-exclamation-triangle' : type === 'success' ? 'fa-check-circle' : 'fa-info-circle') + '"></i><span>' + message + '</span></div>';
                document.body.appendChild(notification);

                setTimeout(() => { notification.style.display = 'block'; }, 10);

                setTimeout(() => {
                    notification.style.opacity = '0';
                    notification.style.transform = 'translateX(100%)';
                    setTimeout(() => {
                        if (notification.parentNode) notification.parentNode.removeChild(notification);
                    }, 300);
                }, 4000);

                notification.addEventListener('click', () => {
                    notification.style.opacity = '0';
                    notification.style.transform = 'translateX(100%)';
                    setTimeout(() => {
                        if (notification.parentNode) notification.parentNode.removeChild(notification);
                    }, 300);
                });
            },
            
            displayUndoNotification(message) {
                const notification = document.createElement('div');
                notification.className = 'notification warning-notification undo-notification';
                notification.innerHTML = '<div class="flex items-center gap-2"><i class="fas fa-trash-alt"></i><span>' + message + '</span><button class="undo-btn" onclick="window.vueApp.undoDelete()">Undo</button></div>';
                document.body.appendChild(notification);

                setTimeout(() => { notification.style.display = 'block'; }, 10);

                setTimeout(() => {
                    notification.style.opacity = '0';
                    notification.style.transform = 'translateX(100%)';
                    setTimeout(() => {
                        if (notification.parentNode) notification.parentNode.removeChild(notification);
                    }, 300);
                }, 5000);
            },
            
            displayError(message) { this.displayNotification(message, 'error'); },
            displaySuccess(message) { this.displayNotification(message, 'success'); },
            
            calculateTotalExpenses() { this.updateTotalExpenses(); },
            
            saveExpenses() {
                localStorage.setItem('expenses', JSON.stringify(this.expenses));
            },
            
            // ===== CHARTS =====
            createCharts() {
                this.$nextTick(() => {
                    this.createCategoryChart();
                    this.createFrequencyChart();
                    this.createTrendChart();
                });
            },
            
            destroyCharts() {
                if (this.categoryChart) {
                    this.categoryChart.destroy();
                    this.categoryChart = null;
                }
                if (this.frequencyChart) {
                    this.frequencyChart.destroy();
                    this.frequencyChart = null;
                }
                if (this.trendChart) {
                    this.trendChart.destroy();
                    this.trendChart = null;
                }
            },
            
            createCategoryChart() {
                const ctx = document.getElementById('categoryChart');
                if (!ctx) return;

                if (this.categoryChart) {
                    this.categoryChart.destroy();
                }

                const categoryData = {};
                this.expenses.forEach(expense => {
                    const category = this.getCategoryById(expense.category);
                    const monthlyAmount = this.convertToMonthly(parseFloat(expense.amount), expense.frequency);
                    categoryData[category.name] = (categoryData[category.name] || 0) + monthlyAmount;
                });

                const labels = Object.keys(categoryData);
                const data = Object.values(categoryData);
                const colors = labels.map(label => {
                    const category = this.expenseCategories.find(cat => cat.name === label);
                    return category ? category.color : '#636e72';
                });

                this.categoryChart = new Chart(ctx, {
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
                                labels: { padding: 20, usePointStyle: true }
                            },
                            tooltip: {
                                callbacks: {
                                    label: (context) => {
                                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                        const percentage = ((context.parsed / total) * 100).toFixed(1);
                                        return context.label + ': ' + this.formatCurrency(context.parsed) + ' (' + percentage + '%)';
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

                if (this.frequencyChart) {
                    this.frequencyChart.destroy();
                }

                const rawData = { 'Weekly': 0, 'Fortnightly': 0, 'Monthly': 0 };
                const monthlyEquivalentData = { 'Weekly': 0, 'Fortnightly': 0, 'Monthly': 0 };
                const multipliers = this.getFrequencyMultipliers();

                this.expenses.forEach(expense => {
                    const amount = parseFloat(expense.amount);
                    const frequency = expense.frequency.charAt(0).toUpperCase() + expense.frequency.slice(1);
                    rawData[frequency] += amount;
                    monthlyEquivalentData[frequency] += amount * multipliers[expense.frequency];
                });

                const labels = Object.keys(monthlyEquivalentData);
                const data = Object.values(monthlyEquivalentData);

                this.frequencyChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Monthly Equivalent',
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
                                    callback: (value) => this.formatCurrency(value)
                                }
                            }
                        },
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: (context) => {
                                        const label = context.label;
                                        const monthlyEquiv = context.parsed.y;
                                        const rawAmount = rawData[label];
                                        if (label === 'Monthly') {
                                            return 'Monthly: ' + this.formatCurrency(rawAmount);
                                        } else if (label === 'Weekly') {
                                            return [
                                                'Monthly Equivalent: ' + this.formatCurrency(monthlyEquiv),
                                                'Raw Weekly: ' + this.formatCurrency(rawAmount) + '/week'
                                            ];
                                        } else if (label === 'Fortnightly') {
                                            return [
                                                'Monthly Equivalent: ' + this.formatCurrency(monthlyEquiv),
                                                'Raw Fortnightly: ' + this.formatCurrency(rawAmount) + '/fortnight'
                                            ];
                                        }
                                        return this.formatCurrency(monthlyEquiv);
                                    }
                                }
                            }
                        }
                    }
                });
            },
            
            createTrendChart() {
                const ctx = document.getElementById('trendChart');
                if (!ctx) return;

                if (this.trendChart) {
                    this.trendChart.destroy();
                }

                if (this.spendingHistory.length < 2) {
                    return;
                }

                const labels = this.spendingHistory.map(h => {
                    const parts = h.month.split('-');
                    const date = new Date(parts[0], parseInt(parts[1]) - 1);
                    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                });
                
                const spendingData = this.spendingHistory.map(h => h.total);
                const budgetData = this.spendingHistory.map(h => h.budget);

                this.trendChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: 'Spending',
                                data: spendingData,
                                borderColor: 'rgba(255, 99, 132, 1)',
                                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                                fill: true,
                                tension: 0.4
                            },
                            {
                                label: 'Budget',
                                data: budgetData,
                                borderColor: 'rgba(54, 162, 235, 1)',
                                backgroundColor: 'transparent',
                                borderDash: [5, 5],
                                tension: 0
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: (value) => this.formatCurrency(value)
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                position: 'bottom'
                            }
                        }
                    }
                });
            },
            
            // ===== FILTERS =====
            clearFilters() {
                this.categoryFilter = '';
                this.frequencyFilter = '';
                this.sortBy = 'date-desc';
            },
            
            // ===== IMPORT/EXPORT =====
            backupData() {
                try {
                    const backupData = {
                        budget: this.budget,
                        budgetEnabled: this.budgetEnabled,
                        expenses: this.expenses,
                        currency: this.currency,
                        categoryBudgets: this.categoryBudgets,
                        spendingHistory: this.spendingHistory,
                        theme: localStorage.getItem('theme') || 'light',
                        timestamp: new Date().toISOString(),
                        version: '3.0'
                    };

                    const dataStr = JSON.stringify(backupData, null, 2);
                    const blob = new Blob([dataStr], { type: 'application/json' });
                    const link = document.createElement('a');

                    if (link.download !== undefined) {
                        const url = URL.createObjectURL(blob);
                        link.setAttribute('href', url);
                        link.setAttribute('download', 'budget_backup_' + new Date().toISOString().split('T')[0] + '.json');
                        link.style.visibility = 'hidden';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        this.displaySuccess('Data backup created successfully!');
                    } else {
                        this.displayError('Backup not supported in this browser.');
                    }
                } catch (error) {
                    console.error('Backup error:', error);
                    this.displayError('Error creating backup. Please try again.');
                }
            },
            
            restoreData(event) {
                const file = event.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        
                        if (data.budget !== undefined) {
                            this.budget = parseFloat(data.budget);
                            localStorage.setItem('budget', this.budget.toString());
                        }
                        
                        if (data.budgetEnabled !== undefined) {
                            this.budgetEnabled = data.budgetEnabled === true || data.budgetEnabled === 'true';
                            localStorage.setItem('budgetEnabled', this.budgetEnabled.toString());
                        }
                        
                        if (data.expenses && Array.isArray(data.expenses)) {
                            this.expenses = data.expenses;
                            this.saveExpenses();
                        }
                        
                        if (data.categoryBudgets) {
                            this.categoryBudgets = data.categoryBudgets;
                            localStorage.setItem('categoryBudgets', JSON.stringify(this.categoryBudgets));
                        }
                        
                        if (data.spendingHistory) {
                            this.spendingHistory = data.spendingHistory;
                            localStorage.setItem('spendingHistory', JSON.stringify(this.spendingHistory));
                        }
                        
                        if (data.currency) {
                            this.currency = data.currency;
                            localStorage.setItem('currency', this.currency);
                        }
                        
                        if (data.theme) {
                            localStorage.setItem('theme', data.theme);
                            document.documentElement.setAttribute('data-theme', data.theme);
                        }
                        
                        this.updateTotalExpenses();
                        this.updateDeductions();
                        this.updateUpcomingDeductions();
                        this.displaySuccess('Data restored successfully!');
                    } catch (error) {
                        console.error('Restore error:', error);
                        this.displayError('Error restoring data. Invalid backup file.');
                    }
                };
                reader.readAsText(file);
                event.target.value = '';
            },
            
            // ===== UTILITIES =====
            getCategoryById(categoryId) {
                return this.expenseCategories.find(cat => cat.id === categoryId) || this.expenseCategories.find(cat => cat.id === 'other');
            },
            
            formatDate(dateString) {
                if (!dateString) return '';
                const date = new Date(dateString);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            },
            
            formatMonth(monthKey) {
                if (!monthKey) return '';
                const parts = monthKey.split('-');
                const date = new Date(parts[0], parseInt(parts[1]) - 1);
                return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            },
            
            requestNotificationPermission() {
                if ('Notification' in window && navigator.serviceWorker) {
                    Notification.requestPermission().then(permission => {
                        console.log('Notification permission:', permission);
                    });
                }
            },
            
            loadFromLocalStorage() {
                const storedBudget = localStorage.getItem('budget');
                if (storedBudget) {
                    this.budget = parseFloat(storedBudget);
                }
                
                const storedExpenses = localStorage.getItem('expenses');
                if (storedExpenses) {
                    try {
                        this.expenses = JSON.parse(storedExpenses);
                        this.expenses = this.expenses.map(exp => ({
                            ...exp,
                            id: exp.id || generateId(),
                            notes: exp.notes || '',
                            dayOfMonth: exp.dayOfMonth || null
                        }));
                    } catch (e) {
                        console.error('Error parsing stored expenses:', e);
                        this.expenses = [];
                    }
                }
                
                const storedCategoryBudgets = localStorage.getItem('categoryBudgets');
                if (storedCategoryBudgets) {
                    try {
                        this.categoryBudgets = JSON.parse(storedCategoryBudgets);
                    } catch (e) {
                        this.categoryBudgets = {};
                    }
                }
                
                const storedSpendingHistory = localStorage.getItem('spendingHistory');
                if (storedSpendingHistory) {
                    try {
                        this.spendingHistory = JSON.parse(storedSpendingHistory);
                    } catch (e) {
                        this.spendingHistory = [];
                    }
                }
                
                this.updateTotalExpenses();
                this.updateDeductions();
                this.updateUpcomingDeductions();
            },
            
            switchPage(page) {
                this.currentPage = page;
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
            budgetUtilization() {
                if (this.budget <= 0) return 0;
                return Math.min((this.totalExpenses / this.budget) * 100, 100);
            },
            monthlyEquivalentBreakdown() {
                return this.getMonthlyEquivalentBreakdown();
            },
            spendingTrend() {
                return this.getSpendingTrend();
            },
            filteredExpenses() {
                let filtered = [...this.expenses];

                if (this.categoryFilter) {
                    filtered = filtered.filter(expense => expense.category === this.categoryFilter);
                }

                if (this.frequencyFilter) {
                    filtered = filtered.filter(expense => expense.frequency === this.frequencyFilter);
                }

                filtered.sort((a, b) => {
                    switch (this.sortBy) {
                        case 'date-desc': return new Date(b.startDate || '1970-01-01') - new Date(a.startDate || '1970-01-01');
                        case 'date-asc': return new Date(a.startDate || '1970-01-01') - new Date(b.startDate || '1970-01-01');
                        case 'amount-desc': return parseFloat(b.amount) - parseFloat(a.amount);
                        case 'amount-asc': return parseFloat(a.amount) - parseFloat(b.amount);
                        case 'name-asc': return a.name.localeCompare(b.name);
                        case 'name-desc': return b.name.localeCompare(a.name);
                        default: return 0;
                    }
                });

                return filtered;
            },
            expenseStatistics() {
                return this.getExpenseStatistics();
            },
            spendingInsights() {
                return this.getSpendingInsights();
            },
            categoryBreakdown() {
                return this.getCategoryBreakdown();
            }
        },
        watch: {
            expenses: {
                handler() {
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
            window.vueApp = this;
            
            this.requestNotificationPermission();
            this.loadFromLocalStorage();
        }
    });
});