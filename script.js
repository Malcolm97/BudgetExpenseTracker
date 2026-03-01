// Budget Expense Tracker - Production Ready Version
// Optimized and enhanced with modern features

// ===== PRODUCTION-SAFE LOGGER =====
const ENABLE_DEBUG = false; // Set to true only during development
const Logger = {
    log: (message, data) => {
        if (ENABLE_DEBUG) console.log(message, data || '');
    },
    warn: (message, data) => {
        if (ENABLE_DEBUG) console.warn(message, data || '');
    },
    error: (message, error) => {
        console.error(message, error || ''); // Always log errors
    },
    debug: (message, data) => {
        if (ENABLE_DEBUG) console.debug(message, data || '');
    }
};

// Adding reusable function for input validation
function validateInput(value, fieldName) {
    if (value < 0) {
        // alert(`${fieldName} cannot be negative.`);
        return false;
    }
    return true;
}

// Adding event listener for interest calculation
window.addEventListener('load', () => {
    const interestButton = document.getElementById('calculate-interest');

    if (interestButton) {
        interestButton.addEventListener('click', () => {
            const principal = parseFloat(document.getElementById('principal-amount').value) || 0;
            const annualRate = parseFloat(document.getElementById('interest-rate').value) || 0;
            const fortnightlyContribution = parseFloat(document.getElementById('contribution-amount').value) || 0;
            const monthlyContribution = parseFloat(document.getElementById('contribution-monthly').value) || 0;

            if (!validateInput(principal, 'Principal Amount') ||
                !validateInput(annualRate, 'Annual Interest Rate') ||
                !validateInput(fortnightlyContribution, 'Fortnightly Contribution') ||
                !validateInput(monthlyContribution, 'Monthly Contribution')) {
                return;
            }

            const yearlyFortnightly = fortnightlyContribution * 26;
            const yearlyMonthly = monthlyContribution * 12;
            const totalContributions = yearlyFortnightly + yearlyMonthly;

            const totalSavings = principal + totalContributions + (principal + totalContributions) * (annualRate / 100);

            document.getElementById('total-savings').textContent = `$${totalSavings.toFixed(2)}`;
        });
    }

    const savingsButton = document.getElementById('calculate-savings');

    if (savingsButton) {
        savingsButton.addEventListener('click', () => {
            const fortnightlySavings = parseFloat(document.getElementById('fortnightly-savings').value) || 0;
            const monthlySavings = parseFloat(document.getElementById('monthly-savings').value) || 0;

            if (!validateInput(fortnightlySavings, 'Fortnightly Savings') ||
                !validateInput(monthlySavings, 'Monthly Savings')) {
                return;
            }

            const yearlySavings = (fortnightlySavings * 26) + (monthlySavings * 12);

            document.getElementById('yearly-savings').textContent = `$${yearlySavings.toFixed(2)}`;
        });
    }
});



// ===== STORAGE & DATA MANAGEMENT UTILITIES =====
const StorageUtils = {
    MAX_STORAGE_ATTEMPTS: 3,
    
    // Check localStorage quota
    canStore(key, value) {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                Logger.error('localStorage quota exceeded');
                return false;
            }
            return true;
        }
    },
    
    // Safe setItem with error handling
    setItem(key, value) {
        try {
            if (!this.canStore(key, value)) {
                Logger.warn('Storage quota check failed for:', key);
                return false;
            }
            localStorage.setItem(key, value);
            return true;
        } catch (e) {
            Logger.error('Failed to store data:', { key, error: e.message });
            return false;
        }
    },
    
    // Safe getItem
    getItem(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            Logger.error('Failed to retrieve data:', { key, error: e.message });
            return null;
        }
    }
};

// ===== INPUT SANITIZATION & VALIDATION =====
const InputSanitizer = {
    // Sanitize text input to prevent XSS
    sanitizeText(text) {
        if (typeof text !== 'string') return '';
        return text
            .trim()
            .replace(/[<>\"']/g, c => ({
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[c]))
            .slice(0, 500); // Limit length
    },
    
    // Sanitize number input
    sanitizeNumber(value) {
        const num = parseFloat(value);
        return isNaN(num) ? 0 : Math.max(0, Math.round(num * 100) / 100); // Limit to 2 decimals
    },
    
    // Validate expense object
    validateExpense(expense) {
        return {
            ...expense,
            name: this.sanitizeText(expense.name || ''),
            notes: this.sanitizeText(expense.notes || ''),
            amount: this.sanitizeNumber(expense.amount),
            category: String(expense.category || 'other').toLowerCase().slice(0, 50)
        };
    }
};

// ===== ACCESSIBILITY UTILITIES =====
const AccessibilityUtils = {
    // Announce message to screen readers
    announce(message, priority = 'polite') {
        const announcer = document.getElementById('sr-announcer');
        const announcerAssertive = document.getElementById('sr-announcer-assertive');
        
        if (priority === 'assertive' && announcerAssertive) {
            announcerAssertive.textContent = '';
            setTimeout(() => {
                announcerAssertive.textContent = message;
            }, 100);
        } else if (announcer) {
            announcer.textContent = '';
            setTimeout(() => {
                announcer.textContent = message;
            }, 100);
        }
    },
    
    focusFirst(element) {
        if (!element) return;
        const focusable = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0) {
            focusable[0].focus();
        }
    },
    
    focusLast(element) {
        if (!element) return;
        const focusable = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0) {
            focusable[focusable.length - 1].focus();
        }
    },
    
    // Trap focus within an element (for modals)
    trapFocus(element) {
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];
        
        element.addEventListener('keydown', (e) => {
            if (e.key !== 'Tab') return;
            
            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    lastFocusable.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    firstFocusable.focus();
                    e.preventDefault();
                }
            }
        });
    },
    
    // Handle escape key
    handleEscape(callback) {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                callback();
            }
        });
    }
};

// ===== PERFORMANCE UTILITIES =====
const PerformanceUtils = {
    // Debounce function for expensive operations
    debounce(func, delay = 300) {
        let timeoutId;
        return function debounced(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    },
    
    // Throttle function for frequent events
    throttle(func, limit = 300) {
        let inThrottle;
        return function throttled(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // Request animation frame debounce
    rafDebounce(func) {
        let requestId;
        return function debounced(...args) {
            cancelAnimationFrame(requestId);
            requestId = requestAnimationFrame(() => {
                func.apply(this, args);
            });
        };
    }
};


// ===== DUPLICATE EXPENSE DETECTOR =====
const DuplicateDetector = {
    /**
     * Find similar expenses based on name, amount, and frequency
     * @param {Object} newExpense - The potential new expense
     * @param {Array} existingExpenses - Array of existing expenses
     * @param {number} similarityThreshold - How many matches required (0-3)
     * @returns {Array} - Array of similar expenses
     */
    findSimilar(newExpense, existingExpenses, similarityThreshold = 2) {
        const similar = [];
        const nameNormalized = newExpense.name.toLowerCase().trim();
        const amountNormalized = parseFloat(newExpense.amount);
        const frequencyNormalized = newExpense.frequency;

        existingExpenses.forEach(expense => {
            let matchCount = 0;

            // Check name similarity (exact match or 80% similar)
            const existingNameNormalized = expense.name.toLowerCase().trim();
            if (existingNameNormalized === nameNormalized) {
                matchCount++;
            } else if (this.stringSimilarity(nameNormalized, existingNameNormalized) > 0.8) {
                matchCount++;
            }

            // Check amount (within 5%)
            const existingAmount = parseFloat(expense.amount);
            if (Math.abs(amountNormalized - existingAmount) <= (amountNormalized * 0.05)) {
                matchCount++;
            }

            // Check frequency
            if (frequencyNormalized === expense.frequency) {
                matchCount++;
            }

            if (matchCount >= similarityThreshold) {
                similar.push({ expense, matchCount });
            }
        });

        return similar.sort((a, b) => b.matchCount - a.matchCount);
    },

    /**
     * Calculate string similarity using Levenshtein distance
     * @param {string} str1
     * @param {string} str2
     * @returns {number} - Similarity score 0-1
     */
    stringSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;

        if (longer.length === 0) return 1.0;

        const editDistance = this.getEditDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    },

    /**
     * Calculate Levenshtein distance between two strings
     */
    getEditDistance(s1, s2) {
        const costs = [];
        for (let i = 0; i <= s1.length; i++) {
            let lastValue = i;
            for (let j = 0; j <= s2.length; j++) {
                if (i === 0) {
                    costs[j] = j;
                } else if (j > 0) {
                    let newValue = costs[j - 1];
                    if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                        newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    }
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
            if (i > 0) costs[s2.length] = lastValue;
        }
        return costs[s2.length];
    }
};


// ===== DATA COMPRESSION UTILITY =====
const DataCompressor = {
    /**
     * Compress data using RLE (Run-Length Encoding) for repetitive data
     * and simple minification for JSON
     */
    compress(data) {
        try {
            const jsonStr = JSON.stringify(data);
            return this.minifyJSON(jsonStr);
        } catch (error) {
            Logger.error('Compression error:', error);
            return JSON.stringify(data); // Fallback to uncompressed
        }
    },

    /**
     * Decompress data
     */
    decompress(compressedData) {
        try {
            return JSON.parse(compressedData);
        } catch (error) {
            Logger.error('Decompression error:', error);
            return null;
        }
    },

    /**
     * Minify JSON by removing unnecessary whitespace and duplicate keys
     */
    minifyJSON(jsonStr) {
        // Remove whitespace between tokens
        return jsonStr
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .replace(/:\s+/g, ':') // Remove space after colons
            .replace(/,\s+/g, ',') // Remove space after commas
            .replace(/\{\s+/g, '{') // Remove space after {
            .replace(/\}\s+/g, '}') // Remove space before }
            .replace(/\[\s+/g, '[') // Remove space after [
            .replace(/\]\s+/g, ']') // Remove space before ]
            .trim();
    },

    /**
     * Calculate compression ratio
     * @returns {number} - Ratio of compressed to original size
     */
    getCompressionRatio(original, compressed) {
        const originalSize = new Blob([original]).size;
        const compressedSize = new Blob([compressed]).size;
        return ((1 - compressedSize / originalSize) * 100).toFixed(2);
    },

    /**
     * Estimate storage savings for expenses array
     */
    estimateSavings(expenses) {
        try {
            const original = JSON.stringify(expenses);
            const compressed = this.compress(expenses);
            const ratio = this.getCompressionRatio(original, compressed);
            return {
                originalSize: (new Blob([original]).size / 1024).toFixed(2),
                compressedSize: (new Blob([compressed]).size / 1024).toFixed(2),
                savingsPercent: ratio
            };
        } catch (error) {
            Logger.error('Error estimating savings:', error);
            return null;
        }
    }
};


// ===== ENHANCED ERROR HANDLER =====
const ErrorHandler = {
    errorLog: [],
    MAX_ERRORS_LOGGED: 50,

    /**
     * Handle and log errors with context
     */
    handle(error, context = '', recoverCallback = null) {
        const errorEntry = {
            timestamp: new Date().toISOString(),
            context,
            message: error.message || String(error),
            stack: error.stack || '',
            recovered: false
        };

        this.errorLog.push(errorEntry);
        if (this.errorLog.length > this.MAX_ERRORS_LOGGED) {
            this.errorLog.shift(); // Keep only last 50 errors
        }

        Logger.error(`[${context}] ${error.message}`);

        // Attempt recovery if callback provided
        if (recoverCallback) {
            try {
                recoverCallback();
                errorEntry.recovered = true;
                Logger.log(`Recovery successful for: ${context}`);
                return { success: true, message: 'Error recovered successfully' };
            } catch (recoveryError) {
                Logger.error(`Recovery failed for ${context}:`, recoveryError);
                return { success: false, message: 'Recovery failed' };
            }
        }

        return { success: false, message: error.message };
    },

    /**
     * Async error handler with retry logic
     */
    async asyncHandle(asyncFn, context = '', retries = 3) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                return await asyncFn();
            } catch (error) {
                Logger.error(`[${context}] Attempt ${attempt} failed: ${error.message}`);
                if (attempt === retries) {
                    this.handle(error, context);
                    throw error;
                }
                // Wait before retry with exponential backoff
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
    },

    /**
     * Safe JSON parse with fallback
     */
    safeJSONParse(jsonStr, fallback = null) {
        try {
            return JSON.parse(jsonStr);
        } catch (error) {
            Logger.error('JSON parse error:', error);
            return fallback;
        }
    },

    /**
     * Safe JSON stringify with fallback
     */
    safeJSONStringify(obj, fallback = '{}') {
        try {
            return JSON.stringify(obj);
        } catch (error) {
            Logger.error('JSON stringify error:', error);
            return fallback;
        }
    },

    /**
     * Get error log for debugging
     */
    getLog() {
        return this.errorLog;
    },

    /**
     * Clear error log
     */
    clearLog() {
        this.errorLog = [];
    },

    /**
     * Export error log as JSON
     */
    exportLog() {
        return JSON.stringify(this.errorLog, null, 2);
    }
};


// ===== LAZY LOADING FOR CHART.JS =====
let chartJsLoaded = false;
let chartJsLoading = false;
let chartJsCallbacks = [];

function loadChartJs(callback) {
    if (chartJsLoaded) {
        if (callback) callback();
        return;
    }
    
    if (chartJsLoading) {
        if (callback) chartJsCallbacks.push(callback);
        return;
    }
    
    chartJsLoading = true;
    chartJsCallbacks.push(callback);
    
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js';
    script.async = true;
    
    script.onload = () => {
        chartJsLoaded = true;
        chartJsLoading = false;
        chartJsCallbacks.forEach(cb => cb && cb());
        chartJsCallbacks = [];
    };
    
    script.onerror = () => {
        chartJsLoading = false;
        console.error('Failed to load Chart.js');
        chartJsCallbacks = [];
    };
    
    document.head.appendChild(script);
}

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
                Logger.log('IndexedDB initialized successfully');
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
            Logger.log('ServiceWorker registration successful with scope: ', registration.scope);
            
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
            Logger.error('ServiceWorker registration failed: ', error);
        });
    });
}

function showUpdateNotification() {
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    const syncIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>';
    notification.innerHTML = '<div class="update-content">' + syncIcon + '<span>New version available!</span><button onclick="window.location.reload()" class="btn-primary btn-sm">Update</button></div>';
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

// ===== INITIALIZE SETTINGS PAGE APPEARANCE CONTROLS =====
function initSettingsAppearance() {
    Logger.debug('Initializing settings appearance controls...');
    
    // Dark Mode Toggle
    const settingsThemeToggle = document.getElementById('settings-theme-toggle');
    
    if (settingsThemeToggle) {
        try {
            const html = document.documentElement;
            
            // Set initial state based on current theme
            const currentTheme = html.getAttribute('data-theme') || 'light';
            settingsThemeToggle.checked = currentTheme === 'dark';
            Logger.debug('Dark mode toggle initialized:', currentTheme);
            
            // Add listener
            settingsThemeToggle.addEventListener('change', (e) => {
                const htmlElement = document.documentElement;
                const newTheme = e.target.checked ? 'dark' : 'light';
                
                htmlElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
                
                Logger.debug('Theme changed to:', newTheme);
            });
        } catch (err) {
            console.error('Error initializing dark mode toggle:', err);
        }
    } else {
        console.warn('Settings theme toggle element not found');
    }
    
    // Color Presets in Settings
    try {
        const settingsColorPresets = document.querySelectorAll('.color-preset-inline');
        const settingsCustomColor = document.getElementById('settings-custom-color');
        const customColorValueInline = document.querySelector('.custom-color-value-inline');
        
        Logger.debug('Found color presets:', settingsColorPresets.length);
        
        // Load saved color and apply active state
        const savedColor = localStorage.getItem('primaryColor') || '#007bff';
        if (settingsCustomColor) {
            settingsCustomColor.value = savedColor;
            if (customColorValueInline) {
                customColorValueInline.textContent = savedColor.toUpperCase();
            }
            
            // Mark active preset
            settingsColorPresets.forEach(preset => {
                if (preset.dataset.color === savedColor) {
                    preset.classList.add('active');
                } else {
                    preset.classList.remove('active');
                }
            });
        }
        
        // Preset colors
        settingsColorPresets.forEach(preset => {
            preset.addEventListener('click', (e) => {
                e.preventDefault();
                const color = preset.dataset.color;
                Logger.debug('Color preset clicked:', color);
                applyPrimaryColor(color);
                localStorage.setItem('primaryColor', color);
                
                if (settingsCustomColor) settingsCustomColor.value = color;
                if (customColorValueInline) customColorValueInline.textContent = color.toUpperCase();
                
                // Update active state
                settingsColorPresets.forEach(p => p.classList.remove('active'));
                preset.classList.add('active');
            });
        });
        
        // Custom color input
        if (settingsCustomColor) {
            settingsCustomColor.addEventListener('input', (e) => {
                const color = e.target.value;
                console.log('Custom color selected:', color);
                applyPrimaryColor(color);
                localStorage.setItem('primaryColor', color);
                
                if (customColorValueInline) customColorValueInline.textContent = color.toUpperCase();
                
                // Remove active from presets
                settingsColorPresets.forEach(p => p.classList.remove('active'));
            });
        }
    } catch (err) {
        console.error('Error initializing color picker:', err);
    }
}

// ===== MAIN APPLICATION =====
document.addEventListener('DOMContentLoaded', function() {
    const html = document.documentElement;

    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', savedTheme);
    
    // Load saved primary color from localStorage
    const savedColor = localStorage.getItem('primaryColor') || '#007bff';
    applyPrimaryColor(savedColor);
    
    // Defer initialization until after Vue is mounted
    // This ensures the DOM elements are properly set up by Vue
    setTimeout(() => {
        initSettingsAppearance();
    }, 500);

    // ===== OFFLINE INDICATOR =====
    const offlineIndicator = document.createElement('div');
    offlineIndicator.className = 'offline-indicator';
    const wifiSlashIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path><path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>';
    offlineIndicator.innerHTML = wifiSlashIcon + ' You are offline';
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

    // ===== NUMERIC INPUT HANDLER (Remove leading zeros) =====
    function initNumericInputHandlers() {
        document.addEventListener('change', (e) => {
            const input = e.target;
            if (input.type === 'number' && input.value) {
                // Clean up the input on blur/change
                const value = input.value.trim();
                
                if (value.includes('.')) {
                    const parts = value.split('.');
                    const intPart = parseInt(parts[0]) || '';
                    const decimalPart = parts[1];
                    input.value = intPart === '' ? '0.' + decimalPart : intPart + '.' + decimalPart;
                } else {
                    const intValue = parseInt(value);
                    if (!isNaN(intValue)) {
                        input.value = intValue.toString();
                    }
                }
            }
        }, true);
        
        // Also handle on input for real-time validation
        document.addEventListener('input', (e) => {
            const input = e.target;
            if (input.type === 'number' && input.value && input.value.startsWith('0') && input.value.length > 1 && !input.value.startsWith('0.')) {
                // Remove leading zeros in real-time for whole numbers like "012" -> "12"
                let value = input.value;
                value = value.replace(/^0+(?=\d)/, '');
                if (value === '') value = '0';
                input.value = value;
            }
        }, true);
    }
    
    initNumericInputHandlers();

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
            
            // Categories with inline SVG icons
            expenseCategories: [
                { id: 'food', name: 'Food & Dining', icon: 'utensils', color: '#ff6b6b' },
                { id: 'transport', name: 'Transportation', icon: 'car', color: '#4ecdc4' },
                { id: 'shopping', name: 'Shopping', icon: 'shopping-bag', color: '#45b7d1' },
                { id: 'entertainment', name: 'Entertainment', icon: 'film', color: '#f9ca24' },
                { id: 'bills', name: 'Bills & Utilities', icon: 'bolt', color: '#6c5ce7' },
                { id: 'health', name: 'Health & Fitness', icon: 'heartbeat', color: '#fd79a8' },
                { id: 'education', name: 'Education', icon: 'graduation-cap', color: '#00b894' },
                { id: 'travel', name: 'Travel', icon: 'plane', color: '#a29bfe' },
                { id: 'subscriptions', name: 'Subscriptions', icon: 'repeat', color: '#e17055' },
                { id: 'other', name: 'Other', icon: 'ellipsis-h', color: '#636e72' }
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
            
            // Advanced Filters
            showAdvancedFilters: false,
            dateFilterFrom: '',
            dateFilterTo: '',
            amountFilterMin: '',
            amountFilterMax: '',
            
            // Batch Operations
            batchMode: false,
            selectedExpenseIds: new Set(),
            batchAction: '',
            batchCategoryTarget: '',
            
            // Frequency options (extended)
            frequencyOptions: [
                { value: 'daily', label: 'Daily', multiplier: 30.4375 },
                { value: 'weekly', label: 'Weekly', multiplier: 4.34524 },
                { value: 'fortnightly', label: 'Fortnightly', multiplier: 2.17262 },
                { value: 'monthly', label: 'Monthly', multiplier: 1 },
                { value: 'quarterly', label: 'Quarterly', multiplier: 1/3 },
                { value: 'yearly', label: 'Yearly', multiplier: 1/12 }
            ],
            
            // Expense Templates
            expenseTemplates: [
                { name: 'Rent', amount: 1500, frequency: 'monthly', category: 'bills', dayOfMonth: 1 },
                { name: 'Groceries', amount: 200, frequency: 'weekly', category: 'food', day: 'saturday' },
                { name: 'Electricity Bill', amount: 150, frequency: 'monthly', category: 'bills', dayOfMonth: 15 },
                { name: 'Internet', amount: 80, frequency: 'monthly', category: 'bills', dayOfMonth: 1 },
                { name: 'Gas Bill', amount: 60, frequency: 'monthly', category: 'bills', dayOfMonth: 10 },
                { name: 'Water Bill', amount: 40, frequency: 'quarterly', category: 'bills', dayOfMonth: 1 },
                { name: 'Car Insurance', amount: 120, frequency: 'monthly', category: 'transport', dayOfMonth: 1 },
                { name: 'Health Insurance', amount: 200, frequency: 'monthly', category: 'health', dayOfMonth: 1 },
                { name: 'Gym Membership', amount: 50, frequency: 'monthly', category: 'health', dayOfMonth: 1 },
                { name: 'Netflix', amount: 15.99, frequency: 'monthly', category: 'subscriptions', dayOfMonth: 1 },
                { name: 'Spotify', amount: 9.99, frequency: 'monthly', category: 'subscriptions', dayOfMonth: 1 },
                { name: 'Phone Plan', amount: 50, frequency: 'monthly', category: 'bills', dayOfMonth: 1 },
                { name: 'Public Transport', amount: 30, frequency: 'weekly', category: 'transport', day: 'monday' },
                { name: 'Fuel', amount: 80, frequency: 'weekly', category: 'transport', day: 'friday' },
                { name: 'Dining Out', amount: 100, frequency: 'weekly', category: 'food', day: 'friday' },
                { name: 'Entertainment', amount: 50, frequency: 'weekly', category: 'entertainment', day: 'saturday' },
                { name: 'Streaming Services', amount: 30, frequency: 'monthly', category: 'subscriptions', dayOfMonth: 15 },
                { name: 'Home Insurance', amount: 100, frequency: 'monthly', category: 'bills', dayOfMonth: 1 },
                { name: 'Life Insurance', amount: 50, frequency: 'monthly', category: 'bills', dayOfMonth: 1 },
                { name: 'Pet Expenses', amount: 50, frequency: 'monthly', category: 'other', dayOfMonth: 1 }
            ],
            
            // Show templates panel
            showTemplates: false,
            
            // Category management
            showCategoryManager: false,
            editingCategory: null,
            newCategory: {
                name: '',
                color: '#636e72',
                icon: 'ellipsis-h'
            },
            
            // Available icons for categories
            availableIcons: [
                { id: 'utensils', name: 'Utensils' },
                { id: 'car', name: 'Car' },
                { id: 'shopping-bag', name: 'Shopping Bag' },
                { id: 'film', name: 'Film' },
                { id: 'bolt', name: 'Bolt' },
                { id: 'heartbeat', name: 'Heart' },
                { id: 'graduation-cap', name: 'Graduation Cap' },
                { id: 'plane', name: 'Plane' },
                { id: 'repeat', name: 'Repeat' },
                { id: 'ellipsis-h', name: 'More' },
                { id: 'home', name: 'Home' },
                { id: 'gift', name: 'Gift' },
                { id: 'coffee', name: 'Coffee' },
                { id: 'briefcase', name: 'Briefcase' },
                { id: 'music', name: 'Music' }
            ],
            
            // Custom categories (user-added)
            customCategories: [],
            
            // Category modal
            showAddCategoryModal: false,
            editingCategory: null,
            newCategory: {
                name: '',
                color: '#636e72',
                icon: 'ellipsis-h'
            },
            categoryColors: [
                '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7',
                '#fd79a8', '#00b894', '#a29bfe', '#e17055', '#636e72',
                '#2d3436', '#00cec9', '#ff7675', '#74b9ff', '#55a3ff'
            ],
            categoryIcons: [
                'utensils', 'car', 'shopping-bag',
                'film', 'bolt', 'heartbeat',
                'graduation-cap', 'plane', 'repeat',
                'ellipsis-h', 'home', 'gift',
                'coffee', 'briefcase', 'music'
            ],
            
            // Templates
            templates: [],
            
            // IndexedDB ready state
            dbReady: false,
            
            // Auto backup settings
            autoBackupEnabled: localStorage.getItem('autoBackupEnabled') !== 'false',
            lastBackupTime: null,
            
            // Savings tracking
            savingsTracking: {
                fortnightly: 0,
                monthly: 0,
                yearlySavings: 0
            },
            
            // Interest calculator
            interestCalculator: {
                principal: 0,
                rate: 0,
                fortnightlyContribution: 0,
                monthlyContribution: 0,
                yearsToCalculate: 5,
                compoundingFrequency: 'monthly',
                totalSavings: 0,
                accumulationBreakdown: [],
                annualTotalSavings: 0
            }
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
            
            formatCurrencyNoDecimals(amount) {
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
                const num = Math.round(parseFloat(amount) || 0);
                return curr.symbol + num.toLocaleString(curr.locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
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
                
                // Reset alerts if we're below 50% (cleanup)
                if (percentage < 50) {
                    this.budgetAlerts = { 50: false, 75: false, 90: false, 100: false };
                    return;
                }
                
                // Show alerts based on current percentage
                // Only show one alert at the highest threshold reached
                if (percentage >= 100) {
                    if (!this.budgetAlerts[100]) {
                        this.budgetAlerts[100] = true;
                        const exceeded = Math.round((this.totalExpenses - this.budget) * 100) / 100;
                        this.displayNotification(
                            `⚠️ Budget Exceeded by ${this.getCurrencySymbol()}${exceeded.toFixed(2)}!`,
                            'warning',
                            5000
                        );
                    }
                    // Reset lower thresholds
                    this.budgetAlerts[90] = false;
                    this.budgetAlerts[75] = false;
                    this.budgetAlerts[50] = false;
                } else if (percentage >= 90) {
                    if (!this.budgetAlerts[90]) {
                        this.budgetAlerts[90] = true;
                        const remaining = Math.round((this.budget - this.totalExpenses) * 100) / 100;
                        this.displayNotification(
                            `⚠️ You have used 90% of your budget. Only ${this.getCurrencySymbol()}${remaining.toFixed(2)} remaining!`,
                            'warning',
                            4000
                        );
                    }
                    // Reset lower thresholds
                    this.budgetAlerts[75] = false;
                    this.budgetAlerts[50] = false;
                    this.budgetAlerts[100] = false;
                } else if (percentage >= 75) {
                    if (!this.budgetAlerts[75]) {
                        this.budgetAlerts[75] = true;
                        this.displayNotification(
                            '📊 You have used 75% of your budget.',
                            'info',
                            3000
                        );
                    }
                    // Reset other thresholds
                    this.budgetAlerts[50] = false;
                } else if (percentage >= 50) {
                    if (!this.budgetAlerts[50]) {
                        this.budgetAlerts[50] = true;
                        this.displayNotification(
                            '💰 You have used 50% of your budget.',
                            'info',
                            3000
                        );
                    }
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
                    const sanitizedName = InputSanitizer.sanitizeText(name);
                    const parsedAmount = InputSanitizer.sanitizeNumber(amount);
                    
                    if (!sanitizedName || sanitizedName.length === 0) {
                        this.displayError('Please enter an expense name.');
                        return;
                    }
                    
                    if (isNaN(parsedAmount) || parsedAmount <= 0) {
                        this.displayError('Please enter a valid amount greater than 0.');
                        return;
                    }
                    
                    // Check for duplicate expenses (only when adding new, not editing)
                    if (this.editingIndex === null) {
                        const duplicates = DuplicateDetector.findSimilar(
                            { name: sanitizedName, amount: parsedAmount, frequency: frequency },
                            this.expenses,
                            2 // Require at least 2 matching criteria
                        );
                        
                        if (duplicates.length > 0) {
                            const duplicateNames = duplicates.map(d => `${d.expense.name} ($${d.expense.amount}/${d.expense.frequency})`).join(', ');
                            const proceedDuplicate = confirm(
                                `⚠️ Similar expense(s) found:\n\n${duplicateNames}\n\nDo you want to add this expense anyway?`
                            );
                            if (!proceedDuplicate) {
                                return;
                            }
                        }
                    }
                    
                    if (this.editingIndex !== null) {
                        const updatedExpense = {
                            id: this.expenses[this.editingIndex].id || generateId(),
                            name: sanitizedName,
                            amount: parsedAmount,
                            frequency: frequency,
                            day: frequency !== 'monthly' ? day : '',
                            dayOfMonth: frequency === 'monthly' ? parseInt(dayOfMonth) : null,
                            category: category,
                            startDate: startDate || new Date().toISOString().split('T')[0],
                            notes: InputSanitizer.sanitizeText(notes),
                            updatedAt: new Date().toISOString()
                        };
                        this.expenses.splice(this.editingIndex, 1, updatedExpense);
                        this.editingIndex = null;
                        this.isEditing = false;
                        this.displaySuccess('Expense updated successfully!');
                    } else {
                        const newExpenseItem = {
                            id: generateId(),
                            name: sanitizedName,
                            amount: parsedAmount,
                            frequency: frequency,
                            day: frequency !== 'monthly' ? day : '',
                            dayOfMonth: frequency === 'monthly' ? parseInt(dayOfMonth) : null,
                            category: category,
                            startDate: startDate || new Date().toISOString().split('T')[0],
                            notes: InputSanitizer.sanitizeText(notes),
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
                    Logger.error('Error adding expense:', error);
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
                
                // Announce to screen readers
                AccessibilityUtils.announce(title + ': ' + message, 'assertive');
                
                // Focus management - focus the confirm button when modal opens
                this.$nextTick(() => {
                    const modal = document.querySelector('.confirm-modal-content');
                    if (modal) {
                        AccessibilityUtils.trapFocus(modal);
                        const confirmBtn = modal.querySelector('.btn-danger');
                        if (confirmBtn) confirmBtn.focus();
                    }
                });
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
                // Use simple multipliers for intuitive budgeting
                // Based on common expectations: 4 weeks = 1 month, 2 fortnights = 1 month
                return {
                    daily: 30,                          // 30 days per month
                    weekly: 4,                          // 4 weeks per month
                    fortnightly: 2,                     // 2 fortnights per month
                    monthly: 1,                         // 1 month
                    quarterly: 0.33333,                 // 4 quarters / 12 months = 1/3
                    yearly: 0.08333                     // 1 year / 12 months = 1/12
                };
            },
            
            convertToMonthly(amount, frequency) {
                const multipliers = this.getFrequencyMultipliers();
                const multiplier = multipliers[frequency];
                if (multiplier === undefined) return amount;
                // Use proper rounding to avoid floating-point precision issues
                return Math.round(amount * multiplier * 100) / 100;
            },
            
            convertFromMonthly(amount, frequency) {
                const multipliers = this.getFrequencyMultipliers();
                const multiplier = multipliers[frequency];
                if (multiplier === undefined || multiplier === 0) return amount;
                // Use proper rounding to avoid floating-point precision issues
                return Math.round((amount / multiplier) * 100) / 100;
            },
            
            updateTotalExpenses() {
                let monthlyEquivalent = 0;
                
                this.expenses.forEach(expense => {
                    const amount = parseFloat(expense.amount) || 0;
                    if (amount > 0) {
                        monthlyEquivalent += this.convertToMonthly(amount, expense.frequency);
                    }
                });

                // Round to 2 decimal places to avoid floating-point precision issues
                this.totalExpenses = Math.round(monthlyEquivalent * 100) / 100;
                
                // Calculate remaining balance
                const budgetAmount = parseFloat(this.budget) || 0;
                this.remainingBalance = Math.round((budgetAmount - this.totalExpenses) * 100) / 100;
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
                    daily: Math.round(this.calculateDeductions('daily') * multipliers.daily),
                    weekly: Math.round(this.calculateDeductions('weekly') * multipliers.weekly),
                    fortnightly: Math.round(this.calculateDeductions('fortnightly') * multipliers.fortnightly),
                    monthly: Math.round(this.calculateDeductions('monthly')),
                    quarterly: Math.round(this.calculateDeductions('quarterly') * multipliers.quarterly),
                    yearly: Math.round(this.calculateDeductions('yearly') * multipliers.yearly),
                    total: Math.round(this.totalExpenses)
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
                    categoryBreakdown[cat.id] = Math.round(this.getCategorySpending(cat.id) * 100) / 100;
                });
                
                const existingIndex = this.spendingHistory.findIndex(h => h.month === monthKey);
                const record = {
                    month: monthKey,
                    total: Math.round(this.totalExpenses * 100) / 100,
                    categories: categoryBreakdown,
                    budget: Math.round(this.budget * 100) / 100,
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
                    averageExpense: Math.round((this.totalExpenses / this.expenses.length) * 100) / 100,
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
                    dailyAverage: Math.round((this.totalExpenses / this.getFrequencyMultipliers().daily) * 100) / 100,
                    weeklyAverage: Math.round((this.totalExpenses / this.getFrequencyMultipliers().weekly) * 100) / 100
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
            
            getMonthlyComparison() {
                if (this.spendingHistory.length < 2) {
                    return null;
                }
                
                // Get last two months
                const lastMonth = this.spendingHistory[this.spendingHistory.length - 1];
                const previousMonth = this.spendingHistory[this.spendingHistory.length - 2];
                
                const lastMonthAmount = lastMonth ? lastMonth.total : 0;
                const previousMonthAmount = previousMonth ? previousMonth.total : 0;
                
                let difference = lastMonthAmount - previousMonthAmount;
                let percentageChange = previousMonthAmount > 0 
                    ? ((difference / previousMonthAmount) * 100) 
                    : (lastMonthAmount > 0 ? 100 : 0);
                
                return {
                    lastMonth: {
                        amount: lastMonthAmount,
                        date: lastMonth ? lastMonth.month : new Date().toISOString().substring(0, 7)
                    },
                    previousMonth: {
                        amount: previousMonthAmount,
                        date: previousMonth ? previousMonth.month : null
                    },
                    difference: Math.round(difference * 100) / 100,
                    percentageChange: Math.round(percentageChange * 100) / 100,
                    trend: difference > 0 ? 'up' : difference < 0 ? 'down' : 'stable'
                };
            },

            /**
             * Get spending trends for the last N months
             * @param {number} months - Number of months to analyze
             * @returns {Object} - Trend analysis with patterns and predictions
             */
            getMonthlyTrends(months = 6) {
                const recentHistory = this.spendingHistory.slice(-months);
                
                if (recentHistory.length === 0) {
                    return null;
                }

                const amounts = recentHistory.map(h => h.total);
                const average = amounts.reduce((a, b) => a + b, 0) / amounts.length;
                const highest = Math.max(...amounts);
                const lowest = Math.min(...amounts);
                
                // Calculate trend direction (increasing, decreasing, or stable)
                const firstHalf = amounts.slice(0, Math.ceil(amounts.length / 2)).reduce((a, b) => a + b, 0) / Math.ceil(amounts.length / 2);
                const secondHalf = amounts.slice(Math.ceil(amounts.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(amounts.length / 2);
                
                const trendDirection = secondHalf > firstHalf ? 'increasing' : secondHalf < firstHalf ? 'decreasing' : 'stable';
                
                // Simple linear regression for prediction
                const forecast = this.predictNextMonth(amounts);

                return {
                    months: months,
                    average: Math.round(average * 100) / 100,
                    highest: Math.round(highest * 100) / 100,
                    lowest: Math.round(lowest * 100) / 100,
                    variance: Math.round((highest - lowest) * 100) / 100,
                    trend: trendDirection,
                    predictedNext: forecast,
                    history: recentHistory.map((h, i) => ({
                        month: h.month,
                        amount: h.total,
                        change: i > 0 ? Math.round((h.total - amounts[i-1]) * 100) / 100 : 0
                    }))
                };
            },

            /**
             * Simple linear regression to predict next month's spending
             */
            predictNextMonth(amounts) {
                if (amounts.length < 2) return amounts[0] || 0;
                
                const n = amounts.length;
                const x = Array.from({length: n}, (_, i) => i);
                const y = amounts;
                
                const xMean = x.reduce((a, b) => a + b, 0) / n;
                const yMean = y.reduce((a, b) => a + b, 0) / n;
                
                const numerator = x.reduce((sum, xi, i) => sum + (xi - xMean) * (y[i] - yMean), 0);
                const denominator = x.reduce((sum, xi) => sum + Math.pow(xi - xMean, 2), 0);
                
                const slope = denominator === 0 ? 0 : numerator / denominator;
                const intercept = yMean - (slope * xMean);
                
                const nextValue = slope * n + intercept;
                return Math.round(Math.max(0, nextValue) * 100) / 100;
            },

            /**
             * Get category spending trends
             */
            getCategoryTrends() {
                const categoryTrends = {};
                
                this.expenses.forEach(expense => {
                    if (!categoryTrends[expense.category]) {
                        categoryTrends[expense.category] = {
                            category: expense.category,
                            categoryName: this.getCategoryById(expense.category).name,
                            total: 0,
                            count: 0,
                            average: 0
                        };
                    }
                    
                    const monthlyAmount = this.getMonthlyEquivalent(expense.amount, expense.frequency);
                    categoryTrends[expense.category].total += monthlyAmount;
                    categoryTrends[expense.category].count += 1;
                });

                Object.keys(categoryTrends).forEach(key => {
                    const trend = categoryTrends[key];
                    trend.average = trend.count > 0 ? Math.round((trend.total / trend.count) * 100) / 100 : 0;
                    trend.total = Math.round(trend.total * 100) / 100;
                });

                return Object.values(categoryTrends).sort((a, b) => b.total - a.total);
            },
            
            // ===== SVG ICON HELPER =====
            getSvgIcon(name, size = 16, color = 'currentColor') {
                const icons = {
                    'exclamation-triangle': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
                    'check-circle': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
                    'info-circle': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
                    'trash': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
                    'sync': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`,
                    'wifi-slash': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path><path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>`,
                    'sun': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
                    'moon': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
                    'utensils': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path><path d="M7 2v20"></path><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"></path></svg>`,
                    'car': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"></path><circle cx="6.5" cy="16.5" r="2.5"></circle><circle cx="16.5" cy="16.5" r="2.5"></circle></svg>`,
                    'shopping-bag': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>`,
                    'film': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>`,
                    'bolt': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
                    'heartbeat': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
                    'graduation-cap': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>`,
                    'plane': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"></path></svg>`,
                    'repeat': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>`,
                    'ellipsis-h': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>`,
                    'arrow-up': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>`,
                    'chart-line': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>`,
                    'tag': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>`,
                    'palette': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"></circle><circle cx="17.5" cy="10.5" r=".5"></circle><circle cx="8.5" cy="7.5" r=".5"></circle><circle cx="6.5" cy="12.5" r=".5"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"></path></svg>`
                };
                return icons[name] || '';
            },
            
            getCategoryIcon(categoryId, size = 16) {
                const category = this.expenseCategories.find(c => c.id === categoryId);
                if (category) {
                    return this.getSvgIcon(category.icon, size, category.color);
                }
                return this.getSvgIcon('ellipsis-h', size);
            },
            
            // Get category icon as inline SVG HTML (for v-html in templates)
            getCategoryIconHtml(categoryId, size = 16) {
                const category = this.expenseCategories.find(c => c.id === categoryId);
                if (category) {
                    return this.getSvgIcon(category.icon, size, '#ffffff');
                }
                return this.getSvgIcon('ellipsis-h', size, '#ffffff');
            },
            
            // Get icon HTML by icon name (for category management)
            getIconHtmlByName(iconName, size = 16, color = 'currentColor') {
                return this.getSvgIcon(iconName, size, color);
            },
            
            // ===== UTILIZATION COLOR SYSTEM =====
            getUtilizationColor(utilization) {
                // Green (0-20%): #28a745 (Success)
                // Light Green (21-35%): #7FD856
                // Yellow-Green (36-50%): #A4C639
                // Yellow (51-65%): #ffc107 (Warning)
                // Orange (66-80%): #ff9800
                // Orange-Red (81-90%): #ff6b35
                // Red (91-105%): #dc3545 (Danger)
                // Dark Red (105%+): #9a1e1e
                
                if (utilization <= 20) return '#28a745'; // Green
                if (utilization <= 35) return '#7FD856'; // Light Green
                if (utilization <= 50) return '#A4C639'; // Yellow-Green
                if (utilization <= 65) return '#ffc107'; // Yellow
                if (utilization <= 80) return '#ff9800'; // Orange
                if (utilization <= 90) return '#ff6b35'; // Orange-Red
                if (utilization < 100) return '#dc3545'; // Red
                return '#9a1e1e';                          // Dark Red (over budget)
            },
            
            // ===== NOTIFICATIONS =====
            displayNotification(message, type, duration) {
                type = type || 'error';
                duration = duration || 2500; // Shorter default duration
                // Remove any existing notification to prevent overlap
                const existing = document.querySelector('.notification:not(.undo-notification)');
                if (existing) {
                    existing.style.opacity = '0';
                    existing.style.transform = 'translateX(100%)';
                    setTimeout(() => {
                        if (existing.parentNode) existing.parentNode.removeChild(existing);
                    }, 200);
                }
                const notification = document.createElement('div');
                notification.className = 'notification ' + type + '-notification';
                notification.setAttribute('role', 'alert');
                const iconName = type === 'error' ? 'exclamation-triangle' : type === 'success' ? 'check-circle' : 'info-circle';
                notification.innerHTML = '<div class="flex">' + this.getSvgIcon(iconName, 18) + '<span>' + message + '</span></div>';
                document.body.appendChild(notification);

                // Announce to screen readers
                const priority = type === 'error' ? 'assertive' : 'polite';
                AccessibilityUtils.announce(message, priority);

                setTimeout(() => { notification.style.display = 'block'; }, 10);

                // Always clear any previous timeout
                if (window._notificationTimeout) clearTimeout(window._notificationTimeout);
                window._notificationTimeout = setTimeout(() => {
                    notification.style.opacity = '0';
                    notification.style.transform = 'translateX(100%)';
                    setTimeout(() => {
                        if (notification.parentNode) notification.parentNode.removeChild(notification);
                    }, 200);
                }, duration);

                notification.addEventListener('click', () => {
                    if (window._notificationTimeout) clearTimeout(window._notificationTimeout);
                    notification.style.opacity = '0';
                    notification.style.transform = 'translateX(100%)';
                    setTimeout(() => {
                        if (notification.parentNode) notification.parentNode.removeChild(notification);
                    }, 200);
                });
            },
            
            displayUndoNotification(message) {
                // Remove any other notification to prevent overlap
                const existing = document.querySelector('.notification:not(.undo-notification)');
                if (existing) {
                    existing.style.opacity = '0';
                    existing.style.transform = 'translateX(100%)';
                    setTimeout(() => {
                        if (existing.parentNode) existing.parentNode.removeChild(existing);
                    }, 200);
                }
                
                const notification = document.createElement('div');
                notification.className = 'notification undo-notification warning-notification';
                notification.setAttribute('role', 'alert');
                notification.innerHTML = '<div class="flex">' + this.getSvgIcon('trash', 18) + '<span>' + message + '</span><button class="undo-btn" onclick="window.vueApp.undoDelete()">Undo</button></div>';
                document.body.appendChild(notification);

                setTimeout(() => { notification.style.display = 'block'; }, 10);

                // Clear previous undo timeout if exists
                if (window._undoNotificationTimeout) clearTimeout(window._undoNotificationTimeout);
                window._undoNotificationTimeout = setTimeout(() => {
                    notification.style.opacity = '0';
                    notification.style.transform = 'translateX(100%)';
                    setTimeout(() => {
                        if (notification.parentNode) notification.parentNode.removeChild(notification);
                    }, 200);
                }, 5000);
                
                // Allow clicking to dismiss
                notification.addEventListener('click', (e) => {
                    if (e.target.classList.contains('undo-btn')) return;
                    if (window._undoNotificationTimeout) clearTimeout(window._undoNotificationTimeout);
                    notification.style.opacity = '0';
                    notification.style.transform = 'translateX(100%)';
                    setTimeout(() => {
                        if (notification.parentNode) notification.parentNode.removeChild(notification);
                    }, 200);
                });
            },
            
            displayError(message) { this.displayNotification(message, 'error'); },
            displaySuccess(message) { this.displayNotification(message, 'success'); },
            
            calculateTotalExpenses() { this.updateTotalExpenses(); },
            
            saveExpenses() {
                try {
                    if (StorageUtils.canStore('expenses', JSON.stringify(this.expenses))) {
                        localStorage.setItem('expenses', JSON.stringify(this.expenses));
                        Logger.log('Expenses saved successfully');
                    } else {
                        Logger.warn('Storage quota may be exceeded');
                        // Try to compress data if it's large
                        const expensesStr = JSON.stringify(this.expenses);
                        if (expensesStr.length > 102400) { // > 100KB
                            const minified = DataCompressor.minifyJSON(expensesStr);
                            if (minified.length < expensesStr.length) {
                                localStorage.setItem('expenses', minified);
                                Logger.log(`Data compressed by ${DataCompressor.getCompressionRatio(expensesStr, minified)}%`);
                            }
                        }
                    }
                } catch (error) {
                    ErrorHandler.handle(error, 'saveExpenses', () => {
                        // Fallback: try to save with older expenses removed
                        const recentExpenses = this.expenses.slice(-100);
                        localStorage.setItem('expenses', JSON.stringify(recentExpenses));
                        Logger.warn('Saved only recent expenses due to storage limitations');
                    });
                }
            },
            
            // ===== CHARTS =====
            createCharts() {
                loadChartJs(() => {
                    this.$nextTick(() => {
                        this.createCategoryChart();
                        this.createFrequencyChart();
                        this.createTrendChart();
                    });
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
                const data = labels.map(label => Math.round(monthlyEquivalentData[label] * 100) / 100);
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
                this.searchQuery = '';
                this.dateFilterFrom = '';
                this.dateFilterTo = '';
                this.amountFilterMin = '';
                this.amountFilterMax = '';
                this.showAdvancedFilters = false;
            },
            
            toggleAdvancedFilters() {
                this.showAdvancedFilters = !this.showAdvancedFilters;
            },

            // ===== BATCH OPERATIONS =====
            toggleBatchMode() {
                this.batchMode = !this.batchMode;
                if (!this.batchMode) {
                    this.selectedExpenseIds.clear();
                    this.batchAction = '';
                    this.batchCategoryTarget = '';
                }
            },

            toggleSelectExpense(expenseId) {
                if (this.selectedExpenseIds.has(expenseId)) {
                    this.selectedExpenseIds.delete(expenseId);
                } else {
                    this.selectedExpenseIds.add(expenseId);
                }
                // Force Vue reactivity for Set
                this.selectedExpenseIds = new Set(this.selectedExpenseIds);
            },

            selectAllFiltered() {
                this.filteredExpenses.forEach(expense => {
                    this.selectedExpenseIds.add(expense.id);
                });
                this.selectedExpenseIds = new Set(this.selectedExpenseIds);
            },

            deselectAll() {
                this.selectedExpenseIds.clear();
                this.selectedExpenseIds = new Set();
            },

            isExpenseSelected(expenseId) {
                return this.selectedExpenseIds.has(expenseId);
            },

            executeBatchAction() {
                if (this.selectedExpenseIds.size === 0) {
                    this.displayError('Please select at least one expense');
                    return;
                }

                const selectedExpenses = this.expenses.filter(e => this.selectedExpenseIds.has(e.id));

                if (this.batchAction === 'delete') {
                    const count = selectedExpenses.length;
                    if (confirm(`Are you sure you want to delete ${count} expense(s)?`)) {
                        this.expenses = this.expenses.filter(e => !this.selectedExpenseIds.has(e.id));
                        this.deselectAll();
                        this.batchMode = false;
                        this.saveExpenses();
                        this.updateTotalExpenses();
                        this.displaySuccess(`${count} expense(s) deleted!`);
                    }
                } else if (this.batchAction === 'category' && this.batchCategoryTarget) {
                    selectedExpenses.forEach(expense => {
                        expense.category = this.batchCategoryTarget;
                    });
                    this.deselectAll();
                    this.batchMode = false;
                    this.saveExpenses();
                    this.displaySuccess(`Category updated for ${selectedExpenses.length} expense(s)!`);
                } else if (this.batchAction === 'export-json') {
                    this.exportSelectedExpensesJSON(selectedExpenses);
                    this.deselectAll();
                    this.batchMode = false;
                } else if (this.batchAction === 'export-excel') {
                    this.exportSelectedExpensesExcel(selectedExpenses);
                    this.deselectAll();
                    this.batchMode = false;
                } else if (this.batchAction === 'export-pdf') {
                    this.exportSelectedExpensesPDF(selectedExpenses);
                    this.deselectAll();
                    this.batchMode = false;
                }
            },

            exportSelectedExpensesJSON(selectedExpenses) {
                if (!selectedExpenses || selectedExpenses.length === 0) {
                    this.displayError('No expenses selected');
                    return;
                }
                const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(selectedExpenses, null, 2));
                const dlAnchor = document.createElement('a');
                dlAnchor.setAttribute('href', dataStr);
                dlAnchor.setAttribute('download', 'expenses-batch-export.json');
                document.body.appendChild(dlAnchor);
                dlAnchor.click();
                dlAnchor.remove();
                this.displaySuccess(`${selectedExpenses.length} expense(s) exported as JSON!`);
            },

            exportSelectedExpensesExcel(selectedExpenses) {
                if (!selectedExpenses || selectedExpenses.length === 0) {
                    this.displayError('No expenses selected');
                    return;
                }
                if (typeof XLSX === 'undefined') {
                    this.displayError('Excel export requires SheetJS (XLSX) library.');
                    return;
                }
                const ws = XLSX.utils.json_to_sheet(selectedExpenses);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
                XLSX.writeFile(wb, 'expenses-batch-export.xlsx');
                this.displaySuccess(`${selectedExpenses.length} expense(s) exported as Excel!`);
            },

            exportSelectedExpensesPDF(selectedExpenses) {
                if (!selectedExpenses || selectedExpenses.length === 0) {
                    this.displayError('No expenses selected');
                    return;
                }
                if (typeof jsPDF === 'undefined') {
                    this.displayError('PDF export requires jsPDF library.');
                    return;
                }
                const doc = new jsPDF();
                const columns = [
                    'Name', 'Amount', 'Frequency', 'Category', 'Date', 'Notes'
                ];
                const rows = selectedExpenses.map(e => [
                    e.name, e.amount, e.frequency, e.category, e.startDate || '', e.notes || ''
                ]);
                doc.autoTable({ head: [columns], body: rows });
                doc.save('expenses-batch-export.pdf');
                this.displaySuccess(`${selectedExpenses.length} expense(s) exported as PDF!`);
            },
            
            // ===== IMPORT/EXPORT =====

            exportAllToExcel() {
                if (typeof XLSX === 'undefined') {
                    this.displayError('Excel export requires SheetJS (XLSX) library.');
                    return;
                }
                const ws = XLSX.utils.json_to_sheet(this.expenses);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
                XLSX.writeFile(wb, 'expenses-export.xlsx');
                this.displaySuccess('All expenses exported as Excel!');
            },

            exportAllToPDF() {
                if (typeof jsPDF === 'undefined') {
                    this.displayError('PDF export requires jsPDF library.');
                    return;
                }
                const doc = new jsPDF();
                const columns = [
                    'Name', 'Amount', 'Frequency', 'Category', 'Date', 'Notes'
                ];
                const rows = this.expenses.map(e => [
                    e.name, e.amount, e.frequency, e.category, e.startDate || '', e.notes || ''
                ]);
                doc.autoTable({ head: [columns], body: rows });
                doc.save('expenses-export.pdf');
                this.displaySuccess('All expenses exported as PDF!');
            },
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
            
            exportToCSV() {
                try {
                    if (this.expenses.length === 0) {
                        this.displayError('No expenses to export.');
                        return;
                    }
                    
                    // Create CSV header
                    const headers = ['Name', 'Amount', 'Frequency', 'Monthly Equivalent', 'Category', 'Day/Date', 'Start Date', 'Notes'];
                    
                    // Create CSV rows
                    const rows = this.expenses.map(expense => {
                        const category = this.getCategoryById(expense.category);
                        const monthlyAmount = Math.round(this.convertToMonthly(parseFloat(expense.amount), expense.frequency) * 100) / 100;
                        const dayInfo = expense.frequency === 'monthly' 
                            ? (expense.dayOfMonth || 1) 
                            : (expense.day || '');
                        
                        return [
                            `"${expense.name.replace(/"/g, '""')}"`,  // Escape quotes
                            expense.amount.toFixed(2),
                            expense.frequency,
                            monthlyAmount.toFixed(2),
                            `"${category.name.replace(/"/g, '""')}"`,
                            dayInfo,
                            expense.startDate || '',
                            `"${(expense.notes || '').replace(/"/g, '""')}"`
                        ];
                    });
                    
                    // Create CSV content
                    const csvContent = [
                        headers.join(','),
                        ...rows.map(row => row.join(','))
                    ].join('\n');
                    
                    // Add summary section
                    const summaryContent = `\n\nSummary\nTotal Monthly Expenses,${this.totalExpenses.toFixed(2)}\nBudget,${this.budget.toFixed(2)}\nRemaining Balance,${this.remainingBalance.toFixed(2)}\nBudget Utilization,${this.budgetUtilization.toFixed(1)}%\nExport Date,${new Date().tolocaleString()}`;
                    
                    const fullContent = csvContent + summaryContent;
                    
                    // Create blob and download
                    const blob = new Blob([fullContent], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    
                    if (link.download !== undefined) {
                        const url = URL.createObjectURL(blob);
                        link.setAttribute('href', url);
                        link.setAttribute('download', 'expenses_' + new Date().toISOString().split('T')[0] + '.csv');
                        link.style.visibility = 'hidden';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        this.displaySuccess('Expenses exported to CSV successfully!');
                    } else {
                        this.displayError('CSV export not supported in this browser.');
                    }
                } catch (error) {
                    console.error('CSV export error:', error);
                    this.displayError('Error exporting to CSV. Please try again.');
                }
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
                        this.expenses = ErrorHandler.safeJSONParse(storedExpenses, []);
                        this.expenses = this.validateExpenses(this.expenses).map(exp => ({
                            ...exp,
                            id: exp.id || generateId(),
                            notes: exp.notes || '',
                            dayOfMonth: exp.dayOfMonth || null
                        }));
                    } catch (e) {
                        ErrorHandler.handle(e, 'loadExpenses', () => {
                            this.expenses = [];
                        });
                    }
                }
                
                const storedCategoryBudgets = localStorage.getItem('categoryBudgets');
                if (storedCategoryBudgets) {
                    try {
                        this.categoryBudgets = ErrorHandler.safeJSONParse(storedCategoryBudgets, {});
                    } catch (e) {
                        ErrorHandler.handle(e, 'loadCategoryBudgets');
                        this.categoryBudgets = {};
                    }
                }
                
                const storedSpendingHistory = localStorage.getItem('spendingHistory');
                if (storedSpendingHistory) {
                    try {
                        this.spendingHistory = ErrorHandler.safeJSONParse(storedSpendingHistory, []);
                    } catch (e) {
                        ErrorHandler.handle(e, 'loadSpendingHistory');
                        this.spendingHistory = [];
                    }
                }
                
                // Load templates from localStorage
                const storedTemplates = localStorage.getItem('templates');
                if (storedTemplates) {
                    try {
                        this.templates = ErrorHandler.safeJSONParse(storedTemplates, []);
                    } catch (e) {
                        ErrorHandler.handle(e, 'loadTemplates');
                        this.templates = [];
                    }
                }
                
                // Load custom categories from localStorage
                const storedCustomCategories = localStorage.getItem('customCategories');
                if (storedCustomCategories) {
                    try {
                        this.customCategories = ErrorHandler.safeJSONParse(storedCustomCategories, []);
                        this.updateExpenseCategories();
                    } catch (e) {
                        ErrorHandler.handle(e, 'loadCustomCategories');
                        this.customCategories = [];
                    }
                }
                
                this.updateTotalExpenses();
                this.updateDeductions();
                this.updateUpcomingDeductions();
            },
            
            validateExpenses(expenses) {
                if (!Array.isArray(expenses)) return [];
                
                return expenses.filter(exp => {
                    // Validate required fields
                    if (!exp.name || typeof exp.name !== 'string') return false;
                    if (typeof exp.amount !== 'number' || exp.amount <= 0) return false;
                    if (!['daily', 'weekly', 'fortnightly', 'monthly', 'quarterly', 'yearly'].includes(exp.frequency)) return false;
                    
                    // Validate optional fields
                    if (exp.dayOfMonth && (typeof exp.dayOfMonth !== 'number' || exp.dayOfMonth < 1 || exp.dayOfMonth > 31)) {
                        exp.dayOfMonth = 1;
                    }
                    
                    return true;
                });
            },
            
            switchPage(page) {
                this.currentPage = page;
                if (page === 'analytics') {
                    this.$nextTick(() => {
                        this.createCharts();
                    });
                }
            },
            
            // ===== SAVINGS TRACKING =====
            calculateYearlySavings() {
                const fortnightly = parseFloat(this.savingsTracking.fortnightly) || 0;
                const monthly = parseFloat(this.savingsTracking.monthly) || 0;
                
                // Validation: Check if at least one value is entered
                if (fortnightly === 0 && monthly === 0) {
                    this.displayError('Please enter at least one savings amount.');
                    return;
                }
                
                // Validation: Check if amounts are non-negative
                if (fortnightly < 0 || monthly < 0) {
                    this.displayError('Savings amounts cannot be negative.');
                    return;
                }
                
                const yearlyFortnightly = fortnightly * 26;
                const yearlyMonthly = monthly * 12;
                this.savingsTracking.yearlySavings = yearlyFortnightly + yearlyMonthly;
                
                // Announce result for accessibility
                const announcement = `Your yearly savings is ${this.formatCurrency(this.savingsTracking.yearlySavings)}. Fortnightly: ${this.formatCurrency(fortnightly)} × 26 weeks = ${this.formatCurrency(yearlyFortnightly)}, Monthly: ${this.formatCurrency(monthly)} × 12 months = ${this.formatCurrency(yearlyMonthly)}`;
                document.getElementById('sr-announcements')?.setAttribute('data-timestamp', Date.now().toString());
                document.getElementById('sr-announcements').textContent = announcement;
                
                this.displaySuccess(`Your yearly savings: ${this.formatCurrency(this.savingsTracking.yearlySavings)}`);
            },
            
            calculateInterest() {
                const principal = parseFloat(this.interestCalculator.principal) || 0;
                const rate = parseFloat(this.interestCalculator.rate) || 0;
                const yearsToCalculate = parseInt(this.interestCalculator.yearsToCalculate) || 1;
                const fortnightlyContribution = parseFloat(this.interestCalculator.fortnightlyContribution) || 0;
                const monthlyContribution = parseFloat(this.interestCalculator.monthlyContribution) || 0;
                const compoundingFrequency = this.interestCalculator.compoundingFrequency || 'monthly';
                
                // Validation: Check if principal is entered
                if (principal === 0 && fortnightlyContribution === 0 && monthlyContribution === 0) {
                    this.displayError('Please enter at least a principal amount or contribution.');
                    return;
                }
                
                // Validation: Check for valid interest rate
                if (rate > 100) {
                    this.displayError('Interest rate cannot exceed 100%.');
                    return;
                }
                
                // Validation: Check if amounts are non-negative
                if (principal < 0 || rate < 0 || fortnightlyContribution < 0 || monthlyContribution < 0 || yearsToCalculate < 1) {
                    this.displayError('All amounts must be positive.');
                    return;
                }
                
                // Validation: Check years is reasonable
                if (yearsToCalculate > 100) {
                    this.displayError('Years to calculate cannot exceed 100.');
                    return;
                }
                
                // Determine compounding frequency
                const frequencyMap = {
                    'monthly': { periods: 12, label: 'monthly' },
                    'quarterly': { periods: 4, label: 'quarterly' },
                    'semiannual': { periods: 2, label: 'semi-annually' },
                    'annual': { periods: 1, label: 'annually' }
                };
                
                const frequency = frequencyMap[compoundingFrequency] || frequencyMap.monthly;
                const periodsPerYear = frequency.periods;
                const periodicRate = (rate / 100) / periodsPerYear;
                
                // Calculate total periods
                const totalPeriods = yearsToCalculate * periodsPerYear;
                
                // Calculate monthly contribution for period contribution
                // Contributions are added at each compounding period
                const fortnightlyForPeriod = fortnightlyContribution * (26 / periodsPerYear);
                const monthlyForPeriod = monthlyContribution * (12 / periodsPerYear);
                const contributionPerPeriod = fortnightlyForPeriod + monthlyForPeriod;
                
                // Calculate annual contribution for display
                const yearlyFortnightly = fortnightlyContribution * 26;
                const yearlyMonthly = monthlyContribution * 12;
                const annualContribution = yearlyFortnightly + yearlyMonthly;
                
                // Build year-by-year accumulation breakdown using period-based calculation
                this.interestCalculator.accumulationBreakdown = [];
                let currentBalance = principal;
                let periodCounter = 0;
                
                for (let year = 1; year <= yearsToCalculate; year++) {
                    const yearStartBalance = currentBalance;
                    let yearInterest = 0;
                    let yearContributions = 0;
                    
                    // Process each compounding period in this year
                    for (let period = 0; period < periodsPerYear; period++) {
                        periodCounter++;
                        
                        // Calculate interest on current balance
                        const interestThisPeriod = currentBalance * periodicRate;
                        yearInterest += interestThisPeriod;
                        currentBalance = currentBalance + interestThisPeriod;
                        
                        // Add contribution for this period
                        currentBalance = currentBalance + contributionPerPeriod;
                        yearContributions += contributionPerPeriod;
                    }
                    
                    // Store year breakdown
                    this.interestCalculator.accumulationBreakdown.push({
                        year: year,
                        openingBalance: yearStartBalance,
                        interestEarned: yearInterest,
                        contributions: yearContributions,
                        closingBalance: currentBalance
                    });
                }
                
                // Store the final amount after all years
                this.interestCalculator.totalSavings = currentBalance;
                this.interestCalculator.annualTotalSavings = annualContribution;
                
                // Announce result for accessibility
                const announcement = `Your savings projection with ${frequency.label} compounding: In ${yearsToCalculate} year${yearsToCalculate > 1 ? 's' : ''}, your ${this.formatCurrency(principal)} initial investment with ${this.formatCurrency(annualContribution)} annual contributions at ${rate}% interest will grow to ${this.formatCurrency(this.interestCalculator.totalSavings)}.`;
                document.getElementById('sr-announcements')?.setAttribute('data-timestamp', Date.now().toString());
                if (document.getElementById('sr-announcements')) {
                    document.getElementById('sr-announcements').textContent = announcement;
                }
                
                this.displaySuccess(`Your savings in ${yearsToCalculate} year${yearsToCalculate > 1 ? 's' : ''} (${frequency.label} compounding): ${this.formatCurrency(this.interestCalculator.totalSavings)}`);
            },
            
            // ===== EXPENSE TEMPLATES =====
            toggleTemplates() {
                this.showTemplates = !this.showTemplates;
            },
            
            applyTemplate(template) {
                this.newExpense = {
                    name: template.name,
                    amount: template.amount.toString(),
                    frequency: template.frequency,
                    day: template.day || 'monday',
                    dayOfMonth: template.dayOfMonth || 1,
                    category: template.category,
                    startDate: new Date().toISOString().split('T')[0],
                    notes: ''
                };
                this.showTemplates = false;
                this.displaySuccess('Template applied! Review and save.');
                
                // Scroll to form
                const formCard = document.querySelector('.expense-form-card');
                if (formCard) formCard.scrollIntoView({ behavior: 'smooth' });
            },
            
            // ===== CATEGORY MANAGEMENT =====
            toggleCategoryManager() {
                this.showCategoryManager = !this.showCategoryManager;
                if (this.showCategoryManager) {
                    this.loadCustomCategories();
                }
            },
            
            loadCustomCategories() {
                const stored = localStorage.getItem('customCategories');
                if (stored) {
                    try {
                        this.customCategories = JSON.parse(stored);
                    } catch (e) {
                        this.customCategories = [];
                    }
                }
            },
            
            saveCustomCategories() {
                localStorage.setItem('customCategories', JSON.stringify(this.customCategories));
            },
            
            startAddCategory() {
                this.editingCategory = null;
                this.newCategory = {
                    name: '',
                    color: '#636e72',
                    icon: 'ellipsis-h'
                };
            },
            
            startEditCategory(category) {
                this.editingCategory = category;
                this.newCategory = {
                    name: category.name,
                    color: category.color,
                    icon: category.icon
                };
            },
            
            saveCategory() {
                if (!this.newCategory.name || !this.newCategory.name.trim()) {
                    this.displayError('Please enter a category name.');
                    return;
                }
                
                // Check for duplicate names
                const existingNames = this.expenseCategories.map(c => c.name.toLowerCase());
                if (this.editingCategory) {
                    // Allow same name if editing the same category
                    const isSameCategory = this.customCategories.find(c => 
                        c.id === this.editingCategory.id && c.name.toLowerCase() === this.newCategory.name.toLowerCase()
                    );
                    if (!isSameCategory && existingNames.includes(this.newCategory.name.toLowerCase())) {
                        this.displayError('A category with this name already exists.');
                        return;
                    }
                } else if (existingNames.includes(this.newCategory.name.toLowerCase())) {
                    this.displayError('A category with this name already exists.');
                    return;
                }
                
                if (this.editingCategory) {
                    // Update existing category
                    const index = this.customCategories.findIndex(c => c.id === this.editingCategory.id);
                    if (index >= 0) {
                        this.$set(this.customCategories, index, {
                            ...this.customCategories[index],
                            name: this.newCategory.name.trim(),
                            color: this.newCategory.color,
                            icon: this.newCategory.icon
                        });
                    }
                    this.displaySuccess('Category updated!');
                } else {
                    // Add new category
                    const newCat = {
                        id: 'custom_' + generateId(),
                        name: this.newCategory.name.trim(),
                        color: this.newCategory.color,
                        icon: this.newCategory.icon,
                        isCustom: true
                    };
                    this.customCategories.push(newCat);
                    this.displaySuccess('Category added!');
                }
                
                this.saveCustomCategories();
                this.updateExpenseCategories();
                this.editingCategory = null;
                this.newCategory = {
                    name: '',
                    color: '#636e72',
                    icon: 'ellipsis-h'
                };
            },
            
            deleteCategory(categoryId) {
                this.showConfirmationModal(
                    'Delete Category',
                    'Are you sure you want to delete this category? Expenses using this category will be moved to "Other".',
                    () => {
                        // Move expenses to "Other"
                        this.expenses.forEach(expense => {
                            if (expense.category === categoryId) {
                                expense.category = 'other';
                            }
                        });
                        this.saveExpenses();
                        
                        // Remove from custom categories
                        const index = this.customCategories.findIndex(c => c.id === categoryId);
                        if (index >= 0) {
                            this.customCategories.splice(index, 1);
                        }
                        this.saveCustomCategories();
                        this.updateExpenseCategories();
                        
                        this.displaySuccess('Category deleted!');
                    }
                );
            },
            
            cancelCategoryEdit() {
                this.editingCategory = null;
                this.newCategory = {
                    name: '',
                    color: '#636e72',
                    icon: 'ellipsis-h'
                };
            },
            
            updateExpenseCategories() {
                // Combine default and custom categories
                const defaultCategories = [
                    { id: 'food', name: 'Food & Dining', icon: 'utensils', color: '#ff6b6b' },
                    { id: 'transport', name: 'Transportation', icon: 'car', color: '#4ecdc4' },
                    { id: 'shopping', name: 'Shopping', icon: 'shopping-bag', color: '#45b7d1' },
                    { id: 'entertainment', name: 'Entertainment', icon: 'film', color: '#f9ca24' },
                    { id: 'bills', name: 'Bills & Utilities', icon: 'bolt', color: '#6c5ce7' },
                    { id: 'health', name: 'Health & Fitness', icon: 'heartbeat', color: '#fd79a8' },
                    { id: 'education', name: 'Education', icon: 'graduation-cap', color: '#00b894' },
                    { id: 'travel', name: 'Travel', icon: 'plane', color: '#a29bfe' },
                    { id: 'subscriptions', name: 'Subscriptions', icon: 'repeat', color: '#e17055' },
                    { id: 'other', name: 'Other', icon: 'ellipsis-h', color: '#636e72' }
                ];
                
                this.expenseCategories = [...defaultCategories, ...this.customCategories];
            },
            
            // ===== SETTINGS PAGE METHODS =====
            exportData() {
                try {
                    const exportData = {
                        budget: this.budget,
                        budgetEnabled: this.budgetEnabled,
                        expenses: this.expenses,
                        currency: this.currency,
                        categoryBudgets: this.categoryBudgets,
                        spendingHistory: this.spendingHistory,
                        customCategories: this.customCategories,
                        templates: this.templates,
                        theme: localStorage.getItem('theme') || 'light',
                        primaryColor: localStorage.getItem('primaryColor') || '#007bff',
                        timestamp: new Date().toISOString(),
                        version: '3.0',
                        exportedBy: 'Budget Expense Tracker'
                    };

                    const dataStr = JSON.stringify(exportData, null, 2);
                    const blob = new Blob([dataStr], { type: 'application/json' });
                    const link = document.createElement('a');

                    if (link.download !== undefined) {
                        const url = URL.createObjectURL(blob);
                        link.setAttribute('href', url);
                        link.setAttribute('download', 'budget_expense_tracker_export_' + new Date().toISOString().split('T')[0] + '.json');
                        link.style.visibility = 'hidden';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                        this.displaySuccess('Data exported successfully!');
                    } else {
                        this.displayError('Export not supported in this browser.');
                    }
                } catch (error) {
                    console.error('Export error:', error);
                    this.displayError('Error exporting data. Please try again.');
                }
            },
            
            importData(event) {
                const file = event.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        
                        // Validate the file structure
                        if (!data.version && !data.expenses) {
                            this.displayError('Invalid backup file format.');
                            return;
                        }
                        
                        // Restore data
                        if (data.budget !== undefined) {
                            this.budget = parseFloat(data.budget);
                            localStorage.setItem('budget', this.budget.toString());
                        }
                        
                        if (data.budgetEnabled !== undefined) {
                            this.budgetEnabled = data.budgetEnabled === true || data.budgetEnabled === 'true';
                            localStorage.setItem('budgetEnabled', this.budgetEnabled.toString());
                        }
                        
                        if (data.expenses && Array.isArray(data.expenses)) {
                            this.expenses = data.expenses.map(exp => ({
                                ...exp,
                                id: exp.id || generateId(),
                                notes: exp.notes || '',
                                dayOfMonth: exp.dayOfMonth || null
                            }));
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
                        
                        if (data.customCategories) {
                            this.customCategories = data.customCategories;
                            localStorage.setItem('customCategories', JSON.stringify(this.customCategories));
                            this.updateExpenseCategories();
                        }
                        
                        if (data.templates) {
                            this.templates = data.templates;
                            localStorage.setItem('templates', JSON.stringify(this.templates));
                        }
                        
                        if (data.currency) {
                            this.currency = data.currency;
                            localStorage.setItem('currency', this.currency);
                        }
                        
                        if (data.theme) {
                            localStorage.setItem('theme', data.theme);
                            document.documentElement.setAttribute('data-theme', data.theme);
                        }
                        
                        if (data.primaryColor) {
                            localStorage.setItem('primaryColor', data.primaryColor);
                            applyPrimaryColor(data.primaryColor);
                        }
                        
                        this.updateTotalExpenses();
                        this.updateDeductions();
                        this.updateUpcomingDeductions();
                        this.displaySuccess('Data imported successfully!');
                    } catch (error) {
                        console.error('Import error:', error);
                        this.displayError('Error importing data. Invalid backup file.');
                    }
                };
                reader.readAsText(file);
                event.target.value = '';
            },
            
            clearAllData() {
                this.showConfirmationModal(
                    'Clear All Data',
                    'Are you sure you want to delete all data? This will remove all expenses, budgets, templates, and settings. This action cannot be undone.',
                    () => {
                        // Clear all data
                        this.budget = 0;
                        this.budgetEnabled = true;
                        this.expenses = [];
                        this.categoryBudgets = {};
                        this.spendingHistory = [];
                        this.customCategories = [];
                        this.templates = [];
                        this.resetBudgetAlerts();
                        
                        // Clear localStorage
                        localStorage.removeItem('budget');
                        localStorage.removeItem('budgetEnabled');
                        localStorage.removeItem('expenses');
                        localStorage.removeItem('categoryBudgets');
                        localStorage.removeItem('spendingHistory');
                        localStorage.removeItem('customCategories');
                        localStorage.removeItem('templates');
                        
                        // Update UI
                        this.updateTotalExpenses();
                        this.updateDeductions();
                        this.updateUpcomingDeductions();
                        this.updateExpenseCategories();
                        
                        this.displaySuccess('All data cleared successfully!');
                    }
                );
            },
            
            editCategory(category) {
                this.editingCategory = category;
                this.newCategory = {
                    name: category.name,
                    color: category.color,
                    icon: category.icon
                };
                this.showAddCategoryModal = true;
            },
            
            closeCategoryModal() {
                this.showAddCategoryModal = false;
                this.editingCategory = null;
                this.newCategory = {
                    name: '',
                    color: '#636e72',
                    icon: 'ellipsis-h'
                };
            },
            
            getStorageUsed() {
                let total = 0;
                for (let key in localStorage) {
                    if (localStorage.hasOwnProperty(key)) {
                        total += localStorage.getItem(key).length * 2; // UTF-16 encoding
                    }
                }
                
                // Convert to human-readable format
                if (total < 1024) {
                    return total + ' bytes';
                } else if (total < 1024 * 1024) {
                    return (total / 1024).toFixed(2) + ' KB';
                } else {
                    return (total / (1024 * 1024)).toFixed(2) + ' MB';
                }
            },
            
            // ===== TEMPLATE METHODS =====
            saveAsTemplate(expense) {
                const template = {
                    name: expense.name,
                    amount: expense.amount,
                    frequency: expense.frequency,
                    category: expense.category,
                    day: expense.day,
                    dayOfMonth: expense.dayOfMonth
                };
                
                this.templates.push(template);
                localStorage.setItem('templates', JSON.stringify(this.templates));
                this.displaySuccess('Template saved!');
            },
            
            applyTemplate(template) {
                this.newExpense = {
                    name: template.name,
                    amount: template.amount.toString(),
                    frequency: template.frequency,
                    day: template.day || 'monday',
                    dayOfMonth: template.dayOfMonth || 1,
                    category: template.category,
                    startDate: new Date().toISOString().split('T')[0],
                    notes: ''
                };
                this.switchPage('expenses');
                this.displaySuccess('Template applied! Review and save.');
            },
            
            deleteTemplate(index) {
                this.templates.splice(index, 1);
                localStorage.setItem('templates', JSON.stringify(this.templates));
                this.displaySuccess('Template deleted!');
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

                // Date range filter
                if (this.dateFilterFrom) {
                    const fromDate = new Date(this.dateFilterFrom);
                    filtered = filtered.filter(expense => {
                        const expenseDate = new Date(expense.startDate || '1970-01-01');
                        return expenseDate >= fromDate;
                    });
                }

                if (this.dateFilterTo) {
                    const toDate = new Date(this.dateFilterTo);
                    toDate.setHours(23, 59, 59, 999); // Include entire day
                    filtered = filtered.filter(expense => {
                        const expenseDate = new Date(expense.startDate || '1970-01-01');
                        return expenseDate <= toDate;
                    });
                }

                // Amount range filter
                if (this.amountFilterMin) {
                    const minAmount = parseFloat(this.amountFilterMin) || 0;
                    filtered = filtered.filter(expense => parseFloat(expense.amount) >= minAmount);
                }

                if (this.amountFilterMax) {
                    const maxAmount = parseFloat(this.amountFilterMax) || Infinity;
                    filtered = filtered.filter(expense => parseFloat(expense.amount) <= maxAmount);
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
            },
            monthlyTrends() {
                return this.getMonthlyTrends(6);
            },
            categoryTrends() {
                return this.getCategoryTrends();
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
            this.initKeyboardShortcuts();
            
            // Reinitialize settings controls after Vue is fully mounted
            this.$nextTick(() => {
                console.log('Vue fully mounted, finalizing settings controls...');
                initSettingsAppearance();
            });
        },
        
        // ===== KEYBOARD SHORTCUTS =====
        initKeyboardShortcuts() {
            document.addEventListener('keydown', (e) => {
                // Skip if user is typing in an input field (with exceptions)
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                    // Allow some shortcuts even in inputs
                    if (e.key === 'Escape') {
                        e.target.blur();
                        return;
                    }
                    // Allow Ctrl+Z (undo) in inputs
                    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                        // Let browser handle undo in inputs
                        return;
                    }
                    // Allow Ctrl+S (save) globally
                    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                        // Will be handled below
                    } else {
                        return;
                    }
                }
                
                // Escape - Close modal
                if (e.key === 'Escape' && this.confirmModal.show) {
                    this.closeConfirmModal();
                    return;
                }
                
                // Ctrl/Cmd + E - Add new expense
                if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                    e.preventDefault();
                    this.switchPage('expenses');
                    this.$nextTick(() => {
                        const nameInput = document.getElementById('expense-name');
                        if (nameInput) {
                            nameInput.focus();
                            nameInput.select();
                            AccessibilityUtils.announce('Ready to add new expense', 'polite');
                        }
                    });
                    return;
                }
                
                // Ctrl/Cmd + Z - Undo last action
                if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                    e.preventDefault();
                    if (this.lastDeleted && this.lastDeleted.expense) {
                        this.undoDelete();
                    } else if (this.isEditing) {
                        this.resetNewExpense();
                        AccessibilityUtils.announce('Edit cancelled', 'polite');
                    } else {
                        AccessibilityUtils.announce('Nothing to undo', 'polite');
                    }
                    return;
                }
                
                // Ctrl/Cmd + N - New expense (focus name input)
                if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                    e.preventDefault();
                    const nameInput = document.getElementById('expense-name');
                    if (nameInput) {
                        nameInput.focus();
                        AccessibilityUtils.announce('Focus moved to expense name input', 'polite');
                    }
                    return;
                }
                
                // Ctrl/Cmd + B - Focus budget input
                if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                    e.preventDefault();
                    const budgetInput = document.getElementById('budget-input');
                    if (budgetInput) {
                        budgetInput.focus();
                        budgetInput.select();
                        AccessibilityUtils.announce('Focus moved to budget input', 'polite');
                    }
                    return;
                }
                
                // Ctrl/Cmd + S - Save/backup data
                if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                    e.preventDefault();
                    this.backupData();
                    return;
                }
                
                // Ctrl/Cmd + / - Toggle theme
                if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                    e.preventDefault();
                    const html = document.documentElement;
                    const currentTheme = html.getAttribute('data-theme');
                    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                    html.setAttribute('data-theme', newTheme);
                    localStorage.setItem('theme', newTheme);
                    
                    // Update settings toggle if it exists
                    const settingsToggle = document.getElementById('settings-theme-toggle');
                    if (settingsToggle) {
                        settingsToggle.setAttribute('aria-pressed', newTheme === 'dark' ? 'true' : 'false');
                    }
                    AccessibilityUtils.announce(`Theme switched to ${newTheme}`, 'polite');
                    return;
                }
                
                // 1-4 - Switch pages
                if (e.key === '1') {
                    this.switchPage('dashboard');
                    AccessibilityUtils.announce('Switched to Dashboard', 'polite');
                } else if (e.key === '2') {
                    this.switchPage('expenses');
                    AccessibilityUtils.announce('Switched to Expenses', 'polite');
                } else if (e.key === '3') {
                    this.switchPage('analytics');
                    AccessibilityUtils.announce('Switched to Analytics', 'polite');
                } else if (e.key === '4') {
                    this.switchPage('settings');
                    AccessibilityUtils.announce('Switched to Settings', 'polite');
                }
                
                // ? - Show keyboard shortcuts help
                if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
                    this.showKeyboardShortcutsHelp();
                }
            });
        },
        
        showKeyboardShortcutsHelp() {
            const shortcuts = [
                { key: 'Ctrl/Cmd + E', action: 'Add new expense' },
                { key: 'Ctrl/Cmd + Z', action: 'Undo last action' },
                { key: 'Ctrl/Cmd + N', action: 'Focus expense name input' },
                { key: 'Ctrl/Cmd + B', action: 'Focus budget input' },
                { key: 'Ctrl/Cmd + S', action: 'Backup data' },
                { key: 'Ctrl/Cmd + /', action: 'Toggle dark/light theme' },
                { key: '1-4', action: 'Switch between pages' },
                { key: '?', action: 'Show this help' },
                { key: 'Escape', action: 'Close modals or blur inputs' }
            ];
            
            let message = 'Keyboard Shortcuts:\n\n';
            shortcuts.forEach(s => {
                message += s.key + ' - ' + s.action + '\n';
            });
            
            alert(message);
        }
    });
});