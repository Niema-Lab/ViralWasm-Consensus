import { test, expect } from '@playwright/test';

const url = 'http://localhost:5173';

test('page load', async ({ page }) => {
	const errors: string[] = [];
	page.on('console', msg => {
		if (msg.type() === 'error') {
			console.log(msg.text());
			errors.push(msg.text());
		}
	})

	await page.goto(url);
	await expect(page.locator('id=output-text')).toHaveValue(/ViralWasm-Consensus loaded./);

	expect(errors).toEqual([]);
});