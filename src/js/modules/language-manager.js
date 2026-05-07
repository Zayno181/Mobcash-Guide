/**
 * Language Manager Module
 * Handles language switching, translations, and RTL support
 */

import { appStore } from './store.js';
import { appBus } from './event-bus.js';
import { getElement, getElements, safeStorage, createElement } from './utils.js';

export class LanguageManager {
    constructor() {
        this.translations = {};
        this.supportedLanguages = ['en', 'ar'];
        this.defaultLanguage = 'en';
        this.initialized = false;
    }

    /**
     * Initialize language manager
     */
    async init() {
        await this.loadTranslations();
        this.setupLanguageToggle();
        this.subscribeToStore();
        this.initialized = true;
        
        // Apply saved language
        const savedLang = safeStorage.getItem('language');
        const validLang = this.supportedLanguages.includes(savedLang) ? savedLang : this.defaultLanguage;
        this.apply(validLang);
        
        return this;
    }

    /**
     * Load translations from JSON file with race condition protection
     */
    async loadTranslations() {
        try {
            const response = await fetch('/src/translations.json', {
                cache: 'force-cache'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.translations = data;
            
            // Update store
            appStore.dispatch({
                type: 'SET_TRANSLATIONS',
                payload: data
            });
            
            return data;
        } catch (error) {
            console.error('[LanguageManager] Failed to load translations:', error);
            
            // Fallback to minimal English translations
            this.translations = {
                en: {
                    site_title: 'MobCash Guide',
                    hero_title: 'General Guide for 1xBet Agents'
                },
                ar: {}
            };
            
            appStore.dispatch({
                type: 'SET_TRANSLATIONS',
                payload: this.translations
            });
            
            return this.translations;
        }
    }

    /**
     * Setup language toggle button
     */
    setupLanguageToggle() {
        const langToggle = getElement('#langToggle');
        
        if (!langToggle) {
            // Create language toggle if it doesn't exist
            this.createLanguageToggle();
            return;
        }
        
        langToggle.addEventListener('click', () => this.toggle());
        
        // Update toggle button text based on current language
        const currentState = appStore.getState();
        this.updateToggleText(langToggle, currentState.language);
    }

    /**
     * Create language toggle button dynamically
     */
    createLanguageToggle() {
        const headerContainer = getElement('header .container');
        if (!headerContainer) return;
        
        const currentState = appStore.getState();
        const nextLang = currentState.language === 'en' ? 'AR' : 'EN';
        
        const toggleButton = createElement('button', {
            id: 'langToggle',
            className: 'lang-toggle',
            'aria-label': `Switch to ${currentState.language === 'en' ? 'Arabic' : 'English'}`,
            title: `Switch to ${nextLang}`
        }, nextLang);
        
        headerContainer.appendChild(toggleButton);
        
        toggleButton.addEventListener('click', () => this.toggle());
    }

    /**
     * Toggle between languages
     */
    toggle() {
        const currentState = appStore.getState();
        const currentIndex = this.supportedLanguages.indexOf(currentState.language);
        const nextIndex = (currentIndex + 1) % this.supportedLanguages.length;
        const nextLang = this.supportedLanguages[nextIndex];
        
        this.apply(nextLang);
    }

    /**
     * Apply language settings to the page
     * @param {string} lang - Language code
     */
    apply(lang) {
        if (!this.supportedLanguages.includes(lang)) {
            console.warn(`[LanguageManager] Unsupported language: ${lang}`);
            lang = this.defaultLanguage;
        }
        
        const t = this.translations[lang];
        if (!t && lang !== 'en') {
            console.warn(`[LanguageManager] Translations not found for: ${lang}`);
            return;
        }
        
        // Update DOM attributes
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        
        // Save preference
        safeStorage.setItem('language', lang);
        
        // Update store
        appStore.dispatch({
            type: 'SET_LANGUAGE',
            payload: lang
        });
        
        // Update all translatable elements
        this.updateTranslatableElements(t);
        
        // Update toggle button
        const langToggle = getElement('#langToggle');
        if (langToggle) {
            this.updateToggleText(langToggle, lang);
        }
        
        // Emit event for other components
        appBus.emit('language:changed', { language: lang, direction: lang === 'ar' ? 'rtl' : 'ltr' });
        
        // Announce to screen readers
        this.announceLanguageChange(lang);
    }

    /**
     * Update all elements with data-t attribute
     * @param {Object} translations - Translation object
     */
    updateTranslatableElements(translations) {
        getElements('[data-t]').forEach(el => {
            const key = el.getAttribute('data-t');
            const translation = translations?.[key] || this.translations.en?.[key];
            
            if (translation) {
                if (el.tagName === 'INPUT' && el.type === 'text') {
                    el.placeholder = translation;
                } else if (el.tagName === 'IMG') {
                    el.alt = translation;
                } else {
                    el.textContent = translation;
                }
            }
        });
        
        // Update body class for RTL styling
        document.body.classList.toggle('rtl', document.documentElement.dir === 'rtl');
    }

    /**
     * Update toggle button text
     * @param {HTMLElement} button - Toggle button element
     * @param {string} currentLang - Current language
     */
    updateToggleText(button, currentLang) {
        const nextLang = currentLang === 'en' ? 'AR' : 'EN';
        button.textContent = nextLang;
        button.setAttribute('aria-label', `Switch to ${currentLang === 'en' ? 'Arabic' : 'English'}`);
        button.setAttribute('title', `Switch to ${nextLang}`);
    }

    /**
     * Announce language change to screen readers
     * @param {string} lang - Current language
     */
    announceLanguageChange(lang) {
        const message = lang === 'ar' 
            ? 'تم تغيير اللغة إلى العربية' 
            : 'Language changed to English';
        
        // Remove existing announcement if any
        const existing = getElement('#language-announcement');
        if (existing) {
            existing.remove();
        }
        
        const announcement = createElement('div', {
            id: 'language-announcement',
            role: 'status',
            'aria-live': 'polite',
            className: 'sr-only'
        }, message);
        
        document.body.appendChild(announcement);
        
        // Auto-remove after 2 seconds
        setTimeout(() => announcement.remove(), 2000);
    }

    /**
     * Subscribe to store changes
     */
    subscribeToStore() {
        appStore.subscribe((state, previousState, action) => {
            if (action.type === 'SET_LANGUAGE' && state.language !== previousState.language) {
                // Language was changed via store, sync if needed
                const currentDOMLang = document.documentElement.lang;
                if (state.language !== currentDOMLang) {
                    this.apply(state.language);
                }
            }
        });
    }

    /**
     * Get translation for a key
     * @param {string} key - Translation key
     * @param {string} [lang] - Optional language override
     * @returns {string} Translation or key if not found
     */
    t(key, lang) {
        const language = lang || appStore.getState().language;
        return this.translations[language]?.[key] || this.translations.en?.[key] || key;
    }
}

// Create singleton instance
export const languageManager = new LanguageManager();

export default languageManager;
