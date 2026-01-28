// Theme Toggle Functionality
document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;

    // Check for saved theme preference or default to dark
    const currentTheme = localStorage.getItem('theme') || 'dark';

    // Apply saved theme on page load
    if (currentTheme === 'light') {
        body.classList.add('light-theme');
    }

    // Toggle theme on button click
    themeToggle.addEventListener('click', () => {
        // Add will-change for GPU acceleration before animation
        body.style.willChange = 'background-color, color';
        document.querySelectorAll('.bg-layer, .bg-overlay').forEach(el => {
            el.style.willChange = 'opacity, background';
        });

        body.classList.toggle('light-theme');

        // Save theme preference
        const theme = body.classList.contains('light-theme') ? 'light' : 'dark';
        localStorage.setItem('theme', theme);

        // Add ripple effect on button
        createRipple(themeToggle);

        // Remove will-change after transition completes (350ms)
        setTimeout(() => {
            body.style.willChange = '';
            document.querySelectorAll('.bg-layer, .bg-overlay').forEach(el => {
                el.style.willChange = '';
            });
        }, 350);
    });

    // Expose toggle function for keyboard shortcuts
    window.toggleTheme = () => {
        themeToggle.click();
    };

    // Create ripple effect
    function createRipple(button) {
        const ripple = document.createElement('span');
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;

        ripple.style.width = ripple.style.height = `${diameter}px`;
        ripple.style.left = '50%';
        ripple.style.top = '50%';
        ripple.style.transform = 'translate(-50%, -50%)';
        ripple.style.position = 'absolute';
        ripple.style.borderRadius = '50%';
        ripple.style.background = 'rgba(255, 255, 255, 0.3)';
        ripple.style.animation = 'ripple 0.6s ease-out';
        ripple.style.pointerEvents = 'none';

        button.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    // Add CSS for ripple animation
    if (!document.querySelector('#ripple-animation')) {
        const style = document.createElement('style');
        style.id = 'ripple-animation';
        style.textContent = `
            @keyframes ripple {
                from {
                    transform: translate(-50%, -50%) scale(0);
                    opacity: 1;
                }
                to {
                    transform: translate(-50%, -50%) scale(2);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
});
