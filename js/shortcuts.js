// Keyboard Shortcuts Handler
document.addEventListener('DOMContentLoaded', () => {
    const shortcutsModal = document.getElementById('shortcutsModal');

    // Keyboard event handler
    document.addEventListener('keydown', (e) => {
        // Ignore if user is typing in an input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        // Ignore if modal is open and key is not Escape or ?
        if (shortcutsModal.classList.contains('show') && e.key !== 'Escape' && e.key !== '?') {
            return;
        }

        switch (e.key) {
            // Tab switching (1-3)
            case '1':
                e.preventDefault();
                if (window.switchTab) window.switchTab('all');
                break;
            case '2':
                e.preventDefault();
                if (window.switchTab) window.switchTab('favorites');
                break;
            case '3':
                e.preventDefault();
                if (window.switchTab) window.switchTab('stats');
                break;

            // Theme toggle (T)
            case 't':
            case 'T':
                e.preventDefault();
                if (window.toggleTheme) window.toggleTheme();
                break;

            // Refresh status (R)
            case 'r':
            case 'R':
                e.preventDefault();
                refreshAllStatuses();
                break;

            // Show shortcuts help (?)
            case '?':
                e.preventDefault();
                toggleShortcutsModal();
                break;

            // Close modal (Escape)
            case 'Escape':
                if (shortcutsModal.classList.contains('show')) {
                    e.preventDefault();
                    shortcutsModal.classList.remove('show');
                }
                break;
        }
    });

    // Close modal when clicking outside
    shortcutsModal.addEventListener('click', (e) => {
        if (e.target === shortcutsModal) {
            shortcutsModal.classList.remove('show');
        }
    });

    // Toggle shortcuts modal
    function toggleShortcutsModal() {
        shortcutsModal.classList.toggle('show');
    }

    // Refresh all server statuses
    function refreshAllStatuses() {
        // Show visual feedback
        showRefreshToast();

        // Call the exposed refresh function
        if (window.refreshServerStatus) {
            window.refreshServerStatus();
        }

        // Also manually trigger click on status indicators
        const statusIndicators = document.querySelectorAll('.status-indicator');
        statusIndicators.forEach(indicator => {
            indicator.click();
        });
    }

    // Show refresh toast notification
    function showRefreshToast() {
        const existingToast = document.querySelector('.refresh-toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = 'refresh-toast';
        toast.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
            </svg>
            Обновление статусов...
        `;
        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%) translateY(20px);
            background: var(--bg-card);
            color: var(--text-primary);
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 0.9rem;
            box-shadow: 0 4px 20px var(--shadow);
            border: 1px solid var(--accent-primary);
            opacity: 0;
            transition: all 0.3s ease;
            z-index: 1500;
            display: flex;
            align-items: center;
            gap: 10px;
        `;

        // Add spin animation
        if (!document.querySelector('#spin-animation')) {
            const style = document.createElement('style');
            style.id = 'spin-animation';
            style.textContent = `
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        });

        // Remove after delay
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(20px)';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    // Expose modal toggle for external use
    window.showShortcutsHelp = toggleShortcutsModal;
});
