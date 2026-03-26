// Modern JavaScript with enhanced UX features
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initMobileMenu();
    initSearch();
    initActiveNavigation();
    initScrollEffects();
    initBackToTop();
    initReadingProgress();
    initIntersectionObserver();
    initSmoothScroll();
    initThemeToggle();
});

// Mobile Menu Toggle
function initMobileMenu() {
    const header = document.querySelector('header .container');
    const nav = document.querySelector('nav');

    // Create mobile menu button
    const menuToggle = document.createElement('button');
    menuToggle.className = 'mobile-menu-toggle';
    menuToggle.setAttribute('aria-label', 'Toggle navigation menu');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.innerHTML = `
        <span></span>
        <span></span>
        <span></span>
    `;

    header.appendChild(menuToggle);

    menuToggle.addEventListener('click', function() {
        const isExpanded = this.getAttribute('aria-expanded') === 'true';
        this.setAttribute('aria-expanded', !isExpanded);
        this.classList.toggle('active');
        nav.classList.toggle('active');
        document.body.style.overflow = isExpanded ? '' : 'hidden';
    });

    // Close menu when clicking on a link
    const navLinks = nav.querySelectorAll('a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', 'false');
            nav.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!nav.contains(e.target) && !menuToggle.contains(e.target) && nav.classList.contains('active')) {
            menuToggle.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', 'false');
            nav.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// Enhanced Search with Debouncing
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    const cardsContainer = document.getElementById('cardsContainer');
    const cards = document.querySelectorAll('.card');

    // Create search wrapper and icon
    const searchBox = searchInput.parentElement;
    searchBox.classList.add('search-wrapper');

    const searchIcon = document.createElement('span');
    searchIcon.className = 'search-icon';
    searchIcon.innerHTML = '🔍';
    searchBox.insertBefore(searchIcon, searchInput);

    // Create clear button
    const clearBtn = document.createElement('button');
    clearBtn.className = 'search-clear';
    clearBtn.innerHTML = '✕';
    clearBtn.setAttribute('aria-label', 'Clear search');
    searchBox.appendChild(clearBtn);

    // Create no results message
    const noResults = document.createElement('div');
    noResults.className = 'no-results';
    noResults.innerHTML = `
        <div class="no-results-icon">🔍</div>
        <h3>No results found</h3>
        <p>Try adjusting your search terms</p>
    `;
    if (cardsContainer) {
        cardsContainer.after(noResults);
    }

    let debounceTimer;

    searchInput.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        const query = this.value.toLowerCase().trim();

        // Show/hide clear button
        clearBtn.classList.toggle('visible', query.length > 0);

        debounceTimer = setTimeout(() => {
            performSearch(query);
        }, 150);
    });

    clearBtn.addEventListener('click', function() {
        searchInput.value = '';
        searchInput.focus();
        clearBtn.classList.remove('visible');
        performSearch('');
    });

    function performSearch(query) {
        let visibleCount = 0;

        cards.forEach(card => {
            const title = card.getAttribute('data-title') || '';
            const content = card.textContent.toLowerCase();
            const searchableText = (title + ' ' + content).toLowerCase();

            if (searchableText.includes(query)) {
                card.style.display = 'block';
                card.style.animation = 'fadeInUp 0.4s ease forwards';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        // Show/hide no results message
        if (cardsContainer) {
            noResults.classList.toggle('visible', visibleCount === 0 && query.length > 0);
        }
        
        // Announce search results to screen readers
        if (query.length > 0) {
            const message = visibleCount === 0 ? 'No results found' : `Found ${visibleCount} result${visibleCount !== 1 ? 's' : ''}`;
            const announcement = document.createElement('div');
            announcement.setAttribute('role', 'status');
            announcement.setAttribute('aria-live', 'polite');
            announcement.className = 'sr-only';
            announcement.textContent = message;
            document.body.appendChild(announcement);
            setTimeout(() => announcement.remove(), 1000);
        }
    }
}

// Active Navigation Highlighting
function initActiveNavigation() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('nav ul li a');

    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Scroll Effects (Header shadow)
function initScrollEffects() {
    const header = document.querySelector('header');
    let lastScroll = 0;

    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;

        // Add/remove scrolled class
        if (currentScroll > 10) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    }, { passive: true });
}

// Back to Top Button
function initBackToTop() {
    const button = document.createElement('button');
    button.className = 'back-to-top';
    button.setAttribute('aria-label', 'Back to top');
    button.innerHTML = '↑';
    document.body.appendChild(button);

    let isVisible = false;

    window.addEventListener('scroll', function() {
        const shouldShow = window.pageYOffset > 500;

        if (shouldShow !== isVisible) {
            isVisible = shouldShow;
            button.classList.toggle('visible', shouldShow);
        }
    }, { passive: true });

    button.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Reading Progress Bar
function initReadingProgress() {
    const progressBar = document.createElement('div');
    progressBar.className = 'reading-progress';
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;

        progressBar.style.width = scrollPercent + '%';
    }, { passive: true });
}

// Intersection Observer for Fade-in Animations – with fallback
function initIntersectionObserver() {
    const sections = document.querySelectorAll('section, h2, h3');
    
    // Helper to check if element is visible in viewport
    function isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top < (window.innerHeight || document.documentElement.clientHeight) &&
            rect.bottom > 0
        );
    }
    
    // Mark currently visible sections immediately
    sections.forEach(section => {
        if (isElementInViewport(section)) {
            section.classList.add('visible');
        }
    });
    
    // Set up observer for the rest (dynamic scrolling)
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    sections.forEach(section => {
        // Only observe sections that aren't already visible
        if (!section.classList.contains('visible')) {
            observer.observe(section);
        }
    });
}

// Smooth Scroll for Anchor Links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Theme Toggle
function initThemeToggle() {
    const toggleButton = document.querySelector('.theme-toggle');
    if (!toggleButton) return;

    // Load saved theme or fallback to system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        toggleButton.textContent = '☀️';
    } else if (savedTheme === 'light') {
        document.body.classList.remove('dark-theme');
        toggleButton.textContent = '🌙';
    } else {
        // Respect system preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark-theme');
            toggleButton.textContent = '☀️';
        }
    }

    toggleButton.addEventListener('click', () => {
        if (document.body.classList.contains('dark-theme')) {
            document.body.classList.remove('dark-theme');
            toggleButton.textContent = '🌙';
            localStorage.setItem('theme', 'light');
        } else {
            document.body.classList.add('dark-theme');
            toggleButton.textContent = '☀️';
            localStorage.setItem('theme', 'dark');
        }
    });
}

// Utility: Throttle function (not used but kept for completeness)
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Utility: Debounce function (not used but kept for completeness)
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Handle visibility change (pause animations when tab is hidden)
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        document.body.classList.add('tab-hidden');
    } else {
        document.body.classList.remove('tab-hidden');
    }
});