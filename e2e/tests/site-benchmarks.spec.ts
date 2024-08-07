import { test, expect } from '@playwright/test';
import fs from 'fs';

import { downloadFile, BENCHMARK_DIR, BENCHMARK_OUTPUT_DIR } from './constants';

const BENCHMARK_TESTS = ['10000', '20000', '40000', '100000', '200000', '400000'];
const TEST_COUNT = 5;

for (let i = 1; i <= TEST_COUNT; i++) {
	for (const sequenceSize of BENCHMARK_TESTS) {
		test('run benchmark - ' + sequenceSize + ', run ' + i, async ({ page, browserName }) => {
			await runBenchmark(page, browserName, ['./e2e/data/reads.' + sequenceSize + '.' + i + '.fastq.gz'], './e2e/data/NC_045512.fas', sequenceSize + '.' + i + '/', sequenceSize, i, 240000);
		});
	}
}
test('run benchmark - ' + 1000000 + ', run ' + 1, async ({ page, browserName }) => {
	await runBenchmark(page, browserName, ['./e2e/data/reads.' + 500000 + '.1.fastq.gz', './e2e/data/reads.' + 500000 + '.2.fastq.gz'], './e2e/data/NC_045512.fas', 1000000 + '.' + 1 + '/', '1000000', 1, 300000);
});

const runBenchmark = async (page, browserName: string, inputFiles: string[], referenceFile: string, downloadedLocation: string, sequenceSize: string, run: number, runTimeout: number) => {
	test.setTimeout(runTimeout + 60000);
	await page.goto('/');
	await expect(page.getByTestId('output-text')).toHaveValue(/ViralWasm-Consensus loaded./, { timeout: 15000 });
	await page.getByTestId('input-files').setInputFiles(inputFiles);
	await page.getByTestId('reference-file').setInputFiles(referenceFile);
	await page.getByTestId('trim-input-fastq').check();
	await page.getByTestId('trim-front-1').fill('5');
	await page.getByTestId('trim-tail-1').fill('5');
	await page.getByTestId('run').click();

	await expect(page.getByTestId('output-text')).toHaveValue(/Done! Time Elapsed:/, { timeout: runTimeout });

	const fastpTimeElapsed = await getTimeElapsed(page, 'Fastp finished');
	const viralConsensusTimeElapsed = await getTimeElapsed(page, 'ViralConsensus finished');
	const minimap2TimeElapsed = await getTimeElapsed(page, 'Minimap2 finished');

	const timeElapsed = (await page.getByTestId('duration-text').textContent()).replace(/[^0-9\.]/g, '');
	await expect(parseFloat(timeElapsed)).toBeGreaterThan(0);

	await expect(page.getByTestId('output-text')).toHaveValue(/Estimated Peak Memory/, { timeout: 30000 });
	const memoryLine = (await page.getByTestId('output-text').inputValue()).split('\n').filter(line => line.includes('Estimated Peak Memory'))[0];
	let peakMemory = parseFloat(memoryLine?.split(' ')?.slice(2)?.join('')?.replace(/[^0-9\.]/g, '') ?? '-1') * 1000;

	await downloadFile(page, 'Download Consensus FASTA', BENCHMARK_DIR + downloadedLocation + browserName + '/', 'consensus.' + sequenceSize + '.' + run + '.fa');
	await downloadFile(page, 'Download Trimmed Sequences', BENCHMARK_OUTPUT_DIR + downloadedLocation + browserName + '/', 'reads.' + sequenceSize + '.' + run + '.fastp.fastq.gz');
	fs.mkdirSync(BENCHMARK_DIR + downloadedLocation + browserName, { recursive: true });
	fs.writeFileSync(BENCHMARK_DIR + downloadedLocation + browserName + '/fastp_time.log', fastpTimeElapsed);
	fs.writeFileSync(BENCHMARK_DIR + downloadedLocation + browserName + '/viralconsensus_time.log', viralConsensusTimeElapsed);
	fs.writeFileSync(BENCHMARK_DIR + downloadedLocation + browserName + '/minimap2_time.log', minimap2TimeElapsed);
	fs.writeFileSync(BENCHMARK_DIR + downloadedLocation + browserName + '/time.log', timeElapsed);
	fs.writeFileSync(BENCHMARK_DIR + downloadedLocation + browserName + '/memory.log', '' + peakMemory);

	console.log(downloadedLocation);
	console.log('Time elapsed: ' + timeElapsed);
	console.log('Peak memory: ' + peakMemory);
}

const getTimeElapsed = async (page, filter: string) => {
	const outputLine = (await page.getByTestId('output-text').inputValue()).split('\n').filter(line => line.includes(filter))[0];
	return outputLine?.split(' ')?.slice(2)?.join('')?.replace(/[^0-9\.]/g, '') ?? '-1';
}