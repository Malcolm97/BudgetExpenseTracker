# 💰 Budget Expense Tracker

A professional, production-optimized budget management webapp to track expenses and manage budgets effectively.

**Status:** ✅ Production Ready (v2.0 Optimized)  
**Last Updated:** March 1, 2026

---

## ✨ Features

### Core Functionality
- 📊 **Dashboard** - Real-time budget overview and spending summary
- 💸 **Expense Management** - Add, edit, delete, and categorize expenses
- 📈 **Analytics** - Interactive charts and spending trends
- 💡 **Savings Tracker** - Calculate savings goals and compound interest
- ⚙️ **Settings** - Customize theme, colors, and data management

### Advanced Features
- 🌙 **Dark/Light Mode** - Theme toggle with custom color picker
- 📱 **Progressive Web App** - Install as app, offline support
- 💾 **Auto-Save** - Automatic data persistence to localStorage
- 🔐 **Data Privacy** - Local-only storage, no server uploads
- 🎨 **Responsive Design** - Works on desktop, tablet, mobile
- ♿ **Accessibility** - ARIA labels, keyboard navigation, screen reader support

### Security & Performance (v2.0 Updates)
- 🛡️ **Input Sanitization** - XSS prevention with InputSanitizer utility
- ⚡ **Performance Optimized** - Debouncing, throttling, efficient rendering
- 📦 **Storage Quota Management** - Smart handling of localStorage limits
- 🔍 **Production Logging** - Controlled debug output with ENABLE_DEBUG flag
- ⚠️ **Enhanced Error Handling** - Graceful error recovery with user feedback

---

## 🚀 Quick Start

### Option 1: Direct Browser Access
1. Download the repository files
2. Open `index.html` directly in your browser
3. Start tracking expenses immediately

### Option 2: Local Server
```bash
# Using Python (built-in task)
python -m http.server 8080

# Then visit: http://localhost:8080
```

---

## 📖 Usage Guide

### Dashboard
- View total budget, spent amount, and remaining balance
- Quick stats on monthly spending
- Expense breakdown by category

### Adding Expenses
1. Click "Add Expense" button
2. Enter expense name, amount, category, date
3. Add optional notes
4. Click "Save Expense"
5. Data auto-saves to local storage

### Expense Management
- **Edit:** Click the edit icon on any expense
- **Delete:** Click the trash icon (with confirmation)
- **Filter:** Use the search and filter options
- **Sort:** Click column headers to sort

### Analytics Dashboard
- **View Charts:** Pie chart for category breakdown, line chart for trends
- **Date Range:** Select custom date ranges for analysis
- **Export Data:** Download expense reports (via settings)

### Savings Tracker
- **Calculate Savings Goal:** Input target amount and timeframe
- **Interest Calculator:** Calculate compound interest on savings
- **View Breakdown:** See detailed savings calculations

### Settings
- **Theme:** Toggle dark/light mode
- **Colors:** Customize primary and accent colors
- **Data:** Import/export/clear data
- **Categories:** Add, edit, or remove expense categories

---

## 🏗️ Project Structure

```
BudgetExpenseTracker/
├── index.html           (1,321 lines) - Single-page app with all 5 pages
├── script.js            (3,361 lines) - Vue instance + utilities
├── styles.css           (3,608 lines) - Complete styling & animations
├── service-worker.js    - Offline support & caching
├── manifest.json        - PWA configuration
├── OPTIMIZATION_GUIDE.md - Complete optimization documentation
├── README.md            - This file
└── icons/               - App icons for PWA

Total: ~8,157 lines of optimized code
```

---

## 🔧 Technology Stack

- **Frontend:** Vue 2.x (CDN)
- **Charts:** Chart.js
- **Storage:** localStorage + IndexedDB
- **PWA:** Service Worker + manifest.json
- **Styling:** Vanilla CSS (3,600+ lines)
- **Browser Support:** Chrome, Firefox, Safari, Edge (latest versions + 1)

---

## 💾 Data Storage

All data is stored **locally** in your browser's localStorage:

**Storage Details:**
- Default quota: 5-10 MB (varies by browser)
- No data sent to external servers
- Persists across browser sessions
- Can be cleared from Settings → Data Management

**What's Stored:**
- Budget configuration
- All expenses (with timestamps)
- Savings goals and calculations
- User preferences (theme, colors, categories)
- Analytics data

---

## 🔒 Security

### Input Protection
- All user inputs sanitized to prevent XSS attacks
- HTML special characters escaped
- Input length limited to 500 characters
- Number validation for financial data

### Data Safety
- localStorage quota monitoring prevents data loss
- Try-catch error handling for all operations
- Validation before storing any data
- Graceful fallbacks for failed operations

### Example: Safe Input
```javascript
// Internally uses InputSanitizer to prevent attacks
const expense = {
    name: sanitizeText(userInput),      // Removes HTML tags
    amount: sanitizeNumber(userInput),  // Validates numeric value
    notes: sanitizeText(userInput)      // Sanitizes user notes
};
```

---

## ⚡ Performance Optimizations (v2.0)

### Metrics
| Feature | Implementation | Impact |
|---------|---|---|
| Debug Logs | Conditional logging (ENABLE_DEBUG) | 100% reduction in production |
| Search | Debounced (300ms) | Smoother interactions |
| Storage | Quota checking + error handling | Prevents data loss |
| Rendering | Vue optimization + CSS transitions | Faster page loads |
| Input | Sanitization + validation | XSS prevention |

### Utilities Added
- **Logger** - Production-safe console wrapper
- **InputSanitizer** - XSS prevention and validation
- **StorageUtils** - Quota management and safe storage
- **PerformanceUtils** - Debounce, throttle, RAF helpers

---

## 📱 Offline & PWA Features

### Offline Support
- Service worker caches all assets
- Full app functionality works offline
- Data syncs when connection restored

### Install as App
- Click the install button (appears in compatible browsers)
- Adds app to home screen
- Works like native app
- Includes app icons and splash screen

---

## 🎯 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Tab` | Navigate between fields |
| `Enter` | Submit form |
| `Escape` | Close modal/dialog |
| `Ctrl+A` | Select all text |

---

## 🐛 Troubleshooting

### Data Not Saving
1. Check browser's localStorage is enabled
2. Verify storage quota isn't exceeded (Settings → Data Management)
3. Try clearing browser cache and reloading
4. Check browser console for errors

### Charts Not Displaying
1. Ensure Chart.js library loads (check network tab)
2. Try refreshing the page
3. Clear browser cache

### Service Worker Issues
1. Check if browser supports service workers
2. Try uninstalling and reinstalling the app
3. Clear service worker cache in DevTools

### Theme Not Persisting
1. Ensure localStorage is enabled
2. Check if browser is in private/incognito mode (disables storage)
3. Try clearing site data and reloading

---

## 📚 Documentation

- **[OPTIMIZATION_GUIDE.md](./OPTIMIZATION_GUIDE.md)** - Complete optimization details, future recommendations, and performance metrics
- **[QUICK_START.md](./QUICK_START.md)** - Quick reference guide
- **[IMPROVEMENTS.md](./IMPROVEMENTS.md)** - Detailed improvement list

---

## 🔄 Updates & Improvements

### v2.0 (Current)
- ✅ Savings page merged into index.html
- ✅ Production logging system added
- ✅ Input sanitization implemented
- ✅ Storage quota management
- ✅ Performance utilities (debounce, throttle)
- ✅ Enhanced error handling
- ✅ Loading states and animations
- ✅ Comprehensive optimization guide

### v1.0 (Initial Release)
- Dashboard, Expenses, Analytics, Savings, Settings pages
- Dark/light theme
- Responsive design
- PWA installation
- Offline support

---

## 🚦 Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Latest 2 versions |
| Firefox | ✅ Full | Latest 2 versions |
| Safari | ✅ Full | iOS 12+, macOS 10.14+ |
| Edge | ✅ Full | Latest 2 versions |
| IE 11 | ❌ Not supported | Use modern browser |

---

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

---

## 🤝 Contributing

Suggestions and improvements welcome! Please refer to `OPTIMIZATION_GUIDE.md` for recommended enhancements.

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review OPTIMIZATION_GUIDE.md for technical details
3. Check browser console for error messages
4. Verify all files are in the project directory

---

**Made with ❤️ for budget-conscious developers**

