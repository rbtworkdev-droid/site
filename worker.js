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
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Max-Age': '86400',
                    'Vary': 'Origin',
                },
            });
        }

        if (request.method !== 'POST') {
            return jsonResponse({ error: 'Method not allowed' }, 405, origin);
        }

        let requestBody;
        try {
            requestBody = await request.json();
        } catch {
            return jsonResponse({ error: 'Invalid request body' }, 400, origin);
        }

        const visitorId = requestBody?.visitorId;
        if (typeof visitorId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(visitorId)) {
            return jsonResponse({ error: 'Invalid visitor ID' }, 400, origin);
        }

        const visitCount = requestBody?.visitCount;
        if (!Number.isSafeInteger(visitCount) || visitCount < 1) {
            return jsonResponse({ error: 'Invalid visit count' }, 400, origin);
        }

        let telegramMessageId;
        const messageRef = requestBody?.messageRef;
        if (messageRef !== null && messageRef !== undefined) {
            const messageRefMatch = typeof messageRef === 'string'
                ? /^(\d+)\.(\d+)\.([0-9a-f]{64})$/i.exec(messageRef)
                : null;
            if (!messageRefMatch) {
                return jsonResponse({ error: 'Invalid message reference' }, 400, origin);
            }

            telegramMessageId = Number(messageRefMatch[1]);
            const previousVisitCount = Number(messageRefMatch[2]);
            if (!Number.isSafeInteger(telegramMessageId) || telegramMessageId < 1
                || !Number.isSafeInteger(previousVisitCount) || visitCount !== previousVisitCount + 1) {
                return jsonResponse({ error: 'Invalid message reference' }, 400, origin);
            }

            const signingKey = await crypto.subtle.importKey(
                'raw',
                new TextEncoder().encode(env.TELEGRAM_BOT_TOKEN),
                { name: 'HMAC', hash: 'SHA-256' },
                false,
                ['verify'],
            );
            const signature = Uint8Array.from(
                messageRefMatch[3].match(/.{2}/g),
                byte => Number.parseInt(byte, 16),
            );
            const isValidReference = await crypto.subtle.verify(
                'HMAC',
                signingKey,
                signature,
                new TextEncoder().encode(`${visitorId}:${telegramMessageId}:${previousVisitCount}`),
            );
            if (!isValidReference) {
                return jsonResponse({ error: 'Invalid message reference' }, 400, origin);
            }
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
        const formatNotification = (timestamp, id, count) => `🔔 Новый посетитель\n\nВремя: ${formatTelegramTime(timestamp)}\nID: ${id}\nКоличество визитов: ${count}`;
        const sentAt = new Date();

        const telegramResponse = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${telegramMessageId ? 'editMessageText' : 'sendMessage'}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: env.TELEGRAM_CHAT_ID,
                ...(telegramMessageId ? { message_id: telegramMessageId } : {}),
                text: formatNotification(sentAt, visitorId, visitCount),
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
        if (!Number.isSafeInteger(telegramMessage?.message_id) || telegramMessage.message_id < 1) {
            return jsonResponse({ error: 'Telegram delivery failed' }, 502, origin);
        }

        if (!telegramMessageId && Number.isFinite(telegramMessage?.date)) {
            const telegramTime = new Date(telegramMessage.date * 1000);
            if (formatTelegramTime(telegramTime) !== formatTelegramTime(sentAt)) {
                const correctionResponse = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/editMessageText`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: env.TELEGRAM_CHAT_ID,
                        message_id: telegramMessage.message_id,
                        text: formatNotification(telegramTime, visitorId, visitCount),
                    }),
                });

                if (!correctionResponse.ok) {
                    console.error('Failed to synchronize visitor notification time with Telegram.');
                }
            }
        }

        const signingKey = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(env.TELEGRAM_BOT_TOKEN),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign'],
        );
        const signature = new Uint8Array(await crypto.subtle.sign(
            'HMAC',
            signingKey,
            new TextEncoder().encode(`${visitorId}:${telegramMessage.message_id}:${visitCount}`),
        ));
        const signatureHex = [...signature].map(byte => byte.toString(16).padStart(2, '0')).join('');

        return jsonResponse({
            ok: true,
            messageRef: `${telegramMessage.message_id}.${visitCount}.${signatureHex}`,
        }, 200, origin);
    },
};