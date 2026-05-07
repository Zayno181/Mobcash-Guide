/**
 * Search Manager Module
 * Enhanced search with debouncing, accessibility, and performance optimizations
 */

import { appStore } from './store.js';
import { appBus } from './event-bus.js';
import { getElement, getElements, debounce, createElement, domCache } from './utils.js';

export class SearchManager {
    constructor(options = {}) {
        this.debounceDelay = options.debounceDelay || 150;
        this.maxQueryLength = options.maxQueryLength || 100;
        this.minQueryLength = options.minQueryLength || 1;
        this.searchInput = null;
        this.cardsContainer = null;
        this.cards = [];
        this.clearBtn = null;
        this.noResults = null;
        this.hasResults = true;
        this.debouncedSearch = null;
    }

    /**
     * Initialize search functionality
     */
    init() {
        this.searchInput = getElement('#searchInput');
        if (!this.searchInput) {
            return this;
        }

        this.cardsContainer = getElement('#cardsContainer');
        this.cards = Array.from(getElements('.card'));
        
        // Create debounced search function
        this.debouncedSearch = debounce((query) => this.performSearch(query), this.debounceDelay);
        
        this.setupUI();
        this.bindEvents();
        this.subscribeToStore();
        
        return this;
    }

    /**
     * Setup search UI elements
     */
    setupUI() {
        if (!this.searchInput.parentElement) return;
        
        const searchBox = this.searchInput.parentElement;
        searchBox.classList.add('search-wrapper');

        // Add search icon if not exists
        if (!getElement('.search-icon', searchBox)) {
            const searchIcon = createElement('span', {
                className: 'search-icon',
                textContent: '🔍',
                'aria-hidden': 'true'
            });
            searchBox.insertBefore(searchIcon, this.searchInput);
        }

        // Create clear button
        this.clearBtn = createElement('button', {
            className: 'search-clear',
            textContent: '✕',
            type: 'button',
            'aria-label': 'Clear search'
        });
        searchBox.appendChild(this.clearBtn);

        // Create no results message
        this.noResults = createElement('div', {
            className: 'no-results',
            'aria-live': 'polite'
        });
        
        const iconDiv = createElement('div', {
            className: 'no-results-icon',
            textContent: '🔍'
        });
        
        const titleH3 = createElement('h3', {
            'data-t': 'no_results_title',
            textContent: 'No results found'
        });
        
        const subtitleP = createElement('p', {
            'data-t': 'no_results_subtitle',
            textContent: 'Try adjusting your search terms'
        });
        
        this.noResults.appendChild(iconDiv);
        this.noResults.appendChild(titleH3);
        this.noResults.appendChild(subtitleP);
        
        if (this.cardsContainer) {
            this.cardsContainer.after(this.noResults);
        }
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Search input handler
        this.searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            this.clearBtn.classList.toggle('visible', query.length > 0);
            this.debouncedSearch(query);
        });

        // Clear button handler
        this.clearBtn.addEventListener('click', () => {
            this.searchInput.value = '';
            this.searchInput.focus();
            this.clearBtn.classList.remove('visible');
            this.performSearch('');
        });

        // Keyboard navigation
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.searchInput.value = '';
                this.clearBtn.classList.remove('visible');
                this.performSearch('');
            }
        });

        // Listen for language changes to update no-results message
        appBus.on('language:changed', () => {
            this.updateNoResultsMessage();
        });
    }

    /**
     * Perform search across cards
     * @param {string} query - Search query
     */
    performSearch(query) {
        // Sanitize and validate query
        const sanitizedQuery = this.sanitizeQuery(query);
        
        // Update store with search query
        appStore.dispatch({
            type: 'SET_SEARCH_QUERY',
            payload: sanitizedQuery
        });
        
        // Skip search if empty or too short
        if (sanitizedQuery.length < this.minQueryLength) {
            this.resetSearch();
            return;
        }
        
        let visibleCount = 0;
        const lang = document.documentElement.lang || 'en';

        this.cards.forEach((card, index) => {
            const title = card.getAttribute('data-title') || '';
            const content = card.textContent.toLowerCase();
            const searchableText = (title + ' ' + content).toLowerCase();

            if (searchableText.includes(sanitizedQuery)) {
                this.showCard(card, index);
                visibleCount++;
            } else {
                this.hideCard(card);
            }
        });

        // Show/hide no results message
        this.noResults.classList.toggle(
            'visible', 
            visibleCount === 0 && sanitizedQuery.length >= this.minQueryLength
        );

        // Update state
        this.hasResults = visibleCount > 0;

        // Announce results to screen readers
        if (sanitizedQuery.length >= this.minQueryLength) {
            this.announceResults(visibleCount, lang);
        }
    }

    /**
     * Sanitize search query
     * @param {string} query - Raw query
     * @returns {string} Sanitized query
     */
    sanitizeQuery(query) {
        return query
            .slice(0, this.maxQueryLength)
            .toLowerCase()
            .trim()
            .replace(/[<>]/g, ''); // Remove potential HTML
    }

    /**
     * Show a card with animation
     * @param {HTMLElement} card - Card element
     * @param {number} index - Card index for staggered animation
     */
    showCard(card, index) {
        card.style.display = 'block';
        card.style.animation = 'none';
        card.offsetHeight; // Trigger reflow
        card.style.animation = `fadeInUp 0.4s ease forwards ${index * 0.05}s`;
    }

    /**
     * Hide a card
     * @param {HTMLElement} card - Card element
     */
    hideCard(card) {
        card.style.display = 'none';
    }

    /**
     * Reset search to initial state
     */
    resetSearch() {
        this.cards.forEach((card, index) => {
            card.style.display = 'block';
            card.style.animation = 'none';
            card.offsetHeight;
            card.style.animation = `fadeInUp 0.4s ease forwards ${index * 0.05}s`;
        });
        
        this.noResults.classList.remove('visible');
        this.hasResults = true;
    }

    /**
     * Update no results message based on current language
     */
    updateNoResultsMessage() {
        const lang = document.documentElement.lang || 'en';
        const titleEl = this.noResults.querySelector('h3');
        const subtitleEl = this.noResults.querySelector('p');
        
        if (titleEl) {
            titleEl.textContent = lang === 'ar' ? 'لم يتم العثور على نتائج' : 'No results found';
        }
        
        if (subtitleEl) {
            subtitleEl.textContent = lang === 'ar' ? 'حاول تعديل مصطلحات البحث' : 'Try adjusting your search terms';
        }
    }

    /**
     * Announce search results to screen readers
     * @param {number} count - Number of results
     * @param {string} lang - Current language
     */
    announceResults(count, lang) {
        const message = lang === 'ar'
            ? (count === 0 ? 'لم يتم العثور على نتائج' : `تم العثور على ${count} نتيجة`)
            : (count === 0 ? 'No results found' : `Found ${count} result${count !== 1 ? 's' : ''}`);

        // Remove existing announcement
        const existing = getElement('#search-announcement');
        if (existing) {
            existing.remove();
        }

        const announcement = createElement('div', {
            id: 'search-announcement',
            role: 'status',
            'aria-live': 'polite',
            className: 'sr-only'
        }, message);
        
        document.body.appendChild(announcement);
        setTimeout(() => announcement.remove(), 2000);
    }

    /**
     * Subscribe to store changes
     */
    subscribeToStore() {
        appStore.subscribe((state) => {
            // Handle language changes affecting search
            if (state.language !== document.documentElement.lang) {
                this.updateNoResultsMessage();
            }
        });
    }

    /**
     * Destroy search manager and cleanup
     */
    destroy() {
        if (this.debouncedSearch && this.debouncedSearch.cancel) {
            this.debouncedSearch.cancel();
        }
        
        // Remove event listeners could be added here if needed
        this.searchInput = null;
        this.cards = [];
        this.clearBtn = null;
        this.noResults = null;
    }
}

// Create singleton instance
export const searchManager = new SearchManager();

export default searchManager;
