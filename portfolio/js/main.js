
'use strict';

const typedTextElement = document.getElementById('typed-text');
const roles = [
    'DevOps Engineer',
    'Software Developer',
    'Cloud Enthusiast',
    'ICT Student',
    'Problem Solver'
];

let roleIndex = 0;
let charIndex = 0;
let isDeleting = false;
let typingDelay = 100;

function typeEffect() {
    const currentRole = roles[roleIndex];
    
    if (isDeleting) {
        typedTextElement.textContent = currentRole.substring(0, charIndex - 1);
        charIndex--;
        typingDelay = 50;
    } else {
        typedTextElement.textContent = currentRole.substring(0, charIndex + 1);
        charIndex++;
        typingDelay = 100;
    }
    
    if (!isDeleting && charIndex === currentRole.length) {
        // Pause at end before deleting
        typingDelay = 2000;
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        typingDelay = 500;
    }
    
    setTimeout(typeEffect, typingDelay);
}

// Start typing animation when page loads
if (typedTextElement) {
    setTimeout(typeEffect, 1000);
}

// MOBILE MENU TOGGLE
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
        
        // Animate hamburger icon
        const isOpen = !mobileMenu.classList.contains('hidden');
        mobileMenuBtn.setAttribute('aria-expanded', isOpen);
    });

    // Close mobile menu when clicking on a link
    const mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
        });
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            mobileMenu.classList.add('hidden');
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
        }
    });
}

// NAVBAR SCROLL EFFECT
const navbar = document.getElementById('navbar');
let lastScrollTop = 0;

window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Add background when scrolled
    if (scrollTop > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    
    lastScrollTop = scrollTop;
});

// ACTIVE NAVIGATION LINK ON SCROLL
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('nav a[href^="#"]');

function setActiveLink() {
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        
        if (window.pageYOffset >= sectionTop - 150) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === current) {
            link.classList.add('active');
        }
    });
}

window.addEventListener('scroll', setActiveLink);
setActiveLink(); // Call on page load

// SMOOTH SCROLL FOR NAVIGATION LINKS
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').slice(1);
        const targetSection = document.getElementById(targetId);
        
        if (targetSection) {
            const offsetTop = targetSection.offsetTop - 80; // Account for fixed nav
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// INTERSECTION OBSERVER FOR ANIMATIONS
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const fadeInObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            fadeInObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe elements for fade-in animation
const animateElements = document.querySelectorAll('.group, .bg-white.rounded-2xl, .text-center.p-6');
animateElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    fadeInObserver.observe(el);
});

// SCROLL PROGRESS INDICATOR
const createScrollProgress = () => {
    const progressBar = document.createElement('div');
    progressBar.id = 'scroll-progress';
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 3px;
        background: #1e40af;
        z-index: 9999;
        transition: width 0.1s ease;
    `;
    document.body.appendChild(progressBar);
    
    window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        progressBar.style.width = scrolled + '%';
    });
};

createScrollProgress();

// BACK TO TOP BUTTON
const backToTopBtn = document.createElement('button');
backToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
backToTopBtn.className = 'fixed bottom-8 right-8 bg-blue-700 text-white w-12 h-12 rounded-lg shadow-lg hover:bg-blue-800 transition-all duration-200 opacity-0 pointer-events-none z-50 flex items-center justify-center';
backToTopBtn.setAttribute('aria-label', 'Back to top');
backToTopBtn.style.transition = 'opacity 0.2s ease';
document.body.appendChild(backToTopBtn);

window.addEventListener('scroll', () => {
    if (window.pageYOffset > 500) {
        backToTopBtn.style.opacity = '1';
        backToTopBtn.style.pointerEvents = 'auto';
    } else {
        backToTopBtn.style.opacity = '0';
        backToTopBtn.style.pointerEvents = 'none';
    }
});

backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

//  DYNAMIC YEAR IN FOOTER
const updateFooterYear = () => {
    const currentYear = new Date().getFullYear();
    const footerYearElements = document.querySelectorAll('footer p');
    footerYearElements.forEach(el => {
        if (el.textContent.includes('©')) {
            el.textContent = el.textContent.replace(/\d{4}/, currentYear);
        }
    });
};

updateFooterYear();

//  PERFORMANCE OPTIMIZATION

// Lazy load images
const lazyImages = document.querySelectorAll('img[loading="lazy"]');
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src || img.src;
                img.classList.add('loaded');
                imageObserver.unobserve(img);
            }
        });
    });
    
    lazyImages.forEach(img => imageObserver.observe(img));
}

// KEYBOARD NAVIGATION

document.addEventListener('keydown', (e) => {
    // Press 'Escape' to close mobile menu
    if (e.key === 'Escape' && mobileMenu && !mobileMenu.classList.contains('hidden')) {
        mobileMenu.classList.add('hidden');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
    }
    
    // Press 'Home' to scroll to top
    if (e.key === 'Home' && e.ctrlKey) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

// PARTICLE CURSOR EFFECT (Optional)

const createParticleCursor = () => {
    const coords = { x: 0, y: 0 };
    const circles = [];
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899'];
    
    for (let i = 0; i < 12; i++) {
        const circle = document.createElement('div');
        circle.style.cssText = `
            position: fixed;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            pointer-events: none;
            z-index: 9998;
            transition: all 0.3s ease;
            opacity: 0;
        `;
        document.body.appendChild(circle);
        circles.push(circle);
    }
    
    window.addEventListener('mousemove', (e) => {
        coords.x = e.clientX;
        coords.y = e.clientY;
    });
    
    function animateCircles() {
        let x = coords.x;
        let y = coords.y;
        
        circles.forEach((circle, index) => {
            circle.style.left = x - 4 + 'px';
            circle.style.top = y - 4 + 'px';
            circle.style.transform = `scale(${(circles.length - index) / circles.length})`;
            circle.style.opacity = (circles.length - index) / circles.length * 0.5;
            circle.style.background = colors[index % colors.length];
            
            const nextCircle = circles[index + 1] || circles[0];
            x += (nextCircle.offsetLeft - x) * 0.3;
            y += (nextCircle.offsetTop - y) * 0.3;
        });
        
        requestAnimationFrame(animateCircles);
    }
    
    // Only enable on desktop
    if (window.innerWidth > 768) {
        animateCircles();
    }
};

// Uncomment to enable particle cursor effect
createParticleCursor();

//  CONSOLE EASTER EGG
console.log('%c👋 Hello there, curious developer!', 'color: #3b82f6; font-size: 24px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.1);');
console.log('%c🚀 Thanks for visiting my portfolio!', 'color: #8b5cf6; font-size: 18px; font-weight: bold;');
console.log('%c💼 Feel free to reach out if you want to collaborate!', 'color: #4b5563; font-size: 14px;');
console.log('%c📧 Email: giftnyadzani28@gmail.com', 'color: #059669; font-size: 14px;');
console.log('%c🔗 GitHub: https://github.com/nyadzani26', 'color: #dc2626; font-size: 14px;');

//  PAGE LOAD ANIMATION
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
    
    // Remove loading class after animations
    setTimeout(() => {
        document.body.style.overflow = 'visible';
    }, 500);
});

