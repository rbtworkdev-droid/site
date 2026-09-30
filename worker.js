const jsonResponse = (body, status, origin) => new Response(JSON.stringify(body), {
    status,
    headers: {
        'Content-Type': 'application/json; charset=utf-8',
        ...(origin ? {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Vary': 'Origin',
        } : {}),
    },
});

export default {
    async fetch(request, env) {
        const origin = request.headers.get('Origin');
        if (origin !== env.ALLOWED_ORIGIN) {
            return jsonResponse({ error: 'Forbidden' }, 403);
        }

        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': origin,
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Max-Age': '86400',
                    'Vary': 'Origin',
                },
            });
        }

        if (request.method !== 'POST') {
            return jsonResponse({ error: 'Method not allowed' }, 405, origin);
        }

        const clientIp = request.headers.get('CF-Connecting-IP');
        const { success } = await env.RATE_LIMITER.limit({ key: clientIp || 'unknown' });
        if (!success) {
            return jsonResponse({ error: 'Rate limit exceeded' }, 429, origin);
        }

        const sentAt = new Intl.DateTimeFormat('ru-RU', {
            timeZone: 'Europe/Moscow',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hourCycle: 'h23',
        }).format(new Date());

        const telegramResponse = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: env.TELEGRAM_CHAT_ID,
                parse_mode: 'HTML',
                text: `<u>🔔Новый посетитель в ${sentAt}</u>`,
            }),
        });

        if (!telegramResponse.ok) {
            return jsonResponse({ error: 'Telegram delivery failed' }, 502, origin);
        }

        return jsonResponse({ ok: true }, 200, origin);
    },
};