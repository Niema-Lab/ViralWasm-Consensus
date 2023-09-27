import { test, expect } from '@playwright/test';
import fs from 'fs';

import { downloadFile, BENCHMARK_DIR} from './constants';

const BENCHMARK_TESTS = {
	// TODO: change names
	small: {
		alignmentFiles: ['./public/data/example.bam'], 
		referenceFile: './public/data/NC_045512.2.fas', 
		outputFolder: 'example-uploaded/',
		timeout: 10000
	},
	large: {
		alignmentFiles: ['./e2e/data/reads.fastq.gz'], 
		referenceFile: './public/data/NC_045512.2.fas', 
		outputFolder: 'large-dataset/', 
		timeout: 240000
	}
}

for (const [name, { referenceFile, alignmentFiles, outputFolder, timeout }] of Object.entries(BENCHMARK_TESTS)) {
	test('run benchmark - ' + name, async ({ page, browserName }) => {
		await runBenchmark(page, browserName, alignmentFiles, referenceFile, outputFolder, timeout);
	});
}

const runBenchmark = async (page, browserName: string, alignmentFiles: string[], referenceFile: string, downloadedLocation: string, runTimeout: number) => {
	test.setTimeout(runTimeout + 15000);
	await page.goto('/');
	await expect(page.getByTestId('output-text')).toHaveValue(/ViralWasm-Consensus loaded./);
	await page.getByTestId('alignment-files').setInputFiles(alignmentFiles);
	await page.getByTestId('reference-file').setInputFiles(referenceFile);
	await page.getByTestId('run').click();

	await expect(page.getByTestId('output-text')).toHaveValue(/Done! Time Elapsed:/, { timeout: runTimeout });
	const timeElapsed = (await page.getByTestId('duration-text').textContent())?.replace(/[^0-9\.]/g, '') ?? '-1';
	await expect(parseFloat(timeElapsed)).toBeGreaterThan(0);
	await downloadFile(page, 'Download Consensus FASTA', BENCHMARK_DIR + downloadedLocation + browserName + '/');
	fs.appendFileSync(BENCHMARK_DIR + downloadedLocation + browserName + '/' + '/time.txt', timeElapsed);
}