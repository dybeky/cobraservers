// Server Tabs and Favorites System
document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const serverCards = document.querySelectorAll('.server-status[data-server-id]');
    const favoritesCount = document.querySelector('.favorites-count');
    const serversGrid = document.querySelector('.servers-grid');
    const wipeTimer = document.querySelector('.wipe-timer');
    const statsSection = document.getElementById('statsSection');

    // Load favorites from localStorage
    let favorites = JSON.parse(localStorage.getItem('serverFavorites') || '[]');

    // Initialize
    initFavorites();
    updateFavoritesCount();

    // Tab switching
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;

            // Update active tab
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Handle tab content visibility
            handleTabContent(tab);
        });
    });

    // Handle tab content visibility
    function handleTabContent(tab) {
        if (tab === 'stats') {
            // Show stats section, hide servers and timer
            serversGrid.style.display = 'none';
            wipeTimer.style.display = 'none';
            statsSection.classList.remove('hidden');

            // Trigger stats load if available
            if (window.CobraStats && typeof window.CobraStats.onTabActivated === 'function') {
                window.CobraStats.onTabActivated();
            }
        } else {
            // Show servers and timer, hide stats
            serversGrid.style.display = '';
            wipeTimer.style.display = '';
            statsSection.classList.add('hidden');

            // Filter servers based on tab
            filterServers(tab);
        }
    }

    // Filter servers by tab - instant switching
    function filterServers(tab) {
        serverCards.forEach(card => {
            const serverId = card.dataset.serverId;
            let shouldShow = false;

            switch (tab) {
                case 'all':
                    shouldShow = true;
                    break;
                case 'favorites':
                    shouldShow = favorites.includes(serverId);
                    break;
            }

            // Instant show/hide without animation delay
            if (shouldShow) {
                card.classList.remove('hidden');
                card.style.display = '';
            } else {
                card.classList.add('hidden');
                card.style.display = 'none';
            }
        });
    }

    // Initialize favorites buttons
    function initFavorites() {
        serverCards.forEach(card => {
            const serverId = card.dataset.serverId;
            const favoriteBtn = card.querySelector('.favorite-btn');

            if (!favoriteBtn) return;

            // Set initial state
            if (favorites.includes(serverId)) {
                favoriteBtn.classList.add('active');
            }

            // Click handler
            favoriteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFavorite(serverId, favoriteBtn);
            });
        });
    }

    // Toggle favorite status
    function toggleFavorite(serverId, btn) {
        const index = favorites.indexOf(serverId);

        if (index === -1) {
            // Add to favorites
            favorites.push(serverId);
            btn.classList.add('active');
            showFavoriteToast('Добавлено в избранное');
        } else {
            // Remove from favorites
            favorites.splice(index, 1);
            btn.classList.remove('active');
            showFavoriteToast('Удалено из избранного');

            // If on favorites tab, re-filter instantly
            const activeTab = document.querySelector('.tab-btn.active');
            if (activeTab && activeTab.dataset.tab === 'favorites') {
                filterServers('favorites');
            }
        }

        // Save to localStorage
        localStorage.setItem('serverFavorites', JSON.stringify(favorites));
        updateFavoritesCount();
    }

    // Update favorites count badge
    function updateFavoritesCount() {
        if (favoritesCount) {
            favoritesCount.textContent = favorites.length;
        }
    }

    // Show toast notification
    function showFavoriteToast(message) {
        // Remove existing toast
        const existingToast = document.querySelector('.favorite-toast');
        if (existingToast) {
            existingToast.remove();
        }

        // Create toast
        const toast = document.createElement('div');
        toast.className = 'favorite-toast';
        toast.textContent = message;
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
        `;

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

    // Expose functions for keyboard shortcuts
    window.switchTab = (tabName) => {
        const btn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
        if (btn) {
            btn.click();
        }
    };

    window.getCurrentTab = () => {
        const activeTab = document.querySelector('.tab-btn.active');
        return activeTab ? activeTab.dataset.tab : 'all';
    };
});
