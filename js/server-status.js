// Server Status Checker for COBRA Servers via BattleMetrics API
document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'https://api.battlemetrics.com/servers/';
    const CHECK_INTERVAL = 30000; // 30 seconds
    const TIMEOUT = 10000;

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
                    } else {
                        updateStatus(false, 'Оффлайн');
                    }
                } else {
                    updateStatus(false, 'Ошибка');
                }
            } catch (error) {
                if (error.name === 'AbortError') {
                    updateStatus(false, 'Тайм-аут');
                } else {
                    updateStatus(true, 'Проверка...');
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
        setInterval(checkServerStatus, CHECK_INTERVAL);
    });
});
