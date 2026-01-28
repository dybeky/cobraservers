// Statistics API Module
// Handles data fetching from BattleMetrics via Cloudflare Worker proxy

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        // BattleMetrics API (direct, no proxy needed for public endpoints)
        apiUrl: 'https://api.battlemetrics.com',
        // Cache duration in milliseconds
        cacheDuration: 5 * 60 * 1000, // 5 minutes
        // Server IDs
        servers: {
            '34747819': { name: 'PEI', color: '#10b981' },
            '34747818': { name: 'Russia', color: '#3b82f6' },
            '34747821': { name: 'Washington', color: '#f59e0b' }
        }
    };

    // Cache storage
    const cache = {
        history: {},
        leaderboard: {}
    };

    // Check if cached data is still valid
    function isCacheValid(cacheEntry) {
        if (!cacheEntry || !cacheEntry.timestamp) return false;
        return (Date.now() - cacheEntry.timestamp) < CONFIG.cacheDuration;
    }

    // Get cache key
    function getCacheKey(type, serverId, period) {
        return `${type}_${serverId}_${period}`;
    }

    // Save to localStorage cache
    function saveToLocalCache(key, data) {
        try {
            const cacheData = {
                data: data,
                timestamp: Date.now()
            };
            localStorage.setItem(`cobra_stats_${key}`, JSON.stringify(cacheData));
        } catch (e) {
            console.warn('Failed to save to localStorage:', e);
        }
    }

    // Load from localStorage cache
    function loadFromLocalCache(key) {
        try {
            const stored = localStorage.getItem(`cobra_stats_${key}`);
            if (!stored) return null;

            const cacheData = JSON.parse(stored);
            if (isCacheValid(cacheData)) {
                return cacheData.data;
            }
            // Remove expired cache
            localStorage.removeItem(`cobra_stats_${key}`);
        } catch (e) {
            console.warn('Failed to load from localStorage:', e);
        }
        return null;
    }

    // Calculate date range based on period
    function getDateRange(period, customStart, customEnd) {
        const now = new Date();
        let start, stop;

        switch (period) {
            case '24h':
                start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                stop = now;
                break;
            case '7d':
                start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                stop = now;
                break;
            case '30d':
                start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                stop = now;
                break;
            case 'custom':
                start = customStart ? new Date(customStart) : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                stop = customEnd ? new Date(customEnd) : now;
                break;
            default:
                start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                stop = now;
        }

        return {
            start: start.toISOString(),
            stop: stop.toISOString()
        };
    }

    // Fetch player count history
    async function fetchPlayerHistory(serverId, period, customStart, customEnd) {
        const cacheKey = getCacheKey('history', serverId, period === 'custom' ? `${customStart}_${customEnd}` : period);

        // Check memory cache
        if (cache.history[cacheKey] && isCacheValid(cache.history[cacheKey])) {
            return cache.history[cacheKey].data;
        }

        // Check localStorage cache
        const localCached = loadFromLocalCache(cacheKey);
        if (localCached) {
            cache.history[cacheKey] = { data: localCached, timestamp: Date.now() };
            return localCached;
        }

        const dateRange = getDateRange(period, customStart, customEnd);

        // Determine resolution based on period
        let resolution = 'raw';
        if (period === '30d' || (period === 'custom' && customEnd && customStart)) {
            const days = (new Date(dateRange.stop) - new Date(dateRange.start)) / (24 * 60 * 60 * 1000);
            if (days > 7) resolution = '60';
            if (days > 14) resolution = '1440';
        } else if (period === '7d') {
            resolution = '60';
        }

        try {
            // Direct BattleMetrics API call (public endpoint)
            const url = `${CONFIG.apiUrl}/servers/${serverId}/player-count-history?start=${encodeURIComponent(dateRange.start)}&stop=${encodeURIComponent(dateRange.stop)}${resolution !== 'raw' ? '&resolution=' + resolution : ''}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Process data
            const processedData = processHistoryData(data, serverId);

            // Cache the result
            cache.history[cacheKey] = { data: processedData, timestamp: Date.now() };
            saveToLocalCache(cacheKey, processedData);

            return processedData;
        } catch (error) {
            console.warn('API fetch failed:', error);

            // Return mock data for demo purposes
            return generateMockHistoryData(period);
        }
    }

    // Process history data from API response
    function processHistoryData(data, serverId) {
        if (!data || !data.data) {
            return [];
        }

        const serverInfo = CONFIG.servers[serverId] || { name: 'Unknown', color: '#888' };

        return data.data.map(point => ({
            timestamp: new Date(point.attributes.timestamp),
            value: point.attributes.value,
            min: point.attributes.min,
            max: point.attributes.max,
            serverId: serverId,
            serverName: serverInfo.name,
            serverColor: serverInfo.color
        }));
    }

    // Generate mock history data for demo
    function generateMockHistoryData(period) {
        const now = Date.now();
        const data = [];
        let points, interval;

        switch (period) {
            case '24h':
                points = 24;
                interval = 60 * 60 * 1000; // 1 hour
                break;
            case '7d':
                points = 7 * 24;
                interval = 60 * 60 * 1000; // 1 hour
                break;
            case '30d':
                points = 30;
                interval = 24 * 60 * 60 * 1000; // 1 day
                break;
            default:
                points = 24;
                interval = 60 * 60 * 1000;
        }

        for (let i = points; i >= 0; i--) {
            const timestamp = new Date(now - i * interval);
            // Generate realistic-looking player counts with day/night cycle
            const hour = timestamp.getHours();
            const baseValue = 15 + Math.sin(hour * Math.PI / 12) * 10;
            const randomVariation = Math.random() * 8 - 4;
            const value = Math.max(0, Math.round(baseValue + randomVariation));

            data.push({
                timestamp: timestamp,
                value: value,
                min: Math.max(0, value - 3),
                max: value + 3,
                serverId: 'mock',
                serverName: 'Demo',
                serverColor: 'var(--accent-primary)'
            });
        }

        return data;
    }

    // Fetch leaderboard data
    // Note: Leaderboard API requires authentication, so we use mock data for now
    async function fetchLeaderboard(serverId, period) {
        const cacheKey = getCacheKey('leaderboard', serverId, period);

        // Check memory cache
        if (cache.leaderboard[cacheKey] && isCacheValid(cache.leaderboard[cacheKey])) {
            return cache.leaderboard[cacheKey].data;
        }

        // Check localStorage cache
        const localCached = loadFromLocalCache(cacheKey);
        if (localCached) {
            cache.leaderboard[cacheKey] = { data: localCached, timestamp: Date.now() };
            return localCached;
        }

        // Leaderboard requires auth - use demo data
        // In future, this can be enabled via authenticated Worker
        console.info('Leaderboard API requires authentication, using demo data');
        const mockData = generateMockLeaderboardData();

        cache.leaderboard[cacheKey] = { data: mockData, timestamp: Date.now() };
        saveToLocalCache(cacheKey, mockData);

        return mockData;
    }

    // Process leaderboard data from API response
    function processLeaderboardData(data) {
        if (!data || !data.data) {
            return [];
        }

        return data.data.slice(0, 10).map((player, index) => ({
            rank: index + 1,
            name: player.attributes.name || 'Unknown Player',
            hours: Math.round((player.attributes.value || 0) / 60 * 10) / 10, // Convert minutes to hours
            playerId: player.id
        }));
    }

    // Generate mock leaderboard data for demo
    function generateMockLeaderboardData() {
        const names = [
            'xXProGamerXx', 'ShadowHunter', 'NightWolf', 'PhantomKnight',
            'StormRider', 'FireDragon', 'IceQueen', 'ThunderBolt',
            'DarkAssassin', 'SilentSniper', 'BlazeRunner', 'CyberNinja'
        ];

        return names.slice(0, 10).map((name, index) => ({
            rank: index + 1,
            name: name,
            hours: Math.round((100 - index * 8 + Math.random() * 10) * 10) / 10,
            playerId: `mock_${index}`
        }));
    }

    // Fetch data for all servers
    async function fetchAllServersHistory(period, customStart, customEnd) {
        const serverIds = Object.keys(CONFIG.servers);
        const results = {};

        const promises = serverIds.map(async (serverId) => {
            try {
                const data = await fetchPlayerHistory(serverId, period, customStart, customEnd);
                results[serverId] = data;
            } catch (error) {
                console.error(`Failed to fetch history for server ${serverId}:`, error);
                results[serverId] = [];
            }
        });

        await Promise.all(promises);
        return results;
    }

    // Clear all caches
    function clearCache() {
        cache.history = {};
        cache.leaderboard = {};

        // Clear localStorage cache
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('cobra_stats_')) {
                localStorage.removeItem(key);
            }
        });
    }

    // Expose API
    window.CobraStatsAPI = {
        fetchPlayerHistory,
        fetchLeaderboard,
        fetchAllServersHistory,
        clearCache,
        getDateRange,
        CONFIG
    };
})();
