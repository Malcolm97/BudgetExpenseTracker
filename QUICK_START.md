# Budget Expense Tracker - Quick Reference Guide

## Getting Started

### Opening the App
1. Open a web browser
2. Go to `http://localhost:8081` (or your server URL)
3. App loads instantly (PWA-enabled)

### First Steps
1. Navigate to **Dashboard** tab
2. Toggle "Budget Tracking" ON
3. Enter your monthly budget amount
4. Click "Set Budget"
5. Go to **Expenses** tab to add your first expense

---

## Features Overview

### 📊 Dashboard
- Budget status overview
- Spending summary
- Recent expenses
- Upcoming reminders
- Spending insights

### 💰 Expenses
- Add new expenses
- Edit existing expenses
- Delete expenses (with undo)
- Search and filter expenses
- Sort by date, amount, or name
- Backup/Restore data
- **Export to CSV** (NEW!)

### 📈 Analytics
- Spending charts
- Category breakdown
- Average expenses
- Trend analysis

### ⚙️ Settings
- Dark mode toggle
- Color customization
- Currency selection

---

## Adding Expenses

### Basic Entry
1. Go to **Expenses** tab
2. Fill in expense details:
   - **Name:** What you're paying for
   - **Amount:** How much in USD/EUR/etc
   - **Frequency:** How often (daily, weekly, monthly, etc)
   - **Category:** What type of expense
   - **Start Date:** When this expense began
   - **Notes:** Optional details

3. Click "Add Expense"

### Frequency Types
- **Daily:** Repeats every single day
- **Weekly:** Repeats every 7 days
- **Fortnightly:** Repeats every 2 weeks
- **Monthly:** Repeats once per month (select day)
- **Quarterly:** Repeats every 3 months
- **Yearly:** Repeats once per year

### Monthly Equivalents (What You See)
- Daily $100 = $3,043.75/month
- Weekly $100 = $434.21/month
- Fortnightly $100 = $217.41/month
- Monthly $100 = $100.00/month
- Quarterly $100 = $33.33/month
- Yearly $100 = $8.33/month

---

## Budget Tracking

### Setting a Budget
1. Go to **Dashboard**
2. Toggle "Budget Tracking" ON
3. Enter monthly budget amount
4. Click "Set Budget"

### Understanding Alerts
- **50% Used:** You've spent half your budget
- **75% Used:** Budget 3/4 depleted, be careful
- **90% Used:** Only 10% of budget remaining
- **100% Exceeded:** Over budget, need to adjust

### Alerts Include
✓ Amount exceeded or remaining
✓ Percentage of budget used
✓ Currency symbols
✓ Visual color coding (red/yellow/green)

---

## Managing Expenses

### Search & Filter
1. Use "Search" box to find expenses by name/notes
2. Filter by category dropdown
3. Filter by frequency dropdown
4. Sort by: date, amount, or name

### Clear Filters
Click "Clear Filters" button to reset all searches

### Edit Expense
1. Find the expense
2. Click the pencil icon
3. Modify details
4. Click "Update Expense"

### Delete Expense
1. Find the expense
2. Click the trash icon
3. Click "Undo" in notification to restore
4. Or wait 5 seconds for permanent deletion

---

## Data Management

### Backup Your Data
1. Go to **Expenses** tab
2. Click "Backup" button
3. File downloads as `budget_backup_YYYY-MM-DD.json`
4. Save in safe location

### Restore from Backup
1. Go to **Expenses** tab
2. Click "Restore" button
3. Select your `.json` backup file
4. Data restores (overwrites current data)

### Export to CSV
1. Go to **Expenses** tab
2. Click "Export CSV" button
3. File downloads as `expenses_YYYY-MM-DD.csv`
4. Open in Excel, Google Sheets, etc

### Clear All Expenses
⚠️ **WARNING:** This deletes ALL expenses permanently
1. Go to **Expenses** tab
2. Click "Clear All" button
3. Confirm deletion
4. All expenses removed from app

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl/Cmd + N | Focus on expense name input |
| Ctrl/Cmd + B | Focus on budget input |
| Escape | Close dialogs/modals |

*Tip: Only works when NOT typing in an input field*

---

## Dark Mode & Colors

### Toggle Dark Mode
1. Go to **Settings** tab
2. Find "Appearance" section
3. Toggle "Dark Mode" ON/OFF

### Change App Color
1. Go to **Settings** tab
2. Find "Color Theme" section
3. Choose from preset colors:
   - Blue, Hot Pink, Creamy Pink, Green, Purple, Orange, Teal, Pink
4. Or pick custom color with color wheel

---

## Analytics

### Charts Available
- **Category Breakdown** (Pie chart)
- **Frequency Distribution** (Bar chart)
- **Spending Trends** (Line chart)

### Statistics Shown
- Total monthly expenses
- Number of expenses
- Average expense amount
- Highest expense
- Lowest expense
- Daily average
- Weekly average

### Insights Features
- Budget status alerts
- Highest expense categories
- Spending trends (increasing/decreasing)
- Top spending category

---

## Tips & Tricks

### Best Practices
1. **Consistent entries:** Use same names for recurring expenses
2. **Regular backups:** Backup data weekly
3. **Review monthly:** Check analytics every month
4. **Adjust budget:** Update budget if circumstances change
5. **Use categories:** Helps identify spending patterns

### Performance Tips
1. Archive old expenses periodically
2. Use filters to reduce visible items
3. Clear old backup files
4. Use export to move old data out

### Accuracy Tips
- Enter exact amounts (includes cents)
- Double-check frequency settings
- Verify monthly equivalent calculations
- Keep expense names consistent

---

## Troubleshooting

### App Won't Load
- Clear browser cache (Ctrl+Shift+Delete)
- Try incognito/private mode
- Check internet connection
- Disable browser extensions

### Data Lost
- Check browser localStorage isn't full
- Use backup to restore
- Try another browser
- Check if app is in offline mode

### Calculations Wrong
- Check frequency setting (daily vs monthly)
- Verify amount entered correctly
- Look at monthly equivalent display
- Check for decimal point errors

### Alerts Not Working
- Refresh the page (F5)
- Check budget is enabled
- Verify budget amount is set
- Check notification permissions

---

## Storage & Limits

### Data Storage
- All data stored in browser's localStorage
- Syncs across tabs in same browser
- NOT synced across devices
- Survives browser closure
- Lost if cache is cleared

### Storage Limits
- Typical limit: 5-10 MB per domain
- Budget Expense Tracker: ~1-2 MB typical
- Can store 10,000+ expenses safely
- Use backup/export to manage space

### Clearing Storage
- Browser Settings → Privacy/Cookies
- Select "Budget Expense Tracker"
- Clear Site Data
- ⚠️ This permanently deletes all data
- Always backup first!

---

## Privacy & Security

### Your Data
- **Local Storage:** All data stays on YOUR device
- **No Server:** We don't send your data anywhere
- **No Tracking:** No analytics or tracking
- **Offline Mode:** Works completely offline
- **Private:** Your budget is only known to you

### How to Stay Safe
1. Keep backups in secure location
2. Don't share your backup files
3. Use browser privacy mode for sensitive use
4. Clear browser cache regularly
5. Keep browser updated

---

## Browser Compatibility

✅ **Desktop Browsers**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

✅ **Mobile Browsers**
- iPhone Safari 14+
- Android Chrome 90+
- Android Firefox 88+
- Samsung Internet 14+

✅ **Features**
- Responsive design (mobile-optimized)
- Touch-friendly buttons
- PWA installation support
- Offline functionality

---

## Getting Help

### Common Questions

**Q: Can I use multiple devices?**
A: Data only syncs within one browser. Use backup/restore to transfer between devices.

**Q: How do I export to Excel?**
A: Click "Export CSV" button and open file in Excel.

**Q: Can I undo a deletion?**
A: Yes! Click "Undo" in the notification within 5 seconds.

**Q: What if my data gets corrupted?**
A: Use your latest backup to restore all data (app has validation).

**Q: How do I change my budget?**
A: Go to Dashboard, toggle Budget Tracking ON, enter new amount, click Set Budget.

---

## Quick Reference: Calculation Formulas

### Monthly Equivalent Formula
```
monthlyAmount = expenseAmount × frequencyMultiplier

Where:
- Daily: multiplier = 30.4375
- Weekly: multiplier = 4.34821
- Fortnightly: multiplier = 2.17411
- Monthly: multiplier = 1.0
- Quarterly: multiplier = 0.33333
- Yearly: multiplier = 0.08333
```

### Budget Utilization Formula
```
Utilization % = (Total Monthly Expenses / Budget) × 100

Alerts:
- 50%: Yellow warning
- 75%: Orange warning
- 90%: Red warning
- 100%+: Critical alert
```

---

## Version Information

**Current Version:** 3.1
**Release Date:** March 2024
**Status:** Production Ready

**Latest Updates:**
- Fixed floating-point calculation errors
- Standardized frequency multipliers
- Rewrote budget alert system
- Added CSV export functionality
- Added data validation
- Added monthly comparison analytics

---

## Support

For bugs, feature requests, or questions:
1. Check IMPROVEMENTS.md for technical details
2. Review SESSION_SUMMARY.md for recent changes
3. Check this guide for common issues
4. Create an issue in repository if needed

---

*Last Updated: March 2024*
*For technical documentation, see IMPROVEMENTS.md*

