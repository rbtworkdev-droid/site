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

        const telegramDisplayOffsetMs = 3 * 60 * 1000;
        const formatTelegramTime = timestamp => new Intl.DateTimeFormat('ru-RU', {
            timeZone: 'Europe/Moscow',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hourCycle: 'h23',
        }).format(new Date(timestamp.getTime() + telegramDisplayOffsetMs));
        const formatNotification = timestamp => `🔔Новый посетитель в ${formatTelegramTime(timestamp)}\n${'\u00a0'.repeat(44)}----`;
        const sentAt = new Date();

        const telegramResponse = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: env.TELEGRAM_CHAT_ID,
                text: formatNotification(sentAt),
            }),
        });

        let telegramResult;
        try {
            telegramResult = await telegramResponse.json();
        } catch {
            return jsonResponse({ error: 'Telegram delivery failed' }, 502, origin);
        }

        if (!telegramResponse.ok || !telegramResult.ok) {
            return jsonResponse({ error: 'Telegram delivery failed' }, 502, origin);
        }

        const telegramMessage = telegramResult.result;
        if (Number.isFinite(telegramMessage?.date)) {
            const telegramTime = new Date(telegramMessage.date * 1000);
            if (formatTelegramTime(telegramTime) !== formatTelegramTime(sentAt)) {
                const correctionResponse = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/editMessageText`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: env.TELEGRAM_CHAT_ID,
                        message_id: telegramMessage.message_id,
                        text: formatNotification(telegramTime),
                    }),
                });

                if (!correctionResponse.ok) {
                    console.error('Failed to synchronize visitor notification time with Telegram.');
                }
            }
        }

        return jsonResponse({ ok: true }, 200, origin);
    },
};