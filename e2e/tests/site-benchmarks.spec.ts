import { test, expect } from '@playwright/test';
import fs from 'fs';

import { downloadFile, BENCHMARK_DIR, BENCHMARK_TESTS, RUN_COUNT } from './constants';

for (let i = 1; i <= RUN_COUNT; i++) {
	for (const sequenceSize of BENCHMARK_TESTS) {
		test('run benchmark - ' + sequenceSize + ', run ' + i, async ({ page, browserName }) => {
			await runBenchmark(page, browserName, ['./e2e/data/reads_' + sequenceSize + '.sam'], './e2e/data/NC_045512.fas', sequenceSize + '.' + i + '/', 240000);
		});
	}
}

const runBenchmark = async (page, browserName: string, alignmentFiles: string[], referenceFile: string, downloadedLocation: string, runTimeout: number) => {
	test.setTimeout(runTimeout + 15000);
	await page.goto('/');
	await expect(page.getByTestId('output-text')).toHaveValue(/ViralWasm-Consensus loaded./);
	await page.getByTestId('alignment-files').setInputFiles(alignmentFiles);
	await page.getByTestId('reference-file').setInputFiles(referenceFile);
	await page.getByTestId('run').click();

	await expect(page.getByTestId('output-text')).toHaveValue(/Done! Time Elapsed:/, { timeout: runTimeout });
	const timeOutputLine = (await page.getByTestId('output-text').inputValue()).split('\n').filter(line => line.includes('ViralConsensus finished'))[0];
	const timeElapsed = timeOutputLine?.split(' ')?.slice(2)?.join('')?.replace(/[^0-9\.]/g, '') ?? '-1';
	await expect(parseFloat(timeElapsed)).toBeGreaterThan(0);
	await downloadFile(page, 'Download Consensus FASTA', BENCHMARK_DIR + downloadedLocation + browserName + '/');
	fs.appendFileSync(BENCHMARK_DIR + downloadedLocation + browserName + '/' + '/time.log', timeElapsed);
}