/**
 * Utility Functions Module
 * Enhanced with caching, validation, and performance optimizations
 */

/**
 * Debounce function with adaptive timing
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {boolean} immediate - Execute on leading edge
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 150, immediate = false) {
    let timeout;
    let lastCallTime = 0;
    
    const debounced = (...args) => {
        const now = Date.now();
        const callImmediately = immediate && !timeout;
        
        clearTimeout(timeout);
        
        timeout = setTimeout(() => {
            lastCallTime = now;
            func.apply(this, args);
        }, callImmediately ? 0 : wait);
        
        if (callImmediately) {
            func.apply(this, args);
        }
    };
    
    // Add cancel method
    debounced.cancel = () => {
        clearTimeout(timeout);
        timeout = null;
    };
    
    // Add flush method
    debounced.flush = (...args) => {
        clearTimeout(timeout);
        return func.apply(this, args);
    };
    
    return debounced;
}

/**
 * Throttle function to limit execution rate
 * @param {Function} func - Function to throttle
 * @param {number} limit - Minimum time between calls in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit = 100) {
    let inThrottle;
    let lastResult;
    
    const throttled = (...args) => {
        if (!inThrottle) {
            lastResult = func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
        return lastResult;
    };
    
    return throttled;
}

/**
 * Get single element by selector with error handling
 * @param {string} selector - CSS selector
 * @param {Document|Element} context - Context to search in
 * @returns {Element|null} DOM element or null
 */
export function getElement(selector, context = document) {
    try {
        return context.querySelector(selector);
    } catch (error) {
        console.error(`[Utils] Invalid selector: ${selector}`, error);
        return null;
    }
}

/**
 * Get multiple elements by selector with error handling
 * @param {string} selector - CSS selector
 * @param {Document|Element} context - Context to search in
 * @returns {NodeList} NodeList of elements
 */
export function getElements(selector, context = document) {
    try {
        return context.querySelectorAll(selector);
    } catch (error) {
        console.error(`[Utils] Invalid selector: ${selector}`, error);
        return [];
    }
}

/**
 * Safely get nested object property
 * @param {Object} obj - Object to search
 * @param {string} path - Dot-separated path
 * @param {*} defaultValue - Default value if not found
 * @returns {*} Property value or default
 */
export function getNestedProperty(obj, path, defaultValue = undefined) {
    if (!obj || !path) {
        return defaultValue;
    }
    
    try {
        return path.split('.').reduce((current, key) => current?.[key], obj) ?? defaultValue;
    } catch (error) {
        return defaultValue;
    }
}

/**
 * Cache DOM queries for performance with automatic cleanup
 */
export class DOMCache {
    constructor() {
        this.cache = new Map();
        this.maxSize = 100;
    }
    
    /**
     * Get cached element or query and cache it
     * @param {string} selector - CSS selector
     * @param {boolean} multiple - Get multiple elements
     * @param {Document|Element} context - Context to search in
     * @returns {Element|NodeList|null} Cached DOM element(s)
     */
    query(selector, multiple = false, context = document) {
        const cacheKey = `${multiple ? 'multi:' : 'single:'}${selector}`;
        
        if (!this.cache.has(cacheKey)) {
            // Enforce max cache size
            if (this.cache.size >= this.maxSize) {
                const firstKey = this.cache.keys().next().value;
                this.cache.delete(firstKey);
            }
            
            const result = multiple ? 
                getElements(selector, context) : 
                getElement(selector, context);
            this.cache.set(cacheKey, result);
        }
        
        return this.cache.get(cacheKey);
    }
    
    /**
     * Clear specific cache entry
     * @param {string} selector - CSS selector
     */
    clear(selector) {
        const keys = [`single:${selector}`, `multi:${selector}`];
        keys.forEach(key => this.cache.delete(key));
    }
    
    /**
     * Clear entire cache
     */
    clearAll() {
        this.cache.clear();
    }
    
    /**
     * Get cache statistics
     * @returns {Object} Cache stats
     */
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Create singleton instance
export const domCache = new DOMCache();

/**
 * Create element with attributes and children safely
 * @param {string} tag - HTML tag name
 * @param {Object} attributes - Element attributes
 * @param {Array|string} children - Child elements or text
 * @returns {HTMLElement} Created element
 */
export function createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    
    // Set attributes safely
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else if (key.startsWith('data-')) {
            element.setAttribute(key, value);
        } else if (key.startsWith('on') && typeof value === 'function') {
            element.addEventListener(key.slice(2).toLowerCase(), value);
        } else {
            element.setAttribute(key, value);
        }
    });
    
    // Add children safely
    if (children) {
        const childArray = Array.isArray(children) ? children : [children];
        childArray.forEach(child => {
            if (typeof child === 'string') {
                element.textContent = child;
            } else if (child instanceof Node) {
                element.appendChild(child);
            }
        });
    }
    
    return element;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Validate localStorage availability
 * @returns {boolean} True if localStorage is available
 */
export function isLocalStorageAvailable() {
    try {
        const test = '__storage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Safe localStorage operations with fallback
 */
export const safeStorage = {
    getItem(key) {
        if (!isLocalStorageAvailable()) return null;
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.warn('[Utils] localStorage getItem failed:', e);
            return null;
        }
    },
    
    setItem(key, value) {
        if (!isLocalStorageAvailable()) return false;
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (e) {
            console.warn('[Utils] localStorage setItem failed:', e);
            return false;
        }
    },
    
    removeItem(key) {
        if (!isLocalStorageAvailable()) return false;
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.warn('[Utils] localStorage removeItem failed:', e);
            return false;
        }
    }
};

export default {
    debounce,
    throttle,
    getElement,
    getElements,
    getNestedProperty,
    DOMCache,
    domCache,
    createElement,
    escapeHTML,
    isLocalStorageAvailable,
    safeStorage
};
