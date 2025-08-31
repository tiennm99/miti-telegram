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

			// Collect client request information
			const clientIP = request.headers.get('CF-Connecting-IP') || 
							request.headers.get('X-Forwarded-For') || 
							request.headers.get('X-Real-IP') || 
							'Unknown';
			
			const userAgent = request.headers.get('User-Agent') || 'Unknown';
			const country = request.cf?.country || 'Unknown';
			const city = request.cf?.city || 'Unknown';
			const region = request.cf?.region || 'Unknown';
			const regionCode = request.cf?.regionCode || 'Unknown';
			const postalCode = request.cf?.postalCode || 'Unknown';
			const metroCode = request.cf?.metroCode || 'Unknown';
			const latitude = request.cf?.latitude || 'Unknown';
			const longitude = request.cf?.longitude || 'Unknown';
			const timezone = request.cf?.timezone || 'Unknown';
			const continent = request.cf?.continent || 'Unknown';
			const asn = request.cf?.asn || 'Unknown';
			const asOrganization = request.cf?.asOrganization || 'Unknown';
			const colo = request.cf?.colo || 'Unknown';
			const httpVersion = request.cf?.httpProtocol || 'Unknown';
			const tlsVersion = request.cf?.tlsVersion || 'Unknown';
			const tlsCipher = request.cf?.tlsCipher || 'Unknown';
			const edgeRequestKeepAlive = request.cf?.edgeRequestKeepAlive || 'Unknown';
			const clientTrustScore = request.cf?.clientTrustScore || 'Unknown';
			const botManagement = request.cf?.botManagement?.score || 'Unknown';
			const referer = request.headers.get('Referer') || 'None';
			const origin = request.headers.get('Origin') || 'None';
			const acceptLanguage = request.headers.get('Accept-Language') || 'Unknown';
			const acceptEncoding = request.headers.get('Accept-Encoding') || 'Unknown';
			const accept = request.headers.get('Accept') || 'Unknown';
			const host = request.headers.get('Host') || 'Unknown';
			const xRequestedWith = request.headers.get('X-Requested-With') || 'None';
			const dnt = request.headers.get('DNT') || 'None';
			const secFetchSite = request.headers.get('Sec-Fetch-Site') || 'Unknown';
			const secFetchMode = request.headers.get('Sec-Fetch-Mode') || 'Unknown';
			const secFetchDest = request.headers.get('Sec-Fetch-Dest') || 'Unknown';
			const secChUa = request.headers.get('Sec-CH-UA') || 'Unknown';
			const secChUaPlatform = request.headers.get('Sec-CH-UA-Platform') || 'Unknown';
			const secChUaMobile = request.headers.get('Sec-CH-UA-Mobile') || 'Unknown';
			const method = request.method || 'Unknown';
			const url = request.url || 'Unknown';
			const timestamp = new Date().toISOString();

			// Format the message with request information
			const requestInfo = `Method: ${method}
URL: ${url}
IP: ${clientIP}
Browser: ${userAgent}
Country: ${country} (${continent})
Region: ${region} (${regionCode})
City: ${city}
Postal Code: ${postalCode}
Metro Code: ${metroCode}
Coordinates: ${latitude}, ${longitude}
Timezone: ${timezone}
ASN: ${asn} (${asOrganization})
Cloudflare Datacenter: ${colo}
HTTP Version: ${httpVersion}
TLS Version: ${tlsVersion}
TLS Cipher: ${tlsCipher}
Keep-Alive: ${edgeRequestKeepAlive}
Trust Score: ${clientTrustScore}
Bot Score: ${botManagement}
Host: ${host}
Referer: ${referer}
Origin: ${origin}
Accept: ${accept}
Accept-Language: ${acceptLanguage}
Accept-Encoding: ${acceptEncoding}
X-Requested-With: ${xRequestedWith}
DNT: ${dnt}
Sec-Fetch-Site: ${secFetchSite}
Sec-Fetch-Mode: ${secFetchMode}
Sec-Fetch-Dest: ${secFetchDest}
Sec-CH-UA: ${secChUa}
Sec-CH-UA-Platform: ${secChUaPlatform}
Sec-CH-UA-Mobile: ${secChUaMobile}
Timestamp: ${timestamp}
Original text:`;

			const formattedMessage = `<code>
${requestInfo}
</code>
${text}`;

			const telegramToken = env.TELEGRAM_TOKEN;
			const telegramChatId = env.TELEGRAM_CHAT_ID;

			if (!telegramToken || !telegramChatId) {
				return new Response('Missing TELEGRAM_TOKEN or TELEGRAM_CHAT_ID environment variables', { status: 500 });
			}

			const telegramUrl = `https://api.telegram.org/bot${telegramToken}/sendMessage`;
			const telegramPayload = {
				chat_id: telegramChatId,
				text: formattedMessage,
				parse_mode: 'HTML'
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
