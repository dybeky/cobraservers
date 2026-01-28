// Statistics Chart Module
// Chart.js wrapper with theme support

(function() {
    'use strict';

    let chartInstance = null;
    let currentTheme = 'dark';

    // Get theme colors
    function getThemeColors() {
        const style = getComputedStyle(document.body);
        const isDark = !document.body.classList.contains('light-theme');

        return {
            textPrimary: style.getPropertyValue('--text-primary').trim() || (isDark ? '#fff' : '#000'),
            textSecondary: style.getPropertyValue('--text-secondary').trim() || (isDark ? '#a0a0a0' : '#555'),
            accentPrimary: style.getPropertyValue('--accent-primary').trim() || '#A855F7',
            accentSecondary: style.getPropertyValue('--accent-secondary').trim() || '#9333EA',
            accentGlow: style.getPropertyValue('--accent-glow').trim() || 'rgba(168, 85, 247, 0.4)',
            bgCard: style.getPropertyValue('--bg-card').trim() || (isDark ? '#000' : '#fff'),
            bgSecondary: style.getPropertyValue('--bg-secondary').trim() || (isDark ? '#1a1a1a' : '#e5e5e5'),
            gridColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        };
    }

    // Server colors
    const serverColors = {
        '34747819': { primary: '#10b981', secondary: 'rgba(16, 185, 129, 0.2)' }, // PEI - Green
        '34747818': { primary: '#3b82f6', secondary: 'rgba(59, 130, 246, 0.2)' }, // Russia - Blue
        '34747821': { primary: '#f59e0b', secondary: 'rgba(245, 158, 11, 0.2)' }, // Washington - Amber
        'all': { primary: null, secondary: null } // Will use theme colors
    };

    // Create gradient for chart line
    function createGradient(ctx, color) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, color.replace(')', ', 0.4)').replace('rgb', 'rgba'));
        gradient.addColorStop(1, color.replace(')', ', 0.0)').replace('rgb', 'rgba'));
        return gradient;
    }

    // Initialize chart
    function initChart(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error('Canvas element not found:', canvasId);
            return null;
        }

        const ctx = canvas.getContext('2d');
        const colors = getThemeColors();

        // Destroy existing chart
        if (chartInstance) {
            chartInstance.destroy();
        }

        // Chart.js configuration
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: colors.bgCard,
                        titleColor: colors.textPrimary,
                        bodyColor: colors.textSecondary,
                        borderColor: colors.accentPrimary,
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: true,
                        callbacks: {
                            title: function(context) {
                                const date = new Date(context[0].parsed.x);
                                return date.toLocaleString('ru-RU', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                });
                            },
                            label: function(context) {
                                return ` ${context.dataset.label}: ${context.parsed.y} игроков`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'hour',
                            displayFormats: {
                                hour: 'HH:mm',
                                day: 'dd.MM'
                            }
                        },
                        grid: {
                            color: colors.gridColor,
                            drawBorder: false
                        },
                        ticks: {
                            color: colors.textSecondary,
                            font: {
                                family: 'Rubik',
                                size: 11
                            },
                            maxRotation: 0
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: colors.gridColor,
                            drawBorder: false
                        },
                        ticks: {
                            color: colors.textSecondary,
                            font: {
                                family: 'Rubik',
                                size: 11
                            },
                            stepSize: 10
                        }
                    }
                },
                elements: {
                    point: {
                        radius: 0,
                        hoverRadius: 6,
                        hoverBorderWidth: 2
                    },
                    line: {
                        tension: 0.4,
                        borderWidth: 2
                    }
                },
                animation: {
                    duration: 750,
                    easing: 'easeOutQuart'
                }
            }
        });

        return chartInstance;
    }

    // Update chart with new data
    function updateChart(data, serverId = 'all') {
        if (!chartInstance) {
            initChart('playerCountChart');
        }

        if (!chartInstance) return;

        const colors = getThemeColors();
        const ctx = chartInstance.ctx;
        const datasets = [];

        if (serverId === 'all' && typeof data === 'object' && !Array.isArray(data)) {
            // Multiple servers data
            Object.keys(data).forEach(sId => {
                const serverData = data[sId];
                if (!serverData || serverData.length === 0) return;

                const serverColor = serverColors[sId] || { primary: colors.accentPrimary };
                const serverName = window.CobraStatsAPI?.CONFIG?.servers?.[sId]?.name || `Server ${sId}`;

                datasets.push({
                    label: serverName,
                    data: serverData.map(point => ({
                        x: point.timestamp,
                        y: point.value
                    })),
                    borderColor: serverColor.primary,
                    backgroundColor: serverColor.secondary || createGradient(ctx, serverColor.primary),
                    fill: true,
                    pointBackgroundColor: serverColor.primary,
                    pointBorderColor: '#fff'
                });
            });
        } else {
            // Single server data
            const serverData = Array.isArray(data) ? data : [];
            if (serverData.length === 0) return;

            const serverColor = serverColors[serverId] || { primary: colors.accentPrimary };
            const serverName = window.CobraStatsAPI?.CONFIG?.servers?.[serverId]?.name || 'Server';

            datasets.push({
                label: serverName,
                data: serverData.map(point => ({
                    x: point.timestamp,
                    y: point.value
                })),
                borderColor: serverId === 'all' ? colors.accentPrimary : serverColor.primary,
                backgroundColor: serverId === 'all' ? colors.accentGlow : (serverColor.secondary || createGradient(ctx, serverColor.primary)),
                fill: true,
                pointBackgroundColor: serverId === 'all' ? colors.accentPrimary : serverColor.primary,
                pointBorderColor: '#fff'
            });
        }

        // Determine time unit based on data range
        if (datasets.length > 0 && datasets[0].data.length > 0) {
            const firstPoint = datasets[0].data[0].x;
            const lastPoint = datasets[0].data[datasets[0].data.length - 1].x;
            const rangeMs = new Date(lastPoint) - new Date(firstPoint);
            const rangeDays = rangeMs / (24 * 60 * 60 * 1000);

            if (rangeDays > 14) {
                chartInstance.options.scales.x.time.unit = 'day';
            } else if (rangeDays > 2) {
                chartInstance.options.scales.x.time.unit = 'day';
            } else {
                chartInstance.options.scales.x.time.unit = 'hour';
            }
        }

        chartInstance.data.datasets = datasets;
        chartInstance.update('active');
    }

    // Update chart theme colors
    function updateTheme() {
        if (!chartInstance) return;

        const colors = getThemeColors();

        // Update tooltip colors
        chartInstance.options.plugins.tooltip.backgroundColor = colors.bgCard;
        chartInstance.options.plugins.tooltip.titleColor = colors.textPrimary;
        chartInstance.options.plugins.tooltip.bodyColor = colors.textSecondary;
        chartInstance.options.plugins.tooltip.borderColor = colors.accentPrimary;

        // Update axis colors
        chartInstance.options.scales.x.grid.color = colors.gridColor;
        chartInstance.options.scales.x.ticks.color = colors.textSecondary;
        chartInstance.options.scales.y.grid.color = colors.gridColor;
        chartInstance.options.scales.y.ticks.color = colors.textSecondary;

        // Update dataset colors if using theme accent
        chartInstance.data.datasets.forEach(dataset => {
            if (dataset._useThemeColor) {
                dataset.borderColor = colors.accentPrimary;
                dataset.backgroundColor = colors.accentGlow;
                dataset.pointBackgroundColor = colors.accentPrimary;
            }
        });

        chartInstance.update('none');
    }

    // Show loading state
    function showLoading() {
        const skeleton = document.getElementById('chartSkeleton');
        const canvas = document.getElementById('playerCountChart');
        const error = document.getElementById('chartError');

        if (skeleton) skeleton.classList.remove('hidden');
        if (canvas) canvas.style.opacity = '0.3';
        if (error) error.classList.add('hidden');
    }

    // Hide loading state
    function hideLoading() {
        const skeleton = document.getElementById('chartSkeleton');
        const canvas = document.getElementById('playerCountChart');

        if (skeleton) skeleton.classList.add('hidden');
        if (canvas) canvas.style.opacity = '1';
    }

    // Show error state
    function showError() {
        const skeleton = document.getElementById('chartSkeleton');
        const canvas = document.getElementById('playerCountChart');
        const error = document.getElementById('chartError');

        if (skeleton) skeleton.classList.add('hidden');
        if (canvas) canvas.style.opacity = '0.3';
        if (error) error.classList.remove('hidden');
    }

    // Hide error state
    function hideError() {
        const error = document.getElementById('chartError');
        if (error) error.classList.add('hidden');
    }

    // Destroy chart instance
    function destroyChart() {
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }
    }

    // Listen for theme changes
    const themeObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                updateTheme();
            }
        });
    });

    // Start observing body for theme changes
    document.addEventListener('DOMContentLoaded', () => {
        themeObserver.observe(document.body, { attributes: true });
    });

    // Expose API
    window.CobraStatsChart = {
        initChart,
        updateChart,
        updateTheme,
        showLoading,
        hideLoading,
        showError,
        hideError,
        destroyChart,
        getThemeColors
    };
})();
