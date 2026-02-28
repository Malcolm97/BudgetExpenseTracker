// Budget Expense Tracker - Production Ready Version
// Optimized and enhanced with modern features

// ===== INDEXEDDB STORAGE SYSTEM =====
const DB_NAME = 'BudgetExpenseTrackerDB';
const DB_VERSION = 1;
const STORES = {
    EXPENSES: 'expenses',
    SETTINGS: 'settings',
    BACKUPS: 'backups',
    HISTORY: 'spendingHistory'
};

class IndexedDBStorage {
    constructor() {
        this.db = null;
        this.isReady = false;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.isReady = true;
                console.log('IndexedDB initialized successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Expenses store
                if (!db.objectStoreNames.contains(STORES.EXPENSES)) {
                    const expenseStore = db.createObjectStore(STORES.EXPENSES, { keyPath: 'id' });
                    expenseStore.createIndex('category', 'category', { unique: false });
                    expenseStore.createIndex('frequency', 'frequency', { unique: false });
                    expenseStore.createIndex('startDate', 'startDate', { unique: false });
                }

                // Settings store
                if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
                    db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
                }

                // Backups store
                if (!db.objectStoreNames.contains(STORES.BACKUPS)) {
                    const backupStore = db.createObjectStore(STORES.BACKUPS, { keyPath: 'id', autoIncrement: true });
                    backupStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                // Spending history store
                if (!db.objectStoreNames.contains(STORES.HISTORY)) {
                    const historyStore = db.createObjectStore(STORES.HISTORY, { keyPath: 'month' });
                    historyStore.createIndex('month', 'month', { unique: true });
                }
            };
        });
    }

    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                resolve([]);
                return;
            }
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async get(storeName, key) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                resolve(null);
                return;
            }
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async put(storeName, data) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                resolve(false);
                return;
            }
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async putAll(storeName, items) {
        return new Promise((resolve, reject) => {
            if (!this.db || !items.length) {
                resolve(true);
                return;
            }
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);

            items.forEach(item => store.put(item));

            transaction.oncomplete = () => resolve(true);
            transaction.onerror = () => reject(transaction.error);
        });
    }

    async delete(storeName, key) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                resolve(false);
                return;
            }
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async clear(storeName) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                resolve(false);
                return;
            }
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    // Settings helpers
    async getSetting(key) {
        const result = await this.get(STORES.SETTINGS, key);
        return result ? result.value : null;
    }

    async setSetting(key, value) {
        return this.put(STORES.SETTINGS, { key, value, updatedAt: new Date().toISOString() });
    }

    // Backup management
    async createBackup(description = 'Auto backup') {
        const expenses = await this.getAll(STORES.EXPENSES);
        const settings = await this.getAll(STORES.SETTINGS);
        const history = await this.getAll(STORES.HISTORY);

        const backup = {
            timestamp: new Date().toISOString(),
            description,
            data: {
                expenses,
                settings,
                history
            }
        };

        return this.put(STORES.BACKUPS, backup);
    }

    async getBackups() {
        return this.getAll(STORES.BACKUPS);
    }

    async restoreFromBackup(backupId) {
        const backup = await this.get(STORES.BACKUPS, backupId);
        if (!backup || !backup.data) return false;

        await this.clear(STORES.EXPENSES);
        await this.clear(STORES.SETTINGS);
        await this.clear(STORES.HISTORY);

        if (backup.data.expenses) {
            await this.putAll(STORES.EXPENSES, backup.data.expenses);
        }
        if (backup.data.settings) {
            await this.putAll(STORES.SETTINGS, backup.data.settings);
        }
        if (backup.data.history) {
            await this.putAll(STORES.HISTORY, backup.data.history);
        }

        return true;
    }

    async deleteBackup(backupId) {
        return this.delete(STORES.BACKUPS, backupId);
    }

    // Auto backup - keep last 5 backups
    async autoBackup() {
        await this.createBackup('Auto backup');

        // Clean old backups, keep only last 5
        const backups = await this.getBackups();
        if (backups.length > 5) {
            backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            const toDelete = backups.slice(5);
            for (const backup of toDelete) {
                await this.deleteBackup(backup.id);
            }
        }
    }
}

const dbStorage = new IndexedDBStorage();

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

// ===== COLOR THEME SYSTEM =====
function getDarkerShade(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

function applyPrimaryColor(color) {
    if (!color || !/^#[0-9A-Fa-f]{6}$/.test(color)) return;
    
    const primaryDark = getDarkerShade(color, 15);
    document.documentElement.style.setProperty('--primary-color', color);
    document.documentElement.style.setProperty('--primary-dark', primaryDark);
    
    // Update theme-color meta tag
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
        themeColorMeta.setAttribute('content', color);
    }
    
    // Update active nav item color
    document.documentElement.style.setProperty('--nav-active-color', color);
}

function initColorPicker() {
    const colorPickerBtn = document.getElementById('color-picker-btn');
    const colorPickerPanel = document.getElementById('color-picker-panel');
    const colorPickerClose = document.getElementById('color-picker-close');
    const customColorInput = document.getElementById('custom-color-input');
    const customColorValue = document.querySelector('.custom-color-value');
    const colorPresets = document.querySelectorAll('.color-preset');
    
    if (!colorPickerBtn || !colorPickerPanel) return;
    
    // Load saved color
    const savedColor = localStorage.getItem('primaryColor');
    if (savedColor) {
        applyPrimaryColor(savedColor);
        if (customColorInput) customColorInput.value = savedColor;
        if (customColorValue) customColorValue.textContent = savedColor.toUpperCase();
        
        // Mark active preset
        colorPresets.forEach(preset => {
            if (preset.dataset.color === savedColor) {
                preset.classList.add('active');
            } else {
                preset.classList.remove('active');
            }
        });
    }
    
    // Toggle panel
    colorPickerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        colorPickerPanel.classList.toggle('show');
    });
    
    // Close panel
    if (colorPickerClose) {
        colorPickerClose.addEventListener('click', () => {
            colorPickerPanel.classList.remove('show');
        });
    }
    
    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!colorPickerPanel.contains(e.target) && !colorPickerBtn.contains(e.target)) {
            colorPickerPanel.classList.remove('show');
        }
    });
    
    // Preset colors
    colorPresets.forEach(preset => {
        preset.addEventListener('click', () => {
            const color = preset.dataset.color;
            applyPrimaryColor(color);
            localStorage.setItem('primaryColor', color);
            
            if (customColorInput) customColorInput.value = color;
            if (customColorValue) customColorValue.textContent = color.toUpperCase();
            
            // Update active state
            colorPresets.forEach(p => p.classList.remove('active'));
            preset.classList.add('active');
        });
    });
    
    // Custom color input
    if (customColorInput) {
        customColorInput.addEventListener('input', (e) => {
            const color = e.target.value;
            applyPrimaryColor(color);
            localStorage.setItem('primaryColor', color);
            
            if (customColorValue) customColorValue.textContent = color.toUpperCase();
            
            // Remove active from presets
            colorPresets.forEach(p => p.classList.remove('active'));
        });
    }
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
    
    // Initialize color picker
    initColorPicker();

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
            currency: localStorage.getItem('currency') || 'AUD',
            
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
                { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
                { code: 'PGK', name: 'Papua New Guinean Kina', symbol: 'K' }
            ],
            
            // Currency converter
            currencyConverter: {
                targetCurrency: 'USD',
                exchangeRates: {},
                lastUpdated: null,
                isLoading: false,
                error: null
            },
            
            // Search
            searchQuery: '',
            
            // Frequency options (extended)
            frequencyOptions: [
                { value: 'daily', label: 'Daily', multiplier: 30.4375 },
                { value: 'weekly', label: 'Weekly', multiplier: 4.34524 },
                { value: 'fortnightly', label: 'Fortnightly', multiplier: 2.17262 },
                { value: 'monthly', label: 'Monthly', multiplier: 1 },
                { value: 'quarterly', label: 'Quarterly', multiplier: 1/3 },
                { value: 'yearly', label: 'Yearly', multiplier: 1/12 }
            ],
            
            // IndexedDB ready state
            dbReady: false,
            
            // Auto backup settings
            autoBackupEnabled: localStorage.getItem('autoBackupEnabled') !== 'false',
            lastBackupTime: null
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
                    'CNY': { symbol: '¥', locale: 'zh-CN' },
                    'PGK': { symbol: 'K', locale: 'en-PG' }
                };
                const curr = currencies[this.currency] || currencies['USD'];
                const num = parseFloat(amount) || 0;
                return curr.symbol + num.toLocaleString(curr.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            },
            
            // ===== CURRENCY CONVERTER =====
            async fetchExchangeRates() {
                this.currencyConverter.isLoading = true;
                this.currencyConverter.error = null;
                
                try {
                    // Using exchangerate-api.com free API (no key required for basic usage)
                    const response = await fetch('https://api.exchangerate-api.com/v4/latest/' + this.currency);
                    
                    if (!response.ok) {
                        throw new Error('Failed to fetch exchange rates');
                    }
                    
                    const data = await response.json();
                    this.currencyConverter.exchangeRates = data.rates;
                    this.currencyConverter.lastUpdated = new Date().toISOString();
                    this.currencyConverter.isLoading = false;
                    
                    // Cache the rates in localStorage
                    localStorage.setItem('exchangeRates', JSON.stringify({
                        rates: data.rates,
                        base: this.currency,
                        timestamp: this.currencyConverter.lastUpdated
                    }));
                    
                    this.displaySuccess('Exchange rates updated!');
                } catch (error) {
                    console.error('Error fetching exchange rates:', error);
                    this.currencyConverter.isLoading = false;
                    this.currencyConverter.error = 'Failed to fetch exchange rates. Using cached rates if available.';
                    
                    // Try to load cached rates
                    const cached = localStorage.getItem('exchangeRates');
                    if (cached) {
                        const cachedData = JSON.parse(cached);
                        if (cachedData.base === this.currency) {
                            this.currencyConverter.exchangeRates = cachedData.rates;
                            this.currencyConverter.lastUpdated = cachedData.timestamp;
                        }
                    }
                }
            },
            
            convertCurrency(amount, fromCurrency, toCurrency) {
                if (!this.currencyConverter.exchangeRates || Object.keys(this.currencyConverter.exchangeRates).length === 0) {
                    return null;
                }
                
                const rates = this.currencyConverter.exchangeRates;
                
                // If fromCurrency is the base currency
                if (fromCurrency === this.currency) {
                    if (rates[toCurrency]) {
                        return amount * rates[toCurrency];
                    }
                } else {
                    // Convert from non-base currency
                    if (rates[fromCurrency] && rates[toCurrency]) {
                        // Convert to base first, then to target
                        const inBase = amount / rates[fromCurrency];
                        return inBase * rates[toCurrency];
                    } else if (rates[toCurrency]) {
                        // Assume amount is already in base currency
                        return amount * rates[toCurrency];
                    }
                }
                
                return null;
            },
            
            getConvertedAmount(amount, targetCurrency) {
                const converted = this.convertCurrency(amount, this.currency, targetCurrency);
                if (converted !== null) {
                    const targetCurr = this.availableCurrencies.find(c => c.code === targetCurrency);
                    const symbol = targetCurr ? targetCurr.symbol : targetCurrency;
                    return symbol + converted.toFixed(2);
                }
                return null;
            },
            
            getConvertedMonthlyExpenses(targetCurrency) {
                const converted = this.convertCurrency(this.totalExpenses, this.currency, targetCurrency);
                return converted;
            },
            
            isExchangeRatesStale() {
                if (!this.currencyConverter.lastUpdated) return true;
                const lastUpdate = new Date(this.currencyConverter.lastUpdated);
                const now = new Date();
                const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60);
                return hoursSinceUpdate > 24; // Rates are stale after 24 hours
            },
            
            initCurrencyConverter() {
                // Load cached rates
                const cached = localStorage.getItem('exchangeRates');
                if (cached) {
                    try {
                        const cachedData = JSON.parse(cached);
                        this.currencyConverter.exchangeRates = cachedData.rates;
                        this.currencyConverter.lastUpdated = cachedData.timestamp;
                    } catch (e) {
                        console.error('Error loading cached exchange rates:', e);
                    }
                }
                
                // Fetch fresh rates if stale or not available
                if (this.isExchangeRatesStale()) {
                    this.fetchExchangeRates();
                }
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
                // v-model already toggled the value, just save and handle side effects
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
                // Use actual days in current month for more accurate calculations
                const now = new Date();
                const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                const weeksInCurrentMonth = daysInCurrentMonth / 7;
                
                return {
                    daily: daysInCurrentMonth,           // Actual days in current month
                    weekly: weeksInCurrentMonth,         // Actual weeks in current month
                    fortnightly: weeksInCurrentMonth / 2, // Fortnights in current month
                    monthly: 1,
                    quarterly: 1/3,                      // 4 quarters / 12 months
                    yearly: 1/12                         // 1 year / 12 months
                };
            },
            
            convertToMonthly(amount, frequency) {
                const multipliers = this.getFrequencyMultipliers();
                const multiplier = multipliers[frequency];
                if (multiplier === undefined) return amount;
                return amount * multiplier;
            },
            
            convertFromMonthly(amount, frequency) {
                const multipliers = this.getFrequencyMultipliers();
                const multiplier = multipliers[frequency];
                if (multiplier === undefined || multiplier === 0) return amount;
                return amount / multiplier;
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
                const multipliers = this.getFrequencyMultipliers();
                
                // Calculate raw amounts for each frequency
                this.deductions.daily = this.calculateDeductions('daily');
                this.deductions.weekly = this.calculateDeductions('weekly');
                this.deductions.fortnightly = this.calculateDeductions('fortnightly');
                this.deductions.monthly = this.calculateDeductions('monthly');
                this.deductions.quarterly = this.calculateDeductions('quarterly');
                this.deductions.yearly = this.calculateDeductions('yearly');
                
                this.updateUpcomingDeductions();
            },
            
            calculateDeductions(frequency) {
                return this.expenses.reduce((total, expense) => {
                    return expense.frequency === frequency ? total + parseFloat(expense.amount) : total;
                }, 0);
            },
            
            getMonthlyEquivalentBreakdown() {
                const multipliers = this.getFrequencyMultipliers();
                
                return {
                    daily: parseFloat((this.calculateDeductions('daily') * multipliers.daily).toFixed(2)),
                    weekly: parseFloat((this.calculateDeductions('weekly') * multipliers.weekly).toFixed(2)),
                    fortnightly: parseFloat((this.calculateDeductions('fortnightly') * multipliers.fortnightly).toFixed(2)),
                    monthly: this.calculateDeductions('monthly'),
                    quarterly: parseFloat((this.calculateDeductions('quarterly') * multipliers.quarterly).toFixed(2)),
                    yearly: parseFloat((this.calculateDeductions('yearly') * multipliers.yearly).toFixed(2)),
                    total: this.totalExpenses
                };
            },
            
            // ===== NEXT DUE DATE CALCULATIONS (IMPROVED) =====
            getNextDueDate(expense, now) {
                const nextDueDate = new Date(now);
                
                if (expense.frequency === 'daily') {
                    // Daily expenses - next day
                    nextDueDate.setDate(now.getDate() + 1);
                    
                } else if (expense.frequency === 'monthly' && expense.dayOfMonth) {
                    const targetDay = parseInt(expense.dayOfMonth);
                    const currentDay = now.getDate();
                    const currentMonth = now.getMonth();
                    
                    if (currentDay >= targetDay) {
                        nextDueDate.setMonth(currentMonth + 1);
                    }
                    
                    const lastDayOfTargetMonth = new Date(nextDueDate.getFullYear(), nextDueDate.getMonth() + 1, 0).getDate();
                    const actualDay = Math.min(targetDay, lastDayOfTargetMonth);
                    nextDueDate.setDate(actualDay);
                    
                } else if (expense.frequency === 'quarterly' && expense.dayOfMonth) {
                    // Quarterly - every 3 months on specific day
                    const targetDay = parseInt(expense.dayOfMonth);
                    const startDate = expense.startDate ? new Date(expense.startDate) : new Date();
                    const monthsSinceStart = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
                    const quartersSinceStart = Math.floor(monthsSinceStart / 3);
                    
                    // Calculate next quarter month
                    let nextQuarterMonth = (quartersSinceStart + 1) * 3 + startDate.getMonth();
                    let nextQuarterYear = startDate.getFullYear() + Math.floor(nextQuarterMonth / 12);
                    nextQuarterMonth = nextQuarterMonth % 12;
                    
                    // Check if we're past this quarter's date
                    const currentQuarterMonth = quartersSinceStart * 3 + startDate.getMonth();
                    const currentQuarterYear = startDate.getFullYear() + Math.floor(currentQuarterMonth / 12);
                    const currentQuarterDate = new Date(currentQuarterYear, currentQuarterMonth % 12, targetDay);
                    
                    if (now <= currentQuarterDate) {
                        nextDueDate.setTime(currentQuarterDate.getTime());
                    } else {
                        nextDueDate.setFullYear(nextQuarterYear);
                        nextDueDate.setMonth(nextQuarterMonth);
                        const lastDay = new Date(nextDueDate.getFullYear(), nextDueDate.getMonth() + 1, 0).getDate();
                        nextDueDate.setDate(Math.min(targetDay, lastDay));
                    }
                    
                } else if (expense.frequency === 'yearly' && expense.startDate) {
                    // Yearly - same date each year
                    const startDate = new Date(expense.startDate);
                    const startDay = startDate.getDate();
                    const startMonth = startDate.getMonth();
                    
                    nextDueDate.setMonth(startMonth);
                    const lastDay = new Date(nextDueDate.getFullYear(), nextDueDate.getMonth() + 1, 0).getDate();
                    nextDueDate.setDate(Math.min(startDay, lastDay));
                    
                    if (nextDueDate <= now) {
                        nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
                        const lastDayNext = new Date(nextDueDate.getFullYear(), nextDueDate.getMonth() + 1, 0).getDate();
                        nextDueDate.setDate(Math.min(startDay, lastDayNext));
                    }
                    
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
                    dailyAverage: parseFloat((this.totalExpenses / this.getFrequencyMultipliers().daily).toFixed(2)),
                    weeklyAverage: parseFloat((this.totalExpenses / this.getFrequencyMultipliers().weekly).toFixed(2))
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

                const multipliers = this.getFrequencyMultipliers();
                const frequencyLabels = {
                    'daily': 'Daily',
                    'weekly': 'Weekly',
                    'fortnightly': 'Fortnightly',
                    'monthly': 'Monthly',
                    'quarterly': 'Quarterly',
                    'yearly': 'Yearly'
                };
                
                const frequencyColors = {
                    'daily': { bg: 'rgba(156, 39, 176, 0.8)', border: 'rgba(156, 39, 176, 1)' },
                    'weekly': { bg: 'rgba(0, 123, 255, 0.8)', border: 'rgba(0, 123, 255, 1)' },
                    'fortnightly': { bg: 'rgba(40, 167, 69, 0.8)', border: 'rgba(40, 167, 69, 1)' },
                    'monthly': { bg: 'rgba(255, 193, 7, 0.8)', border: 'rgba(255, 193, 7, 1)' },
                    'quarterly': { bg: 'rgba(233, 30, 99, 0.8)', border: 'rgba(233, 30, 99, 1)' },
                    'yearly': { bg: 'rgba(0, 188, 212, 0.8)', border: 'rgba(0, 188, 212, 1)' }
                };

                const rawData = {};
                const monthlyEquivalentData = {};

                this.expenses.forEach(expense => {
                    const amount = parseFloat(expense.amount);
                    const frequency = expense.frequency;
                    const label = frequencyLabels[frequency] || frequency;
                    
                    if (!rawData[label]) {
                        rawData[label] = 0;
                        monthlyEquivalentData[label] = 0;
                    }
                    
                    rawData[label] += amount;
                    monthlyEquivalentData[label] += amount * (multipliers[frequency] || 1);
                });

                // Filter out frequencies with no data
                const labels = Object.keys(monthlyEquivalentData).filter(label => monthlyEquivalentData[label] > 0);
                const data = labels.map(label => monthlyEquivalentData[label]);
                const backgroundColors = labels.map(label => {
                    const freq = Object.keys(frequencyLabels).find(k => frequencyLabels[k] === label);
                    return freq ? frequencyColors[freq].bg : 'rgba(99, 110, 114, 0.8)';
                });
                const borderColors = labels.map(label => {
                    const freq = Object.keys(frequencyLabels).find(k => frequencyLabels[k] === label);
                    return freq ? frequencyColors[freq].border : 'rgba(99, 110, 114, 1)';
                });

                if (labels.length === 0) {
                    return; // No data to display
                }

                this.frequencyChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Monthly Equivalent',
                            data: data,
                            backgroundColor: backgroundColors,
                            borderColor: borderColors,
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
                                        const freqKey = Object.keys(frequencyLabels).find(k => frequencyLabels[k] === label);
                                        
                                        if (label === 'Monthly') {
                                            return 'Monthly: ' + this.formatCurrency(rawAmount);
                                        } else if (label === 'Daily') {
                                            return [
                                                'Monthly Equivalent: ' + this.formatCurrency(monthlyEquiv),
                                                'Raw Daily: ' + this.formatCurrency(rawAmount) + '/day'
                                            ];
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
                                        } else if (label === 'Quarterly') {
                                            return [
                                                'Monthly Equivalent: ' + this.formatCurrency(monthlyEquiv),
                                                'Raw Quarterly: ' + this.formatCurrency(rawAmount) + '/quarter'
                                            ];
                                        } else if (label === 'Yearly') {
                                            return [
                                                'Monthly Equivalent: ' + this.formatCurrency(monthlyEquiv),
                                                'Raw Yearly: ' + this.formatCurrency(rawAmount) + '/year'
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

                // Search filter
                if (this.searchQuery && this.searchQuery.trim()) {
                    const query = this.searchQuery.toLowerCase().trim();
                    filtered = filtered.filter(expense => {
                        const nameMatch = expense.name.toLowerCase().includes(query);
                        const notesMatch = expense.notes && expense.notes.toLowerCase().includes(query);
                        const categoryMatch = this.getCategoryById(expense.category).name.toLowerCase().includes(query);
                        return nameMatch || notesMatch || categoryMatch;
                    });
                }

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
            this.initCurrencyConverter();
        }
    });
});