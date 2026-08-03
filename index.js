import LLMS_TXT from './llms.txt';

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Usage spec for AI agents. Read-only: GET never forwards to Telegram,
    // so crawlers and link previewers cannot trigger a message.
    if (request.method === 'GET' || request.method === 'HEAD') {
      const { pathname } = new URL(request.url);

      if (pathname === '/llms.txt') {
        return new Response(request.method === 'HEAD' ? null : LLMS_TXT, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', {
        status: 405,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    try {
      const contentType = request.headers.get('content-type');
      let text;

      if (contentType && contentType.includes('application/json')) {
        const body = await request.json();
        text = body.text;
      } else if (contentType && contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await request.formData();
        text = formData.get('text');
      } else {
        return new Response('Content-Type must be application/json or application/x-www-form-urlencoded', {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
          }
        });
      }

      if (!text) {
        return new Response('Missing text parameter', {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
          }
        });
      }

      const telegramToken = env.TELEGRAM_TOKEN;
      const telegramChatId = env.TELEGRAM_CHAT_ID;

      if (!telegramToken || !telegramChatId) {
        return new Response('Missing TELEGRAM_TOKEN or TELEGRAM_CHAT_ID environment variables', {
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
          }
        });
      }

      const telegramUrl = `https://api.telegram.org/bot${telegramToken}/sendMessage`;
      const telegramPayload = {
        chat_id: telegramChatId,
        text,
      };

      const telegramResponse = await fetch(telegramUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(telegramPayload)
      });

      const telegramResult = await telegramResponse.json();

      if (!telegramResponse.ok) {
        return new Response(JSON.stringify({
          success: false
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        });
      }

      return new Response(JSON.stringify({
        success: true
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });

    } catch (error) {
      return new Response(JSON.stringify({
        success: false
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }
  },
};
