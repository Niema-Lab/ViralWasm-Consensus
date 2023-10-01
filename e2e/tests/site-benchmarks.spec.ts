import { test, expect } from '@playwright/test';
import fs from 'fs';

import { downloadFile, BENCHMARK_DIR} from './constants';

const BENCHMARK_TESTS = {
	// TODO: change names
	'example': {
		alignmentFiles: ['./e2e/data/example.bam'], 
		referenceFile: './e2e/data/NC_045512.2.fas', 
		outputFolder: 'example-uploaded/',
		timeout: 10000
	},
	'1000': {
		alignmentFiles: ['./e2e/data/reads_1k.fastq.gz'],
		referenceFile: './e2e/data/NC_045512.2.fas',
		outputFolder: '1000/',
		timeout: 10000
	},
	'10000': {
		alignmentFiles: ['./e2e/data/reads_10k.fastq.gz'],
		referenceFile: './e2e/data/NC_045512.2.fas',
		outputFolder: '10000/',
		timeout: 20000
	},
	'100000': {
		alignmentFiles: ['./e2e/data/reads_100k.fastq.gz'],
		referenceFile: './e2e/data/NC_045512.2.fas',
		outputFolder: '100000/',
		timeout: 60000
	},
	'1000000': {
		alignmentFiles: ['./e2e/data/reads.fastq.gz'], 
		referenceFile: './e2e/data/NC_045512.2.fas', 
		outputFolder: '1000000/', 
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
	const timeOutputLine = (await page.getByTestId('output-text').inputValue()).split('\n').filter(line => line.includes('ViralConsensus finished'))[0];
	const timeElapsed = timeOutputLine?.split(' ')?.slice(2)?.join('')?.replace(/[^0-9\.]/g, '') ?? '-1';
	await expect(parseFloat(timeElapsed)).toBeGreaterThan(0);
	await downloadFile(page, 'Download Consensus FASTA', BENCHMARK_DIR + downloadedLocation + browserName + '/');
	fs.appendFileSync(BENCHMARK_DIR + downloadedLocation + browserName + '/' + '/time.log', timeElapsed);
}