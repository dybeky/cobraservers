/**
 * BattleMetrics API Proxy Worker
 *
 * This Cloudflare Worker proxies requests to the BattleMetrics API,
 * adding authentication and handling CORS.
 *
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Create a Cloudflare account at cloudflare.com (free)
 * 2. Go to Workers & Pages in the Cloudflare dashboard
 * 3. Create a new Worker
 * 4. Copy this code into the Worker editor
 * 5. Add environment variable: BATTLEMETRICS_TOKEN (your API token)
 * 6. Deploy the Worker
 * 7. Copy the Worker URL (e.g., https://battlemetrics-proxy.your-subdomain.workers.dev)
 * 8. Update CONFIG.workerUrl in js/stats-api.js with this URL
 *
 * GET YOUR BATTLEMETRICS API TOKEN:
 * 1. Go to https://www.battlemetrics.com/developers
 * 2. Create a new OAuth application or personal access token
 * 3. Copy the token and add it as BATTLEMETRICS_TOKEN environment variable
 */

// Configuration
const CONFIG = {
    battlemetricsApi: 'https://api.battlemetrics.com',
    cacheTtl: 300, // 5 minutes cache
    allowedOrigins: [
        'https://dybeky.github.io',
        'http://localhost',
        'http://127.0.0.1',
        'null' // For local file access
    ]
};

// CORS headers
function getCorsHeaders(origin) {
    const allowedOrigin = CONFIG.allowedOrigins.find(allowed =>
        origin?.startsWith(allowed) || origin === 'null'
    ) || CONFIG.allowedOrigins[0];

    return {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept',
        'Access-Control-Max-Age': '86400'
    };
}

// Handle preflight requests
function handleOptions(request) {
    const origin = request.headers.get('Origin');
    return new Response(null, {
        status: 204,
        headers: getCorsHeaders(origin)
    });
}

// Fetch player count history (public endpoint - no auth needed)
async function fetchPlayerHistory(serverId, start, stop, resolution) {
    let url = `${CONFIG.battlemetricsApi}/servers/${serverId}/player-count-history`;

    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (stop) params.append('stop', stop);
    if (resolution && resolution !== 'raw') params.append('resolution', resolution);

    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;

    const response = await fetch(url, {
        headers: {
            'Accept': 'application/json'
        }
    });
    return response;
}

// Fetch time leaderboard
async function fetchLeaderboard(serverId, period, token) {
    // Calculate date range based on period
    const now = new Date();
    let start;

    switch (period) {
        case '30d':
            start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        case '7d':
        default:
            start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const url = `${CONFIG.battlemetricsApi}/servers/${serverId}/relationships/leaderboards/time?` +
        `filter[period]=${start.toISOString()}:${now.toISOString()}&page[size]=10`;

    const headers = {
        'Accept': 'application/json',
        'User-Agent': 'COBRA-Servers-Stats/1.0'
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { headers });
    return response;
}

// Main request handler
async function handleRequest(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    const corsHeaders = getCorsHeaders(origin);

    // Handle OPTIONS (preflight)
    if (request.method === 'OPTIONS') {
        return handleOptions(request);
    }

    // Only allow GET requests
    if (request.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const path = url.pathname;
    const params = url.searchParams;
    const token = env.BATTLEMETRICS_TOKEN;

    try {
        let apiResponse;

        if (path === '/history' || path === '/player-count-history') {
            const serverId = params.get('server');
            const start = params.get('start');
            const stop = params.get('stop');
            const resolution = params.get('resolution') || 'raw';

            if (!serverId) {
                return new Response(JSON.stringify({ error: 'Server ID required' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            apiResponse = await fetchPlayerHistory(serverId, start, stop, resolution);
        }
        else if (path === '/leaderboard') {
            const serverId = params.get('server');
            const period = params.get('period') || '7d';

            if (!serverId) {
                return new Response(JSON.stringify({ error: 'Server ID required' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            apiResponse = await fetchLeaderboard(serverId, period, token);
        }
        else {
            return new Response(JSON.stringify({
                error: 'Unknown endpoint',
                available: ['/history', '/leaderboard']
            }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Check API response status
        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            return new Response(JSON.stringify({
                error: 'BattleMetrics API error',
                status: apiResponse.status,
                details: errorText
            }), {
                status: apiResponse.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Return successful response with caching
        const data = await apiResponse.json();

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
                'Cache-Control': `public, max-age=${CONFIG.cacheTtl}`
            }
        });
    } catch (error) {
        console.error('Worker error:', error);
        return new Response(JSON.stringify({
            error: 'Internal server error',
            message: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// Export for Cloudflare Workers
export default {
    async fetch(request, env, ctx) {
        return handleRequest(request, env);
    }
};
