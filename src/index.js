export default {
	async fetch(request, env, ctx) {
		if (request.method !== 'POST') {
			return new Response('Method not allowed', { status: 405 });
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
				return new Response('Content-Type must be application/json or application/x-www-form-urlencoded', { status: 400 });
			}

			if (!text) {
				return new Response('Missing text parameter', { status: 400 });
			}

			const telegramToken = env.TELEGRAM_TOKEN;
			const telegramChatId = env.TELEGRAM_CHAT_ID;

			if (!telegramToken || !telegramChatId) {
				return new Response('Missing TELEGRAM_TOKEN or TELEGRAM_CHAT_ID environment variables', { status: 500 });
			}

			const telegramUrl = `https://api.telegram.org/bot${telegramToken}/sendMessage`;
			const telegramPayload = {
				chat_id: telegramChatId,
				text: text
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
					success: false,
					error: 'Telegram API error',
					details: telegramResult
				}), { 
					status: 500,
					headers: { 'Content-Type': 'application/json' }
				});
			}

			return new Response(JSON.stringify({
				success: true,
				message: 'Message sent successfully',
				telegram_response: telegramResult
			}), {
				headers: { 'Content-Type': 'application/json' }
			});

		} catch (error) {
			return new Response(JSON.stringify({
				success: false,
				error: 'Internal server error',
				details: error.message
			}), { 
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			});
		}
	},
};
