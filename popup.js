// History Explorer - Main JavaScript
class HistoryExplorer {
    constructor() {
        this.allResults = [];
        this.filteredResults = [];
        this.excludedItems = new Set();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSavedSearches();
        this.setDefaultDates();
    }

    setupEventListeners() {
        // Search and clear buttons
        document.getElementById('searchBtn').addEventListener('click', () => this.searchHistory());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());
        
        // Quick date buttons
        document.getElementById('lastWeek').addEventListener('click', () => this.setQuickDate(7));
        document.getElementById('lastMonth').addEventListener('click', () => this.setQuickDate(30));
        document.getElementById('lastYear').addEventListener('click', () => this.setQuickDate(365));
        
        // URL exclusion tags
        document.querySelectorAll('.exclusion-tag').forEach(tag => {
            tag.addEventListener('click', () => this.toggleExclusionTag(tag));
        });
        
        // Save and load searches
        document.getElementById('saveSearch').addEventListener('click', () => this.saveCurrentSearch());
        document.getElementById('savedSearches').addEventListener('change', (e) => this.loadSearch(e.target.value));
        
        // Export results
        document.getElementById('exportResults').addEventListener('click', () => this.exportResults());
        
        // Show URLs toggle
        document.getElementById('showUrls').addEventListener('change', () => this.toggleUrlDisplay());
        
        // Real-time filtering on keyword changes
        document.getElementById('includeKeywords').addEventListener('input', () => this.debounceFilter());
        document.getElementById('excludeKeywords').addEventListener('input', () => this.debounceFilter());
        document.getElementById('excludeUrls').addEventListener('input', () => this.debounceFilter());
    }

    setDefaultDates() {
        const now = new Date();
        const lastYear = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
        
        document.getElementById('endDate').value = this.formatDateForInput(now);
        document.getElementById('startDate').value = this.formatDateForInput(lastYear);
    }

    formatDateForInput(date) {
        return date.toISOString().slice(0, 16);
    }

    setQuickDate(days) {
        const now = new Date();
        const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
        
        document.getElementById('endDate').value = this.formatDateForInput(now);
        document.getElementById('startDate').value = this.formatDateForInput(startDate);
    }

    toggleExclusionTag(tag) {
        tag.classList.toggle('selected');
        this.updateExcludeUrlsInput();
    }

    updateExcludeUrlsInput() {
        const selectedTags = document.querySelectorAll('.exclusion-tag.selected');
        const urls = Array.from(selectedTags).map(tag => tag.dataset.url);
        const currentUrls = document.getElementById('excludeUrls').value.split(',').map(url => url.trim()).filter(url => url);
        
        // Merge selected tags with manual input
        const allUrls = [...new Set([...urls, ...currentUrls])];
        document.getElementById('excludeUrls').value = allUrls.join(', ');
    }

    async searchHistory() {
        const startDate = new Date(document.getElementById('startDate').value);
        const endDate = new Date(document.getElementById('endDate').value);
        
        if (!startDate || !endDate) {
            alert('Please select both start and end dates');
            return;
        }

        document.getElementById('searchBtn').disabled = true;
        document.getElementById('searchBtn').textContent = '🔄 Searching...';
        document.getElementById('resultsCount').textContent = 'Searching history...';

        try {
            const historyItems = await chrome.history.search({
                text: '',
                startTime: startDate.getTime(),
                endTime: endDate.getTime(),
                maxResults: 10000
            });

            this.allResults = historyItems;
            this.excludedItems.clear();
            this.filterResults();
            
        } catch (error) {
            console.error('Error searching history:', error);
            document.getElementById('resultsCount').textContent = 'Error searching history';
        } finally {
            document.getElementById('searchBtn').disabled = false;
            document.getElementById('searchBtn').textContent = '🔍 Search History';
        }
    }

    filterResults() {
        const includeKeywords = this.getKeywordsArray('includeKeywords');
        const excludeKeywords = this.getKeywordsArray('excludeKeywords');
        const excludeUrls = this.getKeywordsArray('excludeUrls');

        this.filteredResults = this.allResults.filter(item => {
            // Skip if manually excluded
            if (this.excludedItems.has(item.id)) return false;

            const searchText = (item.title + ' ' + item.url).toLowerCase();
            
            // Check include keywords (must contain ALL)
            if (includeKeywords.length > 0) {
                const hasAllKeywords = includeKeywords.every(keyword => 
                    searchText.includes(keyword.toLowerCase())
                );
                if (!hasAllKeywords) return false;
            }
            
            // Check exclude keywords (must NOT contain ANY)
            if (excludeKeywords.length > 0) {
                const hasExcludedKeyword = excludeKeywords.some(keyword => 
                    searchText.includes(keyword.toLowerCase())
                );
                if (hasExcludedKeyword) return false;
            }
            
            // Check exclude URLs (must NOT contain ANY base URL)
            if (excludeUrls.length > 0) {
                const hasExcludedUrl = excludeUrls.some(baseUrl => 
                    item.url.toLowerCase().includes(baseUrl.toLowerCase())
                );
                if (hasExcludedUrl) return false;
            }
            
            return true;
        });

        this.displayResults();
    }

    getKeywordsArray(inputId) {
        const value = document.getElementById(inputId).value;
        return value ? value.split(',').map(k => k.trim()).filter(k => k) : [];
    }

    displayResults() {
        const resultsContainer = document.getElementById('historyResults');
        const showUrls = document.getElementById('showUrls').checked;
        
        document.getElementById('resultsCount').textContent = 
            `Found ${this.filteredResults.length} results${this.allResults.length ? ` (${this.allResults.length} total)` : ''}`;
        
        if (this.filteredResults.length === 0) {
            resultsContainer.innerHTML = '<div class="no-results">No matching results found</div>';
            document.getElementById('exportResults').style.display = 'none';
            return;
        }

        document.getElementById('exportResults').style.display = 'block';

        // Sort by visit count and last visit time
        const sortedResults = this.filteredResults.sort((a, b) => {
            if (b.visitCount !== a.visitCount) {
                return b.visitCount - a.visitCount;
            }
            return b.lastVisitTime - a.lastVisitTime;
        });

        resultsContainer.innerHTML = sortedResults.map(item => {
            const visitDate = new Date(item.lastVisitTime);
            const domain = new URL(item.url).hostname;
            
            return `
                <div class="result-item" data-id="${item.id}">
                    <div class="result-header">
                        <button class="exclude-btn" title="Exclude this result">✕</button>
                        <span class="visit-count">${item.visitCount} visits</span>
                        <span class="visit-date">${visitDate.toLocaleString()}</span>
                    </div>
                    <div class="result-content">
                        <h4 class="result-title">
                            <a href="${item.url}" target="_blank" title="Open in new tab">
                                ${item.title || 'Untitled'}
                            </a>
                        </h4>
                        <div class="result-domain">${domain}</div>
                        ${showUrls ? `<div class="result-url">${item.url}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners for exclude buttons
        resultsContainer.querySelectorAll('.exclude-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const resultItem = e.target.closest('.result-item');
                const itemId = resultItem.dataset.id;
                this.excludeItem(itemId);
            });
        });
    }

    excludeItem(itemId) {
        // Find the item to get its domain
        const item = this.allResults.find(result => result.id === itemId);
        if (item) {
            try {
                const domain = new URL(item.url).hostname;
                
                // Add domain to exclude URLs input
                const excludeUrlsInput = document.getElementById('excludeUrls');
                const currentUrls = excludeUrlsInput.value
                    .split(',')
                    .map(url => url.trim())
                    .filter(url => url);
                
                // Only add if not already present
                if (!currentUrls.includes(domain)) {
                    currentUrls.push(domain);
                    excludeUrlsInput.value = currentUrls.join(', ');
                    
                    // Trigger filter update
                    this.filterResults();
                    
                    // Show visual feedback
                    this.showExclusionFeedback(domain);
                }
            } catch (error) {
                console.error('Error parsing URL:', error);
                // Fallback to old behavior if URL parsing fails
                this.excludedItems.add(itemId);
                this.filterResults();
            }
        }
    }

    toggleUrlDisplay() {
        this.displayResults();
    }

    // Debounced filtering for real-time updates
    debounceFilter() {
        clearTimeout(this.filterTimeout);
        this.filterTimeout = setTimeout(() => {
            if (this.allResults.length > 0) {
                this.filterResults();
            }
        }, 300);
    }

    clearAll() {
        document.getElementById('includeKeywords').value = '';
        document.getElementById('excludeKeywords').value = '';
        document.getElementById('excludeUrls').value = '';
        document.querySelectorAll('.exclusion-tag.selected').forEach(tag => {
            tag.classList.remove('selected');
        });
        document.getElementById('historyResults').innerHTML = '';
        document.getElementById('resultsCount').textContent = 'Ready to search...';
        document.getElementById('exportResults').style.display = 'none';
        this.allResults = [];
        this.filteredResults = [];
        this.excludedItems.clear();
    }

    async saveCurrentSearch() {
        const searchName = document.getElementById('searchName').value.trim();
        if (!searchName) {
            alert('Please enter a name for this search');
            return;
        }

        const searchConfig = {
            name: searchName,
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value,
            includeKeywords: document.getElementById('includeKeywords').value,
            excludeKeywords: document.getElementById('excludeKeywords').value,
            excludeUrls: document.getElementById('excludeUrls').value,
            timestamp: Date.now()
        };

        try {
            const result = await chrome.storage.local.get(['savedSearches']);
            const savedSearches = result.savedSearches || {};
            savedSearches[searchName] = searchConfig;
            await chrome.storage.local.set({ savedSearches });
            
            this.loadSavedSearches();
            document.getElementById('searchName').value = '';
            
            // Show feedback
            const btn = document.getElementById('saveSearch');
            const originalText = btn.textContent;
            btn.textContent = '✓ Saved!';
            setTimeout(() => btn.textContent = originalText, 2000);
            
        } catch (error) {
            console.error('Error saving search:', error);
            alert('Error saving search');
        }
    }

    async loadSavedSearches() {
        try {
            const result = await chrome.storage.local.get(['savedSearches']);
            const savedSearches = result.savedSearches || {};
            
            const select = document.getElementById('savedSearches');
            select.innerHTML = '<option value="">Load saved search...</option>';
            
            Object.keys(savedSearches).sort().forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading saved searches:', error);
        }
    }

    async loadSearch(searchName) {
        if (!searchName) return;

        try {
            const result = await chrome.storage.local.get(['savedSearches']);
            const savedSearches = result.savedSearches || {};
            const config = savedSearches[searchName];
            
            if (config) {
                document.getElementById('startDate').value = config.startDate;
                document.getElementById('endDate').value = config.endDate;
                document.getElementById('includeKeywords').value = config.includeKeywords;
                document.getElementById('excludeKeywords').value = config.excludeKeywords;
                document.getElementById('excludeUrls').value = config.excludeUrls;
                
                // Update exclusion tags
                document.querySelectorAll('.exclusion-tag').forEach(tag => {
                    tag.classList.remove('selected');
                    if (config.excludeUrls.includes(tag.dataset.url)) {
                        tag.classList.add('selected');
                    }
                });
            }
        } catch (error) {
            console.error('Error loading search:', error);
        }
    }

    showExclusionFeedback(domain) {
        // Create and show a temporary feedback message
        const feedback = document.createElement('div');
        feedback.className = 'exclusion-feedback';
        feedback.textContent = `✓ Excluded ${domain}`;
        document.body.appendChild(feedback);
        
        // Remove after animation
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 2000);
    }

    exportResults() {
        if (this.filteredResults.length === 0) return;

        const exportData = this.filteredResults.map(item => ({
            title: item.title,
            url: item.url,
            visitCount: item.visitCount,
            lastVisit: new Date(item.lastVisitTime).toISOString()
        }));

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `history-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Initialize the history explorer when the popup loads
document.addEventListener('DOMContentLoaded', () => {
    new HistoryExplorer();
});