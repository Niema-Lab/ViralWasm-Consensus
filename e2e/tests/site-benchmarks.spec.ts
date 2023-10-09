import { test, expect } from '@playwright/test';
import fs from 'fs';

import { downloadFile, BENCHMARK_DIR } from './constants';

const BENCHMARK_TESTS = ['1000', '10000', '100000', '1000000'];
const TEST_COUNT = 5;

for (let i = 1; i <= TEST_COUNT; i++) {
	for (const sequenceSize of BENCHMARK_TESTS) {
		test('run benchmark - ' + sequenceSize + ', run ' + i, async ({ page, browserName }) => {
			await runBenchmark(page, browserName, ['./e2e/data/reads_' + sequenceSize + '.fastq.gz'], './e2e/data/NC_045512.fas', sequenceSize + '.' + i + '/', 240000);
		});
	}
}

const runBenchmark = async (page, browserName: string, alignmentFiles: string[], referenceFile: string, downloadedLocation: string, runTimeout: number) => {
	test.setTimeout(runTimeout + 60000);
	await page.goto('/');
	await expect(page.getByTestId('output-text')).toHaveValue(/ViralWasm-Consensus loaded./, { timeout: 15000 });
	await page.getByTestId('alignment-files').setInputFiles(alignmentFiles);
	await page.getByTestId('reference-file').setInputFiles(referenceFile);
	await page.getByTestId('run').click();

	await expect(page.getByTestId('output-text')).toHaveValue(/Done! Time Elapsed:/, { timeout: runTimeout });

	const viralConsensusTimeOutputLine = (await page.getByTestId('output-text').inputValue()).split('\n').filter(line => line.includes('ViralConsensus finished'))[0];
	const viralConsensusTimeElapsed = viralConsensusTimeOutputLine?.split(' ')?.slice(2)?.join('')?.replace(/[^0-9\.]/g, '') ?? '-1';
	const minimap2TimeOutputLine = (await page.getByTestId('output-text').inputValue()).split('\n').filter(line => line.includes('Minimap2 finished'))[0];
	const minimap2TimeElapsed = minimap2TimeOutputLine?.split(' ')?.slice(2)?.join('')?.replace(/[^0-9\.]/g, '') ?? '-1';

	const timeElapsed = (await page.getByTestId('duration-text').textContent()).replace(/[^0-9\.]/g, '');
	await expect(parseFloat(timeElapsed)).toBeGreaterThan(0);

	await expect(page.getByTestId('output-text')).toHaveValue(/Estimated Peak Memory/, { timeout: 30000 });
	const memoryLine = (await page.getByTestId('output-text').inputValue()).split('\n').filter(line => line.includes('Estimated Peak Memory'))[0];
	let peakMemory = parseFloat(memoryLine?.split(' ')?.slice(2)?.join('')?.replace(/[^0-9\.]/g, '') ?? '-1') * 1000;

	await downloadFile(page, 'Download Consensus FASTA', BENCHMARK_DIR + downloadedLocation + browserName + '/');
	fs.mkdirSync(BENCHMARK_DIR + downloadedLocation + browserName, { recursive: true });
	fs.writeFileSync(BENCHMARK_DIR + downloadedLocation + browserName + '/viralmsa_time.log', viralConsensusTimeElapsed);
	fs.writeFileSync(BENCHMARK_DIR + downloadedLocation + browserName + '/minimap2_time.log', minimap2TimeElapsed);
	fs.writeFileSync(BENCHMARK_DIR + downloadedLocation + browserName + '/time.log', timeElapsed);
	fs.writeFileSync(BENCHMARK_DIR + downloadedLocation + browserName + '/memory.log', '' + peakMemory);

	console.log(downloadedLocation);
	console.log('Time elapsed: ' + timeElapsed);
	console.log('Peak memory: ' + peakMemory);
}