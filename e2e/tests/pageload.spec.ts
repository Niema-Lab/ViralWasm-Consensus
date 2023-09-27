import { test, expect } from '@playwright/test';
import fs from 'fs';

const BENCHMARK_TESTS = {
	// TODO: change names
	small: {
		referenceFiles: ['./public/data/example.bam'], 
		alignmentFile: './public/data/NC_045512.2.fas', 
		outputFolder: 'example-uploaded/',
		timeout: 10000
	},
	large: {
		referenceFiles: ['./public/data/reads.fastq.gz'], 
		alignmentFile: './public/data/NC_045512.2.fas', 
		outputFolder: 'large-dataset/', 
		timeout: 240000
	}
}
const BENCHMARK_DIR = 'benchmarks/';

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

test('run example data', async ({ page, browserName }) => {
	test.setTimeout(15000);
	await page.getByTestId('load-example-data').click();
	await page.getByTestId('run').click();

	await expect(page.getByTestId('output-text')).toHaveValue(/Done! Time Elapsed:/, { timeout: 10000 });
	const timeElapsed = (await page.getByTestId('duration-text').textContent())?.replace(/[^0-9\.]/g, '') ?? '-1';
	await expect(parseFloat(timeElapsed)).toBeGreaterThan(0);
	await downloadFile(page, 'Download', BENCHMARK_DIR + 'example/' + browserName + '/');
	fs.appendFileSync(BENCHMARK_DIR + 'example/' + browserName + '/' + '/time.txt', timeElapsed);
});

for (const [name, { referenceFiles, alignmentFile, outputFolder, timeout }] of Object.entries(BENCHMARK_TESTS)) {
	test('run benchmark - ' + name, async ({ page, browserName }) => {
		await runBenchmark(page, browserName, referenceFiles, alignmentFile, outputFolder, timeout);
	});
}

const runBenchmark = async (page, browserName: string, alignmentFiles: string[], referenceFile, downloadedLocation: string, runTimeout: number) => {
	test.setTimeout(runTimeout + 15000);
	await page.getByTestId('alignment-files').setInputFiles(...alignmentFiles);
	await page.getByTestId('reference-file').setInputFiles(referenceFile);
	await page.getByTestId('run').click();

	await expect(page.getByTestId('output-text')).toHaveValue(/Done! Time Elapsed:/, { timeout: runTimeout });
	const timeElapsed = (await page.getByTestId('duration-text').textContent())?.replace(/[^0-9\.]/g, '') ?? '-1';
	await expect(parseFloat(timeElapsed)).toBeGreaterThan(0);
	await downloadFile(page, 'Download Consensus FASTA', BENCHMARK_DIR + downloadedLocation + browserName + '/');
	fs.appendFileSync(BENCHMARK_DIR + downloadedLocation + browserName + '/' + '/time.txt', timeElapsed);
}

const downloadFile = async (page, identifier: string, location: string) => {
	const downloadPromise = page.waitForEvent('download');
	await page.getByText(identifier).click();
	const download = await downloadPromise;
	await download.saveAs(location + download.suggestedFilename());
}