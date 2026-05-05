// Modern JavaScript with enhanced UX features and Multi-language support
'use strict';

/**
 * Application state management
 * @namespace
 */
const AppState = {
    translations: Object.freeze({}),
    currentLanguage: 'en',
    isInitialized: false
};

/**
 * Utility functions with JSDoc documentation
 * @namespace
 */
const Utils = Object.freeze({
    /**
     * Debounce function to limit rate of execution
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    },

    /**
     * Get single element by selector
     * @param {string} selector - CSS selector
     * @returns {Element|null} DOM element or null
     */
    getElement(selector) {
        return document.querySelector(selector);
    },

    /**
     * Get multiple elements by selector
     * @param {string} selector - CSS selector
     * @returns {NodeList} NodeList of elements
     */
    getElements(selector) {
        return document.querySelectorAll(selector);
    },

    /**
     * Safely get nested object property
     * @param {Object} obj - Object to search
     * @param {string} path - Dot-separated path
     * @param {*} defaultValue - Default value if not found
     * @returns {*} Property value or default
     */
    getNestedProperty(obj, path, defaultValue = undefined) {
        return path.split('.').reduce((current, key) => current?.[key], obj) ?? defaultValue;
    },

    /**
     * Cache DOM queries for performance
     * @param {string} selector - CSS selector
     * @param {boolean} multiple - Get multiple elements
     * @returns {Element|NodeList|null} Cached DOM element(s)
     */
    cachedQuery(selector, multiple = false) {
        const cacheKey = `_${selector.replace(/[^a-zA-Z0-9]/g, '_')}`;
        if (!this[cacheKey]) {
            this[cacheKey] = multiple ? this.getElements(selector) : this.getElement(selector);
        }
        return this[cacheKey];
    }
});

document.addEventListener('DOMContentLoaded', function () {
    // Load translations first, then initialize all components
    loadTranslations()
        .then(() => {
            initializeApp();
        })
        .catch((error) => {
            ErrorHandler.log(error, 'initialization');
            // Initialize app even if translations fail
            initializeApp();
        });
});

/**
 * Load translations from JSON file with error handling
 * @returns {Promise<Object>} Translation data
 */
async function loadTranslations() {
    try {
        const response = await fetch('/translations.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const translations = await response.json();
        // Use Object.assign to update frozen object
        Object.assign(AppState.translations, translations);

        // Apply saved language on page load
        const savedLang = localStorage.getItem('language') || 'en';
        applyLanguage(savedLang);

        // Mark app as ready for translation-dependent features
        AppState.isInitialized = true;
    } catch (err) {
        ErrorHandler.log(err, 'loadTranslations');
        // Fallback to English if translations fail to load
        Object.assign(AppState.translations, { en: {} });
        AppState.currentLanguage = 'en';
        AppState.isInitialized = true;
    }
}

// Language Toggle and Translation Logic with full JSDoc
const LanguageManager = {
    /**
     * Initialize language toggle functionality
     */
    init() {
        const langToggle = Utils.getElement('#langToggle');
        if (!langToggle) {
            return;
        }

        langToggle.addEventListener('click', () => this.toggle());

        // Listen for system language changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
                // Re-apply theme if user changes system preference
                this.apply(AppState.currentLanguage);
            });
        }
    },

    /**
     * Toggle between English and Arabic
     */
    toggle() {
        const currentLang = document.documentElement.lang || 'en';
        const newLang = currentLang === 'en' ? 'ar' : 'en';
        this.apply(newLang);
    },

    /**
     * Apply language settings to the page
     * @param {string} lang - Language code ('en' or 'ar')
     */
    apply(lang) {
        const t = AppState.translations[lang];
        if (!t && lang !== 'en') {
            ErrorHandler.log(
                new Error(`Translations not found for language: ${lang}`),
                'LanguageManager.apply'
            );
            return;
        }

        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        localStorage.setItem('language', lang);
        AppState.currentLanguage = lang;

        // Update toggle button text
        const langToggle = Utils.getElement('#langToggle');
        if (langToggle) {
            langToggle.textContent = lang === 'en' ? 'AR' : 'EN';
            langToggle.setAttribute(
                'aria-label',
                `Switch to ${lang === 'en' ? 'Arabic' : 'English'}`
            );
        }

        // Update all elements with data-t attribute
        Utils.getElements('[data-t]').forEach((el) => {
            const key = el.getAttribute('data-t');
            const translation = t?.[key] || AppState.translations.en?.[key];
            if (translation) {
                if (el.tagName === 'INPUT' && el.type === 'text') {
                    el.placeholder = translation;
                } else {
                    el.textContent = translation;
                }
            }
        });

        // Update search placeholder specifically if it exists
        const searchInput = Utils.getElement('#searchInput');
        if (searchInput && t?.search_placeholder) {
            searchInput.placeholder = t.search_placeholder;
        }

        // Update body class for RTL specific styling
        document.body.classList.toggle('rtl', lang === 'ar');

        // Update PDF download button text
        const downloadBtn = Utils.getElement('#downloadPdfBtn');
        if (downloadBtn && t?.download_pdf) {
            downloadBtn.textContent = t.download_pdf;
        }

        // Announce language change to screen readers
        this.announceLanguageChange(lang);
    },

    /**
     * Announce language change to screen readers
     * @param {string} lang - Current language
     */
    announceLanguageChange(lang) {
        const message =
            lang === 'ar' ? 'تم تغيير اللغة إلى العربية' : 'Language changed to English';
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        document.body.appendChild(announcement);
        setTimeout(() => announcement.remove(), 2000);
    }
};

function initLanguageToggle() {
    LanguageManager.init();
}

function applyLanguage(lang) {
    LanguageManager.apply(lang);
}

// Mobile Menu Toggle
const MobileMenu = {
    init() {
        const header = Utils.getElement('header .container');
        const nav = Utils.getElement('nav');

        if (!header || !nav) {
            return;
        }

        // Create mobile menu button
        this.menuToggle = document.createElement('button');
        this.menuToggle.className = 'mobile-menu-toggle';
        this.menuToggle.setAttribute('aria-label', 'Toggle navigation menu');
        this.menuToggle.setAttribute('aria-expanded', 'false');
        this.menuToggle.innerHTML = '<span></span><span></span><span></span>';

        header.appendChild(this.menuToggle);
        this.nav = nav;
        this.bindEvents();
    },

    bindEvents() {
        this.menuToggle.addEventListener('click', () => this.toggle());

        // Close menu when clicking on a link
        const navLinks = this.nav.querySelectorAll('a');
        navLinks.forEach((link) => {
            link.addEventListener('click', () => this.close());
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (
                !this.nav.contains(e.target) &&
                !this.menuToggle.contains(e.target) &&
                this.nav.classList.contains('active')
            ) {
                this.close();
            }
        });
    },

    toggle() {
        const isExpanded = this.menuToggle.getAttribute('aria-expanded') === 'true';
        this.menuToggle.setAttribute('aria-expanded', !isExpanded);
        this.menuToggle.classList.toggle('active');
        this.nav.classList.toggle('active');
        document.body.style.overflow = isExpanded ? '' : 'hidden';
    },

    close() {
        this.menuToggle.classList.remove('active');
        this.menuToggle.setAttribute('aria-expanded', 'false');
        this.nav.classList.remove('active');
        document.body.style.overflow = '';
    }
};

function initMobileMenu() {
    MobileMenu.init();
}

// Enhanced Search with Debouncing and Accessibility
const SearchManager = {
    /**
     * Initialize search functionality
     */
    init() {
        this.searchInput = Utils.getElement('#searchInput');
        if (!this.searchInput) {
            return;
        }

        this.cardsContainer = Utils.getElement('#cardsContainer');
        this.cards = Utils.getElements('.card');
        this.hasResults = true;
        this.setupUI();
        this.bindEvents();
    },

    /**
     * Setup search UI elements
     */
    setupUI() {
        // Create search wrapper and icon
        const searchBox = this.searchInput.parentElement;
        searchBox.classList.add('search-wrapper');

        const searchIcon = document.createElement('span');
        searchIcon.className = 'search-icon';
        searchIcon.innerHTML = '🔍';
        searchIcon.setAttribute('aria-hidden', 'true');
        searchBox.insertBefore(searchIcon, this.searchInput);

        // Create clear button
        this.clearBtn = document.createElement('button');
        this.clearBtn.className = 'search-clear';
        this.clearBtn.innerHTML = '✕';
        this.clearBtn.setAttribute('aria-label', 'Clear search');
        this.clearBtn.setAttribute('type', 'button');
        searchBox.appendChild(this.clearBtn);

        // Create no results message with translations
        this.noResults = document.createElement('div');
        this.noResults.className = 'no-results';
        this.noResults.setAttribute('aria-live', 'polite');
        this.noResults.innerHTML = `
            <div class="no-results-icon">🔍</div>
            <h3 data-t="no_results_title">No results found</h3>
            <p data-t="no_results_subtitle">Try adjusting your search terms</p>
        `;
        if (this.cardsContainer) {
            this.cardsContainer.after(this.noResults);
        }
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        const debouncedSearch = Utils.debounce((query) => this.performSearch(query), 150);

        this.searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            this.clearBtn.classList.toggle('visible', query.length > 0);
            debouncedSearch(query);
        });

        this.clearBtn.addEventListener('click', () => {
            this.searchInput.value = '';
            this.searchInput.focus();
            this.clearBtn.classList.remove('visible');
            this.performSearch('');
        });

        // Handle keyboard navigation
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.searchInput.value = '';
                this.clearBtn.classList.remove('visible');
                this.performSearch('');
            }
        });
    },

    /**
     * Perform search across cards
     * @param {string} query - Search query
     */
    performSearch(query) {
        let visibleCount = 0;
        const lang = document.documentElement.lang || 'en';

        this.cards.forEach((card, index) => {
            const title = card.getAttribute('data-title') || '';
            const content = card.textContent.toLowerCase();
            const searchableText = (title + ' ' + content).toLowerCase();

            if (searchableText.includes(query)) {
                card.style.display = 'block';
                card.style.animation = 'none';
                card.offsetHeight; // Trigger reflow
                card.style.animation = `fadeInUp 0.4s ease forwards ${index * 0.05}s`;
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        // Show/hide no results message
        if (this.cardsContainer) {
            this.noResults.classList.toggle('visible', visibleCount === 0 && query.length > 0);
        }

        // Update state
        this.hasResults = visibleCount > 0;

        // Announce search results to screen readers
        if (query.length > 0) {
            this.announceResults(visibleCount, lang);
        }
    },

    /**
     * Announce search results to screen readers
     * @param {number} count - Number of results
     * @param {string} lang - Current language
     */
    announceResults(count, lang) {
        const message =
            lang === 'ar'
                ? count === 0
                    ? 'لم يتم العثور على نتائج'
                    : `تم العثور على ${count} نتيجة`
                : count === 0
                  ? 'No results found'
                  : `Found ${count} result${count !== 1 ? 's' : ''}`;

        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        document.body.appendChild(announcement);
        setTimeout(() => announcement.remove(), 2000);
    }
};

function initSearch() {
    SearchManager.init();
}

// PDF Download Handler
const PdfDownloader = {
    init() {
        this.downloadBtn = Utils.getElement('#downloadPdfBtn');
        if (this.downloadBtn) {
            this.downloadBtn.addEventListener('click', (e) => this.handleDownload(e));
        }
    },

    handleDownload(e) {
        e.preventDefault();
        window.open('/Mobcash_Guide.pdf', '_blank');
    }
};

function initPdfDownload() {
    PdfDownloader.init();
}

// Active Navigation Highlighting
const NavigationManager = {
    init() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = Utils.getElements('nav ul li a');

        navLinks.forEach((link) => {
            const linkPage = link.getAttribute('href');
            link.classList.toggle('active', linkPage === currentPage);
        });
    }
};

function initActiveNavigation() {
    NavigationManager.init();
}

// Scroll Effects (Header shadow)
const ScrollEffects = {
    init() {
        this.header = Utils.getElement('header');
        this.bindEvents();
    },

    bindEvents() {
        window.addEventListener('scroll', () => this.onScroll(), { passive: true });
    },

    onScroll() {
        const currentScroll = window.pageYOffset;
        this.header.classList.toggle('scrolled', currentScroll > 10);
    }
};

function initScrollEffects() {
    ScrollEffects.init();
}

// Back to Top Button
const BackToTop = {
    init() {
        this.button = document.createElement('button');
        this.button.className = 'back-to-top';
        this.button.setAttribute('aria-label', 'Back to top');
        this.button.innerHTML = '↑';
        document.body.appendChild(this.button);

        this.isVisible = false;
        this.bindEvents();
    },

    bindEvents() {
        window.addEventListener('scroll', () => this.checkVisibility(), { passive: true });
        this.button.addEventListener('click', () => this.scrollToTop());
    },

    checkVisibility() {
        const shouldShow = window.pageYOffset > 500;
        if (shouldShow !== this.isVisible) {
            this.isVisible = shouldShow;
            this.button.classList.toggle('visible', shouldShow);
        }
    },

    scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

function initBackToTop() {
    BackToTop.init();
}

// Reading Progress Bar
const ReadingProgress = {
    init() {
        this.progressBar = document.createElement('div');
        this.progressBar.className = 'reading-progress';
        document.body.appendChild(this.progressBar);
        this.bindEvents();
    },

    bindEvents() {
        window.addEventListener('scroll', () => this.update(), { passive: true });
    },

    update() {
        const scrollTop = window.pageYOffset;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        this.progressBar.style.width = scrollPercent + '%';
    }
};

function initReadingProgress() {
    ReadingProgress.init();
}

// Intersection Observer for Fade-in Animations – with fallback
const VisibilityObserver = {
    init() {
        this.sections = Utils.getElements('section, h2, h3');
        this.checkInitialVisibility();
        this.setupObserver();
    },

    isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top < (window.innerHeight || document.documentElement.clientHeight) &&
            rect.bottom > 0
        );
    },

    checkInitialVisibility() {
        this.sections.forEach((section) => {
            if (this.isElementInViewport(section)) {
                section.classList.add('visible');
            }
        });
    },

    setupObserver() {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        this.sections.forEach((section) => {
            if (!section.classList.contains('visible')) {
                observer.observe(section);
            }
        });
    }
};

function initIntersectionObserver() {
    VisibilityObserver.init();
}

// Smooth Scroll for Anchor Links
const SmoothScroll = {
    init() {
        const anchors = Utils.getElements('a[href^="#"]');
        anchors.forEach((anchor) => {
            anchor.addEventListener('click', (e) => this.handleScroll(e));
        });
    },

    handleScroll(e) {
        const targetId = e.currentTarget.getAttribute('href');
        if (targetId === '#') {
            return;
        }

        const targetElement = Utils.getElement(targetId);
        if (targetElement) {
            e.preventDefault();
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
};

function initSmoothScroll() {
    SmoothScroll.init();
}

// Theme Toggle
const ThemeManager = {
    init() {
        this.toggleButton = Utils.getElement('.theme-toggle');
        if (!this.toggleButton) {
            return;
        }

        this.loadSavedTheme();
        this.bindEvents();
    },

    loadSavedTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            this.setTheme('dark');
        } else if (savedTheme === 'light') {
            this.setTheme('light');
        } else {
            // Check system preference
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                this.setTheme('dark');
            }
        }
    },

    setTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
            this.toggleButton.textContent = '☀️';
        } else {
            document.body.classList.remove('dark-theme');
            this.toggleButton.textContent = '🌙';
        }
    },

    bindEvents() {
        this.toggleButton.addEventListener('click', () => {
            const isDark = document.body.classList.contains('dark-theme');
            this.setTheme(isDark ? 'light' : 'dark');
            localStorage.setItem('theme', isDark ? 'light' : 'dark');
        });
    }
};

function initThemeToggle() {
    ThemeManager.init();
}

// Page Visibility Handler - consolidated into single module
const VisibilityHandler = {
    init() {
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
    },

    handleVisibilityChange() {
        document.body.classList.toggle('tab-hidden', document.hidden);
    }
};

function initVisibilityHandler() {
    VisibilityHandler.init();
}

// Error Handler for graceful error management
const ErrorHandler = {
    log(error, context = '') {
        console.error(`[Error${context ? ` in ${context}` : ''}]`, error);
    },

    handleAsync(operation, context = '') {
        return async function (...args) {
            try {
                return await operation(...args);
            } catch (error) {
                ErrorHandler.log(error, context);
                throw error;
            }
        };
    }
};

// Initialize all components
function initializeApp() {
    initLanguageToggle();
    initMobileMenu();
    initSearch();
    initActiveNavigation();
    initScrollEffects();
    initBackToTop();
    initReadingProgress();
    initIntersectionObserver();
    initSmoothScroll();
    initThemeToggle();
    initPdfDownload();
    initVisibilityHandler();
}

// Export modules for potential external use (optional)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Utils,
        AppState,
        LanguageManager,
        MobileMenu,
        SearchManager,
        PdfDownloader,
        NavigationManager,
        ScrollEffects,
        BackToTop,
        ReadingProgress,
        VisibilityObserver,
        SmoothScroll,
        ThemeManager,
        VisibilityHandler,
        ErrorHandler
    };
}
