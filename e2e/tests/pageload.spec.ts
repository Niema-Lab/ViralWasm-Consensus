import { test, expect } from '@playwright/test';
import fs from 'fs';
let errors: string[] = [];

test.beforeEach(async ({ page }) => {
	errors = [];
	page.on('console', msg => {
		if (msg.type() === 'error') {
			console.log(msg.text());
			errors.push(msg.text());
		}
	})

	await page.goto('/');
	await expect(page.getByTestId('output-text')).toHaveValue(/ViralWasm-Consensus loaded./);
});

test.afterEach(async ({ page }) => {
	expect(errors).toEqual([]);
});

const downloadFile = async (page, identifier: string, location: string) => {
	const downloadPromise = page.waitForEvent('download');
	await page.getByText(identifier).click();
	const download = await downloadPromise;
	await download.saveAs(location + download.suggestedFilename());
}

test('run example data', async ({ page, browserName }) => {
	test.setTimeout(15000);
	await page.getByTestId('load-example-data').click();
	await page.getByTestId('run').click();

	await expect(page.getByTestId('output-text')).toHaveValue(/Done! Time Elapsed:/, { timeout: 10000 });
	const timeElapsed = (await page.getByTestId('duration-text').textContent())?.replace(/[^0-9\.]/g, '') ?? '-1';
	await expect(parseFloat(timeElapsed)).toBeGreaterThan(0);
	await downloadFile(page, 'Download', 'e2e/results/' + browserName + '/example/');
	fs.appendFileSync('e2e/results/' + browserName + '/example/time.txt', timeElapsed);
});

const runBenchmark = async (page, browserName: string, alignmentFiles: string[], referenceFile, downloadedLocation: string, runTimeout: number) => {
	test.setTimeout(runTimeout + 15000);
	await page.getByTestId('alignment-files').setInputFiles(...alignmentFiles);
	await page.getByTestId('reference-file').setInputFiles(referenceFile);
	await page.getByTestId('run').click();

	await expect(page.getByTestId('output-text')).toHaveValue(/Done! Time Elapsed:/, { timeout: runTimeout });
	const timeElapsed = (await page.getByTestId('duration-text').textContent())?.replace(/[^0-9\.]/g, '') ?? '-1';
	await expect(parseFloat(timeElapsed)).toBeGreaterThan(0);
	await downloadFile(page, 'Download Consensus FASTA', 'e2e/results/' + browserName + '/' + downloadedLocation + '/');
	fs.appendFileSync('e2e/results/' + browserName + '/' + downloadedLocation + '/time.txt', timeElapsed);
}

test('run example data - uploaded', async ({ page, browserName }) => {
	await runBenchmark(page, browserName, ['./public/data/example.bam'], './public/data/NC_045512.2.fas', 'example-uploaded', 10000);
});

test('run large data set', async ({ page, browserName }) => {
	await runBenchmark(page, browserName, ['./public/data/reads.fastq.gz'], './public/data/NC_045512.2.fas', 'large dataset', 240000);
});