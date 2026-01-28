// Server Status Checker for COBRA Servers via BattleMetrics API
document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'https://api.battlemetrics.com/servers/';
    const CHECK_INTERVAL = 30000; // 30 seconds
    const TIMEOUT = 10000;

    // Store interval IDs for cleanup
    const intervalIds = [];

    // Get all server cards
    const serverCards = document.querySelectorAll('.server-status[data-server-id]');

    serverCards.forEach(card => {
        const serverId = card.dataset.serverId;
        const statusDot = card.querySelector('.status-dot');
        const statusText = card.querySelector('.status-text');
        const serverIPElement = card.querySelector('.server-ip');
        const copyIpBtn = card.querySelector('.copy-ip-btn');
        const copyNotification = card.querySelector('.copy-notification');
        const statusIndicator = card.querySelector('.status-indicator');
        const connectBtn = card.querySelector('.connect-btn');

        let currentServerIP = '';
        let previousPlayers = null; // Track player count for notifications

        // Add skeleton loading initially
        if (statusText) statusText.classList.add('skeleton');
        if (serverIPElement) serverIPElement.classList.add('skeleton');

        async function checkServerStatus() {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

                const response = await fetch(`${API_URL}${serverId}`, {
                    signal: controller.signal,
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                clearTimeout(timeoutId);

                if (response.ok) {
                    const data = await response.json();
                    const attributes = data.data.attributes;

                    const isOnline = attributes.status === 'online';
                    const players = attributes.players || 0;
                    const maxPlayers = attributes.maxPlayers || 0;

                    // Get IP and port
                    const serverIP = attributes.ip || '';
                    const serverPort = attributes.port || '';
                    if (serverIP && serverPort) {
                        currentServerIP = `${serverIP}:${serverPort}`;
                        if (serverIPElement) {
                            serverIPElement.textContent = `IP: ${currentServerIP}`;
                            serverIPElement.classList.remove('skeleton');
                        }
                        // Update connect button with Steam protocol
                        if (connectBtn) {
                            connectBtn.href = `steam://connect/${currentServerIP}`;
                        }
                    }

                    // Update status
                    if (isOnline) {
                        updateStatus(true, `Онлайн: ${players}/${maxPlayers}`);
                        // Show player change notification
                        if (previousPlayers !== null && previousPlayers !== players) {
                            showPlayerChange(players - previousPlayers);
                        }
                        previousPlayers = players;
                        // Add online glow to card
                        card.classList.add('server-online');
                    } else {
                        updateStatus(false, 'Оффлайн');
                        card.classList.remove('server-online');
                        previousPlayers = null;
                    }
                } else {
                    updateStatus(false, 'Ошибка');
                }
            } catch (error) {
                if (error.name === 'AbortError') {
                    updateStatus(false, 'Тайм-аут');
                } else {
                    updateStatus(false, 'Ошибка сети');
                }
            }
        }

        function updateStatus(isOnline, message) {
            if (statusDot) {
                statusDot.className = 'status-dot ' + (isOnline ? 'online' : 'offline');
            }
            if (statusText) {
                statusText.textContent = message;
                statusText.classList.remove('skeleton');
            }
        }

        // Show player change notification (+1/-1)
        function showPlayerChange(delta) {
            if (delta === 0) return;

            const notification = document.createElement('div');
            notification.className = 'player-change ' + (delta > 0 ? 'player-join' : 'player-leave');
            notification.textContent = delta > 0 ? `+${delta}` : `${delta}`;

            card.appendChild(notification);

            // Trigger animation
            requestAnimationFrame(() => {
                notification.classList.add('show');
            });

            // Remove after animation
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 1500);
        }

        // Copy IP function
        async function copyIP() {
            if (!currentServerIP) return;

            try {
                await navigator.clipboard.writeText(currentServerIP);
                showCopyNotification();
            } catch (err) {
                // Fallback
                const textArea = document.createElement('textarea');
                textArea.value = currentServerIP;
                textArea.style.position = 'fixed';
                textArea.style.left = '-9999px';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                showCopyNotification();
            }
        }

        function showCopyNotification() {
            if (copyNotification) {
                copyNotification.classList.add('show');
                setTimeout(() => {
                    copyNotification.classList.remove('show');
                }, 2000);
            }
        }

        // Event listeners
        if (copyIpBtn) {
            copyIpBtn.addEventListener('click', copyIP);
        }

        if (serverIPElement) {
            serverIPElement.style.cursor = 'pointer';
            serverIPElement.title = 'Нажми чтобы скопировать';
            serverIPElement.addEventListener('click', copyIP);
        }

        if (statusIndicator) {
            statusIndicator.style.cursor = 'pointer';
            statusIndicator.title = 'Нажми для обновления';
            statusIndicator.addEventListener('click', () => {
                statusText.textContent = 'Проверка...';
                checkServerStatus();
            });
        }

        // Initial check and interval
        checkServerStatus();
        const intervalId = setInterval(checkServerStatus, CHECK_INTERVAL);
        intervalIds.push(intervalId);
    });

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        intervalIds.forEach(id => clearInterval(id));
    });

    // Expose refresh function for keyboard shortcuts
    window.refreshServerStatus = () => {
        serverCards.forEach(card => {
            const statusText = card.querySelector('.status-text');
            if (statusText) statusText.textContent = 'Проверка...';
        });
        // Re-trigger initial check for all cards
        serverCards.forEach(card => {
            const event = new CustomEvent('refreshStatus');
            card.dispatchEvent(event);
        });
    };
});
