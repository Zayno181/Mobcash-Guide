/**
 * Main Application Entry Point
 * ES6 Module that imports and initializes all components
 */

import { appStore } from './modules/store.js';
import { appBus } from './modules/event-bus.js';
import { languageManager } from './modules/language-manager.js';
import { searchManager } from './modules/search-manager.js';
import { safeStorage, getElement } from './modules/utils.js';

/**
 * Theme Manager - handles light/dark theme switching
 */
const ThemeManager = {
    init() {
        this.toggleButton = getElement('.theme-toggle');
        if (!this.toggleButton) {
            this.createThemeToggle();
            return;
        }
        
        // Apply saved theme
        const savedTheme = safeStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
        this.bindEvents();
    },

    createThemeToggle() {
        const headerContainer = getElement('header .container');
        if (!headerContainer) return;

        const savedTheme = safeStorage.getItem('theme') || 'light';
        const icon = savedTheme === 'dark' ? '☀️' : '🌙';

        this.toggleButton = document.createElement('button');
        this.toggleButton.className = 'theme-toggle';
        this.toggleButton.setAttribute('aria-label', 'Switch between light and dark mode');
        this.toggleButton.textContent = icon;

        headerContainer.appendChild(this.toggleButton);
        this.bindEvents();
    },

    setTheme(theme) {
        if (!['light', 'dark'].includes(theme)) {
            theme = 'light';
        }
        
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
            if (this.toggleButton) this.toggleButton.textContent = '☀️';
        } else {
            document.body.classList.remove('dark-theme');
            if (this.toggleButton) this.toggleButton.textContent = '🌙';
        }
        
        // Update store
        appStore.dispatch({ type: 'SET_THEME', payload: theme });
    },

    bindEvents() {
        this.toggleButton.addEventListener('click', () => {
            const isDark = document.body.classList.contains('dark-theme');
            const newTheme = isDark ? 'light' : 'dark';
            this.setTheme(newTheme);
            safeStorage.setItem('theme', newTheme);
        });
    }
};

/**
 * Mobile Menu Manager
 */
const MobileMenuManager = {
    init() {
        const header = getElement('header .container');
        const nav = getElement('nav');

        if (!header || !nav) return;

        this.createMenuToggle(header);
        this.nav = nav;
        this.bindEvents();
    },

    createMenuToggle(header) {
        this.menuToggle = document.createElement('button');
        this.menuToggle.className = 'mobile-menu-toggle';
        this.menuToggle.setAttribute('aria-label', 'Toggle navigation menu');
        this.menuToggle.setAttribute('aria-expanded', 'false');

        // Create hamburger icon
        for (let i = 0; i < 3; i++) {
            const span = document.createElement('span');
            this.menuToggle.appendChild(span);
        }

        header.appendChild(this.menuToggle);
    },

    bindEvents() {
        this.menuToggle.addEventListener('click', () => this.toggle());

        // Close on link click
        const navLinks = this.nav.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => this.close());
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!this.nav.contains(e.target) && 
                !this.menuToggle.contains(e.target) && 
                this.nav.classList.contains('active')) {
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

/**
 * PDF Download Handler with security improvements
 */
const PdfDownloader = {
    init() {
        const downloadBtn = getElement('#downloadPdfBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', (e) => this.handleDownload(e));
        }
    },

    handleDownload(e) {
        e.preventDefault();
        
        const lang = document.documentElement.lang || 'en';
        const pdfPath = lang === 'ar' ? '/_site/ar/Mobcash_Guide_AR.pdf' : '/_site/Mobcash_Guide.pdf';
        
        // Create secure download link
        const link = document.createElement('a');
        link.href = pdfPath;
        link.download = `MobCash_Guide_${lang}.pdf`;
        link.rel = 'noopener noreferrer';
        link.target = '_blank';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

/**
 * Reading Progress Indicator
 */
const ReadingProgress = {
    init() {
        this.progressBar = getElement('.reading-progress-bar');
        if (!this.progressBar) {
            this.createProgressBar();
        }
        this.updateProgress();
        window.addEventListener('scroll', () => this.updateProgress(), { passive: true });
    },

    createProgressBar() {
        const progressBar = document.createElement('div');
        progressBar.className = 'reading-progress-bar';
        progressBar.innerHTML = '<div class="reading-progress-fill"></div>';
        document.body.insertBefore(progressBar, document.body.firstChild);
        this.progressBar = progressBar.querySelector('.reading-progress-fill');
    },

    updateProgress() {
        if (!this.progressBar) return;
        
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        
        this.progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }
};

/**
 * Back to Top Button
 */
const BackToTop = {
    init() {
        this.button = getElement('.back-to-top');
        if (!this.button) {
            this.createButton();
        }
        this.bindEvents();
        window.addEventListener('scroll', () => this.toggleVisibility(), { passive: true });
    },

    createButton() {
        this.button = document.createElement('button');
        this.button.className = 'back-to-top';
        this.button.setAttribute('aria-label', 'Back to top');
        this.button.textContent = '↑';
        document.body.appendChild(this.button);
    },

    toggleVisibility() {
        if (!this.button) return;
        
        const showThreshold = 300;
        this.button.classList.toggle('visible', window.scrollY > showThreshold);
    },

    bindEvents() {
        this.button.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
};

/**
 * Page Visibility Handler
 */
const VisibilityHandler = {
    init() {
        document.addEventListener('visibilitychange', () => {
            document.body.classList.toggle('tab-hidden', document.hidden);
        });
    }
};

/**
 * Intersection Observer for scroll animations
 */
const ScrollObserver = {
    init() {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    this.observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe elements
        getElements('.card, .animate-on-scroll').forEach(el => {
            this.observer.observe(el);
        });
    }
};

/**
 * Initialize all application components
 */
async function initializeApp() {
    try {
        // Initialize core modules first
        await languageManager.init();
        
        // Initialize UI components
        ThemeManager.init();
        MobileMenuManager.init();
        searchManager.init();
        PdfDownloader.init();
        ReadingProgress.init();
        BackToTop.init();
        VisibilityHandler.init();
        ScrollObserver.init();
        
        // Mark as initialized
        appStore.dispatch({ type: 'SET_INITIALIZED', payload: true });
        
        // Emit initialization complete event
        appBus.emit('app:initialized');
        
        console.log('[App] Initialization complete');
    } catch (error) {
        console.error('[App] Initialization error:', error);
        // Continue with partial initialization
        appStore.dispatch({ type: 'SET_INITIALIZED', payload: true });
    }
}

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);

// Export for potential external use
export {
    appStore,
    appBus,
    languageManager,
    searchManager,
    ThemeManager,
    MobileMenuManager,
    PdfDownloader,
    ReadingProgress,
    BackToTop,
    VisibilityHandler,
    ScrollObserver,
    initializeApp
};
