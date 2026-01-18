// Enhanced Navigation JavaScript for improved UX
class NavigationEnhancer {
    constructor() {
        this.init();
    }

    init() {
        this.setupMobileToggle();
        this.setupActiveStates();
        this.setupSmoothScrolling();
        this.setupKeyboardNavigation();
        this.setupLoadingStates();
    }

    // Mobile Navigation Toggle
    setupMobileToggle() {
        const mobileToggle = document.querySelector('.mobile-toggle');
        const navMenu = document.querySelector('nav ul');
        
        if (mobileToggle && navMenu) {
            mobileToggle.addEventListener('click', () => {
                mobileToggle.classList.toggle('active');
                navMenu.classList.toggle('mobile-open');
                
                // Update aria attributes for accessibility
                const isOpen = navMenu.classList.contains('mobile-open');
                mobileToggle.setAttribute('aria-expanded', isOpen);
                navMenu.setAttribute('aria-hidden', !isOpen);
            });

            // Close mobile menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!mobileToggle.contains(e.target) && !navMenu.contains(e.target)) {
                    mobileToggle.classList.remove('active');
                    navMenu.classList.remove('mobile-open');
                    mobileToggle.setAttribute('aria-expanded', 'false');
                    navMenu.setAttribute('aria-hidden', 'true');
                }
            });

            // Close mobile menu on window resize
            window.addEventListener('resize', () => {
                if (window.innerWidth > 768) {
                    mobileToggle.classList.remove('active');
                    navMenu.classList.remove('mobile-open');
                    mobileToggle.setAttribute('aria-expanded', 'false');
                    navMenu.setAttribute('aria-hidden', 'false');
                }
            });
        }
    }

    // Active State Management
    setupActiveStates() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('nav a[href]');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            
            // Mark active link
            if (href === currentPath || (currentPath === '/' && href === '/')) {
                link.classList.add('active');
                link.setAttribute('aria-current', 'page');
            } else {
                link.classList.remove('active');
                link.removeAttribute('aria-current');
            }
        });
    }

    // Smooth Scrolling for anchor links
    setupSmoothScrolling() {
        const anchorLinks = document.querySelectorAll('a[href^="#"]');
        
        anchorLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const targetId = link.getAttribute('href').slice(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    e.preventDefault();
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    
                    // Close mobile menu if open
                    const navMenu = document.querySelector('nav ul');
                    const mobileToggle = document.querySelector('.mobile-toggle');
                    if (navMenu && navMenu.classList.contains('mobile-open')) {
                        mobileToggle.classList.remove('active');
                        navMenu.classList.remove('mobile-open');
                    }
                }
            });
        });
    }

    // Keyboard Navigation Enhancement
    setupKeyboardNavigation() {
        const navItems = document.querySelectorAll('nav a, nav button');
        
        navItems.forEach((item, index) => {
            item.addEventListener('keydown', (e) => {
                let targetIndex;
                
                switch(e.key) {
                    case 'ArrowRight':
                    case 'ArrowDown':
                        e.preventDefault();
                        targetIndex = (index + 1) % navItems.length;
                        navItems[targetIndex].focus();
                        break;
                        
                    case 'ArrowLeft':
                    case 'ArrowUp':
                        e.preventDefault();
                        targetIndex = index === 0 ? navItems.length - 1 : index - 1;
                        navItems[targetIndex].focus();
                        break;
                        
                    case 'Home':
                        e.preventDefault();
                        navItems[0].focus();
                        break;
                        
                    case 'End':
                        e.preventDefault();
                        navItems[navItems.length - 1].focus();
                        break;
                        
                    case 'Escape':
                        // Close mobile menu if open
                        const navMenu = document.querySelector('nav ul');
                        const mobileToggle = document.querySelector('.mobile-toggle');
                        if (navMenu && navMenu.classList.contains('mobile-open')) {
                            mobileToggle.classList.remove('active');
                            navMenu.classList.remove('mobile-open');
                            mobileToggle.focus();
                        }
                        break;
                }
            });
        });
    }

    // Loading States for Navigation Actions
    setupLoadingStates() {
        const actionButtons = document.querySelectorAll('.btn-login, .btn-register');
        
        actionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // Add loading state
                button.classList.add('btn-loading');
                button.disabled = true;
                
                // Store original text
                const originalText = button.textContent;
                
                // Simulate loading (remove this in production)
                setTimeout(() => {
                    button.classList.remove('btn-loading');
                    button.disabled = false;
                    button.textContent = originalText;
                }, 2000);
            });
        });
    }

    // Add visual feedback for user interactions
    addVisualFeedback() {
        const interactiveElements = document.querySelectorAll('nav a, nav button');
        
        interactiveElements.forEach(element => {
            element.addEventListener('click', (e) => {
                // Create ripple effect
                const ripple = document.createElement('span');
                const rect = element.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                ripple.style.cssText = `
                    position: absolute;
                    width: ${size}px;
                    height: ${size}px;
                    left: ${x}px;
                    top: ${y}px;
                    background: rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    transform: scale(0);
                    animation: ripple 0.6s linear;
                    pointer-events: none;
                    z-index: 1000;
                `;
                
                element.style.position = 'relative';
                element.style.overflow = 'hidden';
                element.appendChild(ripple);
                
                // Remove ripple after animation
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });
        
        // Add CSS for ripple animation
        if (!document.querySelector('#ripple-styles')) {
            const style = document.createElement('style');
            style.id = 'ripple-styles';
            style.textContent = `
                @keyframes ripple {
                    to {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const navEnhancer = new NavigationEnhancer();
    navEnhancer.addVisualFeedback();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NavigationEnhancer;
}