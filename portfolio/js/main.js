'use strict';

// ============================
// CONFIGURATION & CONSTANTS
// ============================
const CONFIG = {
    typingSpeed: 100,
    typingDelay: 2000,
    scrollOffset: 80,
    animationThreshold: 0.1,
    resizeDebounce: 250
};

// ============================
// TYPING ANIMATION ENHANCEMENT
// ============================
class TypingAnimation {
    constructor() {
        this.typedTextElement = document.getElementById('typed-text');
        this.roles = [
            'DevOps Engineer',
            'Cloud Specialist',
            'Infrastructure Developer',
            'Automation Expert',
            'CI/CD Architect'
        ];
        this.state = {
            roleIndex: 0,
            charIndex: 0,
            isDeleting: false,
            typingDelay: CONFIG.typingSpeed
        };
    }

    init() {
        if (!this.typedTextElement) return;

        // Start animation after a brief delay
        setTimeout(() => {
            this.typeEffect();
        }, 1000);
    }

    typeEffect() {
        const currentRole = this.roles[this.state.roleIndex];

        if (this.state.isDeleting) {
            // Deleting text
            this.typedTextElement.textContent = currentRole.substring(0, this.state.charIndex - 1);
            this.state.charIndex--;
            this.state.typingDelay = 50;
        } else {
            // Typing text
            this.typedTextElement.textContent = currentRole.substring(0, this.state.charIndex + 1);
            this.state.charIndex++;
            this.state.typingDelay = CONFIG.typingSpeed;
        }

        if (!this.state.isDeleting && this.state.charIndex === currentRole.length) {
            // Pause at end before deleting
            this.state.typingDelay = CONFIG.typingDelay;
            this.state.isDeleting = true;
        } else if (this.state.isDeleting && this.state.charIndex === 0) {
            // Move to next role
            this.state.isDeleting = false;
            this.state.roleIndex = (this.state.roleIndex + 1) % this.roles.length;
            this.state.typingDelay = 500;
        }

        setTimeout(() => this.typeEffect(), this.state.typingDelay);
    }
}

// ============================
// NAVIGATION MANAGER
// ============================
class NavigationManager {
    constructor() {
        this.navbar = document.getElementById('navbar');
        this.mobileMenuBtn = document.getElementById('mobile-menu-btn');
        this.mobileMenu = document.getElementById('mobile-menu');
        this.navLinks = document.querySelectorAll('nav a[href^="#"]');
        this.sections = document.querySelectorAll('section[id]');
        this.lastScrollTop = 0;
        this.isMobileMenuOpen = false;
    }

    init() {
        this.initMobileMenu();
        this.initScrollEffects();
        this.initSmoothScrolling();
        this.initActiveSection();
    }

    initMobileMenu() {
        if (!this.mobileMenuBtn || !this.mobileMenu) return;

        this.mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMobileMenu();
        });

        // Close mobile menu when clicking on links
        this.mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isMobileMenuOpen &&
                !this.mobileMenu.contains(e.target) &&
                !this.mobileMenuBtn.contains(e.target)) {
                this.closeMobileMenu();
            }
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMobileMenuOpen) {
                this.closeMobileMenu();
            }
        });
    }

    toggleMobileMenu() {
        this.mobileMenu.classList.toggle('hidden');
        this.isMobileMenuOpen = !this.mobileMenu.classList.contains('hidden');

        // Update aria attributes
        this.mobileMenuBtn.setAttribute('aria-expanded', this.isMobileMenuOpen);

        // Animate hamburger icon
        const icon = this.mobileMenuBtn.querySelector('svg');
        if (icon && this.isMobileMenuOpen) {
            icon.style.transform = 'rotate(90deg)';
        } else if (icon) {
            icon.style.transform = 'rotate(0deg)';
        }
    }

    closeMobileMenu() {
        this.mobileMenu.classList.add('hidden');
        this.isMobileMenuOpen = false;
        this.mobileMenuBtn.setAttribute('aria-expanded', 'false');

        const icon = this.mobileMenuBtn.querySelector('svg');
        if (icon) {
            icon.style.transform = 'rotate(0deg)';
        }
    }

    initScrollEffects() {
        let scrollTimer;

        window.addEventListener('scroll', () => {
            // Clear the timeout
            clearTimeout(scrollTimer);

            // Add scrolled class immediately
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

            if (scrollTop > 50) {
                this.navbar.classList.add('scrolled', 'shadow-lg');
            } else {
                this.navbar.classList.remove('scrolled', 'shadow-lg');
            }

            // Hide navbar on scroll down, show on scroll up
            if (scrollTop > this.lastScrollTop && scrollTop > 200) {
                this.navbar.style.transform = 'translateY(-100%)';
            } else {
                this.navbar.style.transform = 'translateY(0)';
            }

            this.lastScrollTop = scrollTop;

            // Set a timeout to run after scrolling stops
            scrollTimer = setTimeout(() => {
                this.navbar.style.transform = 'translateY(0)';
            }, 150);
        }, { passive: true });
    }

    initSmoothScrolling() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').slice(1);
                const targetSection = document.getElementById(targetId);

                if (targetSection) {
                    const offsetTop = targetSection.offsetTop - CONFIG.scrollOffset;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    initActiveSection() {
        const observerOptions = {
            threshold: 0.3,
            rootMargin: `-${CONFIG.scrollOffset}px 0px -50% 0px`
        };

        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const currentSection = entry.target.getAttribute('id');
                    this.setActiveNavLink(currentSection);
                }
            });
        }, observerOptions);

        this.sections.forEach(section => {
            sectionObserver.observe(section);
        });
    }

    setActiveNavLink(sectionId) {
        this.navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${sectionId}`) {
                link.classList.add('active');
            }
        });
    }
}

// ============================
// SCROLL MANAGER
// ============================
class ScrollManager {
    constructor() {
        this.backToTopBtn = document.getElementById('back-to-top');
        this.scrollProgress = document.getElementById('scroll-progress');
    }

    init() {
        this.initBackToTop();
        this.initScrollProgress();
        this.initScrollAnimations();
    }

    initBackToTop() {
        if (!this.backToTopBtn) return;

        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                this.backToTopBtn.classList.remove('hidden');
                this.backToTopBtn.classList.add('show');
                this.backToTopBtn.classList.remove('hide');
            } else {
                this.backToTopBtn.classList.add('hide');
                this.backToTopBtn.classList.remove('show');

                // Hide completely after animation
                setTimeout(() => {
                    if (window.pageYOffset <= 300) {
                        this.backToTopBtn.classList.add('hidden');
                    }
                }, 200);
            }
        });

        this.backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    initScrollProgress() {
        if (!this.scrollProgress) return;

        window.addEventListener('scroll', () => {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            this.scrollProgress.style.width = scrolled + '%';
        }, { passive: true });
    }

    initScrollAnimations() {
        const animateOnScroll = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-in-up');
                    observer.unobserve(entry.target);
                }
            });
        };

        const animationObserver = new IntersectionObserver(animateOnScroll, {
            threshold: CONFIG.animationThreshold,
            rootMargin: '0px 0px -50px 0px'
        });

        // Observe elements for animation
        const elementsToAnimate = document.querySelectorAll(
            '.project-card, .skill-category, .certificate-card, .contact-card'
        );

        elementsToAnimate.forEach((el, index) => {
            el.style.animationDelay = `${(index % 6) * 0.1}s`;
            animationObserver.observe(el);
        });
    }
}

// ============================
// PERFORMANCE MANAGER
// ============================
class PerformanceManager {
    constructor() {
        this.resizeTimeout = null;
    }

    init() {
        this.initResizeHandler();
        this.initLoadOptimizations();
        this.initErrorTracking();
        this.initPerformanceMonitoring();
    }

    initResizeHandler() {
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, CONFIG.resizeDebounce);
        });
    }

    handleResize() {
        // Close mobile menu on resize to desktop
        if (window.innerWidth >= 1024) {
            const mobileMenu = document.getElementById('mobile-menu');
            const mobileMenuBtn = document.getElementById('mobile-menu-btn');

            if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.add('hidden');
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
            }
        }
    }

    initLoadOptimizations() {
        // Lazy load images
        this.initLazyLoading();

        // Preload critical resources
        this.preloadCriticalResources();

        // Initialize after load
        window.addEventListener('load', () => {
            this.handlePageLoad();
        });
    }

    initLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;

                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.classList.add('loaded');
                        }

                        if (img.dataset.srcset) {
                            img.srcset = img.dataset.srcset;
                        }

                        imageObserver.unobserve(img);
                    }
                });
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    preloadCriticalResources() {
        // Preload above-the-fold images
        const criticalImages = document.querySelectorAll('img[data-critical]');
        criticalImages.forEach(img => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = img.dataset.src || img.src;
            document.head.appendChild(link);
        });
    }

    handlePageLoad() {
        document.body.classList.add('loaded');

        // Remove loading states
        const loadingElements = document.querySelectorAll('.loading-skeleton');
        loadingElements.forEach(el => {
            el.classList.remove('loading-skeleton');
        });

        // Log performance metrics
        this.logPerformanceMetrics();
    }

    initErrorTracking() {
        window.addEventListener('error', (e) => {
            console.error('Page error:', e.error);
            // Here you could send to error tracking service
        });

        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
        });
    }

    initPerformanceMonitoring() {
        // Monitor long tasks
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.duration > 50) {
                        console.warn('Long task detected:', entry);
                    }
                }
            });

            observer.observe({ entryTypes: ['longtask'] });
        }
    }

    logPerformanceMetrics() {
        if ('performance' in window) {
            const perfData = performance.timing;
            const loadTime = perfData.loadEventEnd - perfData.navigationStart;
            const domReadyTime = perfData.domContentLoadedEventEnd - perfData.navigationStart;

            console.log(`🚀 Page loaded in ${loadTime}ms`);
            console.log(`📄 DOM ready in ${domReadyTime}ms`);

            // Log Core Web Vitals if available
            if ('webVitals' in window) {
                window.webVitals.getCLS(console.log);
                window.webVitals.getFID(console.log);
                window.webVitals.getLCP(console.log);
            }
        }
    }
}

// ============================
// INTERACTIVITY MANAGER
// ============================
class InteractivityManager {
    constructor() {
        this.intersectionObserver = null;
    }

    init() {
        this.initHoverEffects();
        this.initClickEffects();
        this.initFormInteractions();
        this.initKeyboardNavigation();
    }

    initHoverEffects() {
        // Add hover effects to interactive elements
        const hoverElements = document.querySelectorAll('.btn-primary, .btn-secondary, .project-card, .contact-card');

        hoverElements.forEach(element => {
            element.addEventListener('mouseenter', this.handleMouseEnter);
            element.addEventListener('mouseleave', this.handleMouseLeave);
        });
    }

    handleMouseEnter(e) {
        const element = e.currentTarget;
        element.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    }

    handleMouseLeave(e) {
        const element = e.currentTarget;
        // Reset any transform changes
        element.style.transform = '';
    }

    initClickEffects() {
        // Add ripple effect to buttons
        const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');

        buttons.forEach(button => {
            button.addEventListener('click', this.createRippleEffect);
        });
    }

    createRippleEffect(e) {
        const button = e.currentTarget;
        const circle = document.createElement('span');
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;

        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${e.clientX - button.offsetLeft - radius}px`;
        circle.style.top = `${e.clientY - button.offsetTop - radius}px`;
        circle.classList.add('ripple');

        const ripple = button.getElementsByClassName('ripple')[0];
        if (ripple) {
            ripple.remove();
        }

        button.appendChild(circle);
    }

    initFormInteractions() {
        // Enhanced form interactions for certificates filter
        const filterForm = document.getElementById('cert-filter');
        if (filterForm) {
            const inputs = filterForm.querySelectorAll('input');

            inputs.forEach(input => {
                input.addEventListener('focus', () => {
                    input.parentElement.classList.add('focused');
                });

                input.addEventListener('blur', () => {
                    if (!input.value) {
                        input.parentElement.classList.remove('focused');
                    }
                });
            });
        }
    }

    initKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Skip navigation for form elements
            if (e.target.matches('input, textarea, select')) return;

            switch (e.key) {
                case 'Home':
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    break;
                case 'End':
                    e.preventDefault();
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                    break;
                case 'Tab':
                    this.handleTabNavigation(e);
                    break;
            }
        });
    }

    handleTabNavigation(e) {
        // Add focus styles for keyboard navigation
        document.body.classList.add('keyboard-navigation');

        // Remove focus styles on mouse interaction
        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        }, { once: true });
    }
}

// ============================
// ANALYTICS & FEEDBACK MANAGER
// ============================
class AnalyticsManager {
    constructor() {
        this.visitedSections = new Set();
    }

    init() {
        this.initSectionTracking();
        this.initClickTracking();
        this.initConsoleGreeting();
    }

    initSectionTracking() {
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.visitedSections.has(entry.target.id)) {
                    this.visitedSections.add(entry.target.id);
                    this.trackSectionView(entry.target.id);
                }
            });
        }, { threshold: 0.5 });

        document.querySelectorAll('section[id]').forEach(section => {
            sectionObserver.observe(section);
        });
    }

    trackSectionView(sectionId) {
        console.log(`📊 Section viewed: ${sectionId}`);
        // Here you could send to analytics service
        // Example: gtag('event', 'section_view', { section_name: sectionId });
    }

    initClickTracking() {
        // Track outbound links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="http"]');
            if (link && !link.href.includes(window.location.hostname)) {
                this.trackOutboundLink(link.href);
            }
        });
    }

    trackOutboundLink(url) {
        console.log(`🔗 Outbound click: ${url}`);
        // Here you could send to analytics service
    }

    initConsoleGreeting() {
        const styles = [
            'color: #10b981; font-size: 18px; font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);',
            'color: #64748b; font-size: 14px; font-weight: bold;',
            'color: #475569; font-size: 12px;',
            'color: #059669; font-size: 12px;',
            'color: #dc2626; font-size: 12px;'
        ];

        console.log('%c👋 Hello there, curious developer!', styles[0]);
        console.log('%c🚀 Thanks for checking out my DevOps portfolio!', styles[1]);
        console.log('%c💼 Interested in collaboration? Feel free to reach out!', styles[2]);
        console.log('%c📧 Email: giftnyadzani28@gmail.com', styles[3]);
        console.log('%c🔗 GitHub: https://github.com/nyadzani26', styles[4]);

        // Easter egg for recruiters
        console.log('%c🎯 Recruiter? Check out my projects and DevOps skills!', 'color: #7c3aed; font-size: 14px; font-weight: bold;');
    }
}

// ============================
// MAIN APPLICATION INITIALIZATION
// ============================
class PortfolioApp {
    constructor() {
        this.typingAnimation = new TypingAnimation();
        this.navigationManager = new NavigationManager();
        this.scrollManager = new ScrollManager();
        this.performanceManager = new PerformanceManager();
        this.interactivityManager = new InteractivityManager();
        this.analyticsManager = new AnalyticsManager();

        this.isInitialized = false;
    }

    init() {
        if (this.isInitialized) return;

        try {
            // Initialize all modules
            this.typingAnimation.init();
            this.navigationManager.init();
            this.scrollManager.init();
            this.performanceManager.init();
            this.interactivityManager.init();
            this.analyticsManager.init();

            this.isInitialized = true;
            console.log('🎉 Portfolio application initialized successfully!');

        } catch (error) {
            console.error('❌ Error initializing portfolio app:', error);
        }
    }

    // Public methods for external access if needed
    refreshAnimations() {
        this.scrollManager.initScrollAnimations();
    }

    trackEvent(eventName, data) {
        this.analyticsManager.trackCustomEvent(eventName, data);
    }
}

// ============================
// INSTANTIATE AND INITIALIZE
// ============================
document.addEventListener('DOMContentLoaded', () => {
    // Create global app instance
    window.portfolioApp = new PortfolioApp();

    // Initialize the application
    window.portfolioApp.init();

    // Make app available globally for debugging
    window.debugApp = window.portfolioApp;
});

// ============================
// UTILITY FUNCTIONS
// ============================
const Utils = {
    // Debounce function for performance
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function for scroll events
    throttle(func, limit) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Check if element is in viewport
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },

    // Format file sizes
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
};

// Export utils for global access if needed
window.PortfolioUtils = Utils;

// ============================
// ERROR BOUNDARY
// ============================
window.addEventListener('error', (e) => {
    console.error('Global error caught:', e.error);
    // You could send this to an error tracking service
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    e.preventDefault();
});

// ============================
// SERVICE WORKER REGISTRATION (Optional)
// ============================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // You can register a service worker here for offline functionality
        // navigator.serviceWorker.register('/sw.js')
        //   .then(registration => console.log('SW registered'))
        //   .catch(error => console.log('SW registration failed'));
    });
}