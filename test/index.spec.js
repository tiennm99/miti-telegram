import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src';

describe('Telegram Worker', () => {
	it('rejects GET requests', async () => {
		const request = new Request('http://example.com');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(405);
		expect(await response.text()).toMatchInlineSnapshot(`"Method not allowed"`);
	});

	it('requires text parameter in JSON POST', async () => {
		const request = new Request('http://example.com', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({})
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(400);
		expect(await response.text()).toMatchInlineSnapshot(`"Missing text parameter"`);
	});

	it('requires environment variables', async () => {
		const request = new Request('http://example.com', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ text: 'Hello World!' })
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, {}, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(500);
		expect(await response.text()).toMatchInlineSnapshot(`"Missing TELEGRAM_TOKEN or TELEGRAM_CHAT_ID environment variables"`);
	});
});
