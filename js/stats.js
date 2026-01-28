// Statistics Main Controller
// Coordinates all statistics functionality

(function() {
    'use strict';

    // State
    const state = {
        currentServer: 'all',
        currentPeriod: '24h',
        customStartDate: null,
        customEndDate: null,
        isInitialized: false,
        isLoading: false
    };

    // DOM Elements
    let elements = {};

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        initElements();
        initEventListeners();
        initDateInputs();
    });

    // Cache DOM elements
    function initElements() {
        elements = {
            serverSelect: document.getElementById('statsServerSelect'),
            periodBtns: document.querySelectorAll('.stats-period-btn'),
            customPeriodBtn: document.getElementById('customPeriodBtn'),
            datePicker: document.getElementById('statsDatePicker'),
            dateStart: document.getElementById('statsDateStart'),
            dateEnd: document.getElementById('statsDateEnd'),
            dateApply: document.getElementById('statsDateApply'),
            chartRetryBtn: document.getElementById('chartRetryBtn'),
            leaderboardRetryBtn: document.getElementById('leaderboardRetryBtn')
        };
    }

    // Initialize event listeners
    function initEventListeners() {
        // Server select
        if (elements.serverSelect) {
            elements.serverSelect.addEventListener('change', (e) => {
                state.currentServer = e.target.value;
                loadData();
            });
        }

        // Period buttons
        elements.periodBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const period = btn.dataset.period;

                // Update active state
                elements.periodBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Handle custom period
                if (period === 'custom') {
                    toggleDatePicker(true);
                } else {
                    toggleDatePicker(false);
                    state.currentPeriod = period;
                    loadData();
                }
            });
        });

        // Date apply button
        if (elements.dateApply) {
            elements.dateApply.addEventListener('click', () => {
                applyCustomDates();
            });
        }

        // Retry buttons
        if (elements.chartRetryBtn) {
            elements.chartRetryBtn.addEventListener('click', () => {
                loadChartData();
            });
        }

        if (elements.leaderboardRetryBtn) {
            elements.leaderboardRetryBtn.addEventListener('click', () => {
                loadLeaderboardData();
            });
        }
    }

    // Initialize date inputs with default values
    function initDateInputs() {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        if (elements.dateEnd) {
            elements.dateEnd.value = formatDateForInput(now);
            elements.dateEnd.max = formatDateForInput(now);
        }

        if (elements.dateStart) {
            elements.dateStart.value = formatDateForInput(weekAgo);
            elements.dateStart.max = formatDateForInput(now);
        }
    }

    // Format date for input element
    function formatDateForInput(date) {
        return date.toISOString().split('T')[0];
    }

    // Toggle date picker visibility
    function toggleDatePicker(show) {
        if (elements.datePicker) {
            if (show) {
                elements.datePicker.classList.remove('hidden');
            } else {
                elements.datePicker.classList.add('hidden');
            }
        }
    }

    // Apply custom date range
    function applyCustomDates() {
        if (!elements.dateStart || !elements.dateEnd) return;

        const startDate = elements.dateStart.value;
        const endDate = elements.dateEnd.value;

        if (!startDate || !endDate) {
            showToast('Выберите обе даты');
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            showToast('Начальная дата должна быть раньше конечной');
            return;
        }

        state.currentPeriod = 'custom';
        state.customStartDate = startDate;
        state.customEndDate = endDate;

        loadData();
    }

    // Load all data
    async function loadData() {
        if (state.isLoading) return;

        state.isLoading = true;

        await Promise.all([
            loadChartData(),
            loadLeaderboardData()
        ]);

        state.isLoading = false;
    }

    // Load chart data
    async function loadChartData() {
        const { CobraStatsAPI, CobraStatsChart } = window;

        if (!CobraStatsAPI || !CobraStatsChart) {
            console.error('Stats modules not loaded');
            return;
        }

        CobraStatsChart.showLoading();
        CobraStatsChart.hideError();

        try {
            let data;

            if (state.currentServer === 'all') {
                // Fetch data for all servers
                data = await CobraStatsAPI.fetchAllServersHistory(
                    state.currentPeriod,
                    state.customStartDate,
                    state.customEndDate
                );
            } else {
                // Fetch data for single server
                data = await CobraStatsAPI.fetchPlayerHistory(
                    state.currentServer,
                    state.currentPeriod,
                    state.customStartDate,
                    state.customEndDate
                );
            }

            CobraStatsChart.hideLoading();
            CobraStatsChart.updateChart(data, state.currentServer);
        } catch (error) {
            console.error('Failed to load chart data:', error);
            CobraStatsChart.hideLoading();
            CobraStatsChart.showError();
        }
    }

    // Load leaderboard data
    async function loadLeaderboardData() {
        const { CobraStatsAPI, CobraStatsLeaderboard } = window;

        if (!CobraStatsAPI || !CobraStatsLeaderboard) {
            console.error('Stats modules not loaded');
            return;
        }

        CobraStatsLeaderboard.showLoading();
        CobraStatsLeaderboard.hideError();

        try {
            // Determine leaderboard period
            let leaderboardPeriod = '7d';
            if (state.currentPeriod === '30d' || state.currentPeriod === 'custom') {
                leaderboardPeriod = '30d';
            }

            const data = await CobraStatsAPI.fetchLeaderboard(
                state.currentServer === 'all' ? '34747819' : state.currentServer, // Default to PEI if all
                leaderboardPeriod
            );

            CobraStatsLeaderboard.hideLoading();
            CobraStatsLeaderboard.renderLeaderboard(data);
        } catch (error) {
            console.error('Failed to load leaderboard data:', error);
            CobraStatsLeaderboard.hideLoading();
            CobraStatsLeaderboard.showError();
        }
    }

    // Called when stats tab is activated
    function onTabActivated() {
        if (!state.isInitialized) {
            state.isInitialized = true;

            // Initialize chart
            if (window.CobraStatsChart) {
                window.CobraStatsChart.initChart('playerCountChart');
            }

            // Load initial data
            loadData();
        }
    }

    // Show toast notification
    function showToast(message) {
        const existingToast = document.querySelector('.stats-toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = 'stats-toast';
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

        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        });

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(20px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Refresh data (can be called externally)
    function refreshData() {
        if (window.CobraStatsAPI) {
            window.CobraStatsAPI.clearCache();
        }
        loadData();
    }

    // Expose API
    window.CobraStats = {
        onTabActivated,
        refreshData,
        getState: () => ({ ...state })
    };
})();
