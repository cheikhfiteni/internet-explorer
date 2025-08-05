# 🔍 Advanced History Explorer

A powerful Chrome extension for searching and filtering your browsing history with advanced options and intuitive interface.

## Features

### 📅 Flexible Date Filtering
- Search between specific start and end dates/times
- Quick buttons for Last Week, Last Month, Last Year
- Support for 24-hour time format

### 🔎 Advanced Keyword Filtering
- **Include keywords**: Must contain ALL specified terms
- **Exclude keywords**: Must NOT contain ANY specified terms
- Real-time filtering as you type

### 🚫 URL Exclusions
- Filter out specific base URLs (e.g., youtube.com, x.com)
- Quick-select common social media platforms
- Manual input for custom exclusions

### 🎯 Interactive Results
- Click any result to open in a new tab
- Click ✕ to exclude individual results from current search
- Sort by visit count and recency
- Toggle between showing/hiding full URLs
- Export results as JSON

### 💾 Save & Load Searches
- Save frequently used search configurations
- Quick load from dropdown menu
- Persistent storage across browser sessions

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked" and select the extension folder
5. The extension icon should appear in your toolbar

## Usage

### Basic Search
1. Click the extension icon to open the popup
2. Set your desired date range (defaults to last year)
3. Click "🔍 Search History"

### Advanced Filtering
1. Add keywords you want to include (comma-separated)
2. Add keywords you want to exclude (comma-separated)
3. Add base URLs to exclude (or use quick-select tags)
4. Results update automatically as you type

### Exclude Individual Results
- Click the red ✕ button next to any result to remove it from the current search
- This doesn't delete from your actual history, just filters the current view

### Save Your Searches
1. Configure your filters
2. Enter a name in the "Search name" field
3. Click "💾 Save Search"
4. Load saved searches from the dropdown

### Export Results
- Click "📋 Export Results" to download your filtered results as JSON
- Includes title, URL, visit count, and last visit date

## Permissions

This extension requires:
- **History**: To read your browsing history
- **Storage**: To save your search configurations

## Technical Details

- Built with Manifest V3
- Uses Chrome History API
- Local storage for saved searches
- Modern, responsive CSS design
- No external dependencies

## Privacy

- All data processing happens locally in your browser
- No data is sent to external servers
- Saved searches are stored locally only

## Tips

- Use the "Show full URLs" checkbox to see complete URLs for better identification
- Start with broad date ranges and narrow down with keywords
- Save commonly used filter combinations for quick access
- Use the exclude feature to quickly eliminate unwanted results

## Troubleshooting

If results aren't appearing:
1. Make sure you have browsing history for the selected date range
2. Check that your keyword filters aren't too restrictive
3. Try clearing all filters and searching again

---

**Happy History Hunting! 🕵️‍♂️**