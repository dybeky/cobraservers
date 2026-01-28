// Statistics Leaderboard Module
// Handles top players table rendering

(function() {
    'use strict';

    // Medal emojis for top 3
    const MEDALS = {
        1: { emoji: '', class: 'rank-gold' },
        2: { emoji: '', class: 'rank-silver' },
        3: { emoji: '', class: 'rank-bronze' }
    };

    // Render leaderboard table
    function renderLeaderboard(data) {
        const tbody = document.getElementById('leaderboardBody');
        const table = document.getElementById('leaderboardTable');

        if (!tbody || !table) {
            console.error('Leaderboard elements not found');
            return;
        }

        // Clear existing rows
        tbody.innerHTML = '';

        if (!data || data.length === 0) {
            // Show empty state
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="3" style="text-align: center; color: var(--text-secondary); padding: 40px;">
                    Нет данных за выбранный период
                </td>
            `;
            tbody.appendChild(emptyRow);
            table.classList.remove('hidden');
            return;
        }

        // Render rows with animation
        data.forEach((player, index) => {
            const row = document.createElement('tr');
            row.style.animationDelay = `${index * 50}ms`;
            row.classList.add('leaderboard-row-animate');

            const rankContent = getRankContent(player.rank);
            const hoursFormatted = formatHours(player.hours);

            row.innerHTML = `
                <td class="lb-rank">${rankContent}</td>
                <td class="lb-name">${escapeHtml(player.name)}</td>
                <td class="lb-hours">${hoursFormatted}</td>
            `;

            tbody.appendChild(row);
        });

        table.classList.remove('hidden');
    }

    // Get rank display content (medal or number)
    function getRankContent(rank) {
        if (MEDALS[rank]) {
            return `<span class="${MEDALS[rank].class}">${MEDALS[rank].emoji || rank}</span>`;
        }
        return `<span class="rank-number">${rank}</span>`;
    }

    // Format hours display
    function formatHours(hours) {
        if (hours >= 100) {
            return Math.round(hours).toLocaleString('ru-RU');
        }
        return hours.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    }

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Show loading state
    function showLoading() {
        const skeleton = document.getElementById('leaderboardSkeleton');
        const table = document.getElementById('leaderboardTable');
        const error = document.getElementById('leaderboardError');

        if (skeleton) skeleton.classList.remove('hidden');
        if (table) table.classList.add('hidden');
        if (error) error.classList.add('hidden');
    }

    // Hide loading state
    function hideLoading() {
        const skeleton = document.getElementById('leaderboardSkeleton');

        if (skeleton) skeleton.classList.add('hidden');
    }

    // Show error state
    function showError() {
        const skeleton = document.getElementById('leaderboardSkeleton');
        const table = document.getElementById('leaderboardTable');
        const error = document.getElementById('leaderboardError');

        if (skeleton) skeleton.classList.add('hidden');
        if (table) table.classList.add('hidden');
        if (error) error.classList.remove('hidden');
    }

    // Hide error state
    function hideError() {
        const error = document.getElementById('leaderboardError');
        if (error) error.classList.add('hidden');
    }

    // Add CSS animation for rows
    function addRowAnimationStyles() {
        if (document.getElementById('leaderboard-animation-styles')) return;

        const style = document.createElement('style');
        style.id = 'leaderboard-animation-styles';
        style.textContent = `
            .leaderboard-row-animate {
                animation: leaderboardRowFadeIn 0.3s ease forwards;
                opacity: 0;
                transform: translateX(-10px);
            }

            @keyframes leaderboardRowFadeIn {
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }

            .stats-leaderboard tbody tr:hover {
                background: var(--bg-secondary);
            }

            .stats-leaderboard .rank-gold {
                text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
            }

            .stats-leaderboard .rank-silver {
                text-shadow: 0 0 10px rgba(192, 192, 192, 0.5);
            }

            .stats-leaderboard .rank-bronze {
                text-shadow: 0 0 10px rgba(205, 127, 50, 0.5);
            }
        `;
        document.head.appendChild(style);
    }

    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
        addRowAnimationStyles();
    });

    // Expose API
    window.CobraStatsLeaderboard = {
        renderLeaderboard,
        showLoading,
        hideLoading,
        showError,
        hideError
    };
})();
